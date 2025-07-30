from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
from collections import defaultdict

# ── Flask + CORS ───────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── MongoDB connection ─────────────────────────────────────────
client  = MongoClient("mongodb://localhost:27017/")
db      = client["attendance_db"]
users   = db["users"]
col_att = db["attendance"]
leave_collection = db["leave_requests"]

@app.route("/")
def home():
    return "Flask server is running!"

# ── LOGIN (email + password) ───────────────────────────────────
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 200

    data  = request.get_json()
    email = data.get("email", "").strip().lower()
    pwd   = data.get("password", "").strip()

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    if user["password"] != pwd:
        return jsonify({"error": "Incorrect password"}), 401

    return jsonify({
        "message": "Login successful",
        "email"  : user["email"],
        "name"   : user.get("name", ""),
        "id"     : user.get("id", ""),
        "role"   : user.get("role", "user")  # dynamic role (default to 'user')
    }), 200

# ── helper: compute HHh MMm between two datetimes ──────────────
def calc_hours(start: datetime, end: datetime) -> str:
    minutes = int((end - start).total_seconds() // 60)
    h, m    = divmod(minutes, 60)
    return f"{h}h {m}m"

# ── POST  /api/attendance  (check‑in / check‑out) ─────────────
@app.route("/api/attendance", methods=["POST"])
def mark_attendance():
    data    = request.get_json(force=True)
    user_id = data.get("id")           # required
    name    = data.get("name")         # required
    email   = data.get("email")        # required
    dept    = data.get("department", "Unknown")  # optional, if passed
    mode    = data.get("mode", "in")   # "in" | "out"

    if not name or not email or not user_id:
        return jsonify({"error": "id, name and email required"}), 400

    now       = datetime.now()
    today     = now.strftime("%d %B %Y")
    day_name  = now.strftime("%A")

    if mode == "in":
        col_att.update_one(
            {"email": email, "date": today},
            {"$set": {
                "id"          : user_id,
                "name"        : name,
                "email"       : email,
                "department"  : dept,
                "date"        : today,
                "day"         : day_name,
                "checkIn"     : now.strftime("%H:%M"),
                "checkInFull" : now.isoformat(),
                "checkOut"    : "",
                "workHours"   : ""
            }},
            upsert=True
        )
        return jsonify({"message": "check‑in saved"}), 200

    if mode == "out":
        rec = col_att.find_one({"email": email, "date": today})
        if not rec or "checkInFull" not in rec:
            return jsonify({"error": "No prior check‑in found"}), 400

        work = calc_hours(datetime.fromisoformat(rec["checkInFull"]), now)
        col_att.update_one(
            {"_id": rec["_id"]},
            {"$set": {
                "checkOut": now.strftime("%H:%M"),
                "workHours": work
            }}
        )
        return jsonify({"message": "check‑out saved"}), 200

    return jsonify({"error": "mode must be 'in' or 'out'"}), 400


# ── GET  /api/attendance?email=... ─────────────────────────────
@app.route("/api/attendance", methods=["GET"])
def list_attendance():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400
    docs = list(col_att.find({"email": email}, {"_id": 0}))
    return jsonify(docs), 200

# ── POST  /api/leave-request ─────────────────────────────────


@app.route("/api/leave-request", methods=["POST"])
def leave_request():
    data = request.get_json()
    required_fields = ["id", "name", "email", "type", "dates", "reason"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    #  Normalize all dates to same format
    normalized_dates = sorted({
        datetime.strptime(d, "%Y/%m/%d").strftime("%Y/%m/%d")
        for d in data["dates"]
    })

    leave_doc = {
        "id": data["id"],
        "name": data["name"],
        "email": data["email"],
        "type": data["type"],
        "dates": normalized_dates,
        "reason": data["reason"],
        "status": data.get("status", "Pending"),
        "requestedAt": data.get("requestedAt", datetime.utcnow().isoformat())
    }

    leave_collection.insert_one(leave_doc)
    return jsonify({"message": "Leave request submitted"}), 201

# ── GET /api/leave-usage?email=... ────────────────────────────

@app.route("/api/leave-usage", methods=["GET"])
def leave_usage():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    leave_types = [
        "Casual Leave", "Sick Leave", "Earned Leave",
        "Adjustment Leave", "Unpaid Leave", "Half Leave"
    ]

    usage = {}
    for leave_type in leave_types:
        requests = leave_collection.find({
            "email": email,
            "type": leave_type,
            "status": {"$ne": "Rejected"}
        })

        #  Normalize before adding to set
        all_dates = {
            datetime.strptime(d, "%Y/%m/%d").strftime("%Y/%m/%d")
            for req in requests
            for d in req.get("dates", [])
        }

        usage[leave_type] = {
            "used": len(all_dates),
            "total": 7
        }

    return jsonify(usage), 200

@app.route("/api/user/attendance-overview", methods=["GET"])
def user_attendance_overview():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Get date range - last 7 days
    today = datetime.now()
    start_date = today - timedelta(days=6)  # 7 days including today

    records = list(col_att.find({"email": email}))

    daily_hours = defaultdict(float)
    weekday_hours = defaultdict(float)

    on_time = late = early = absent = 0
    today_str = today.strftime("%d %B %Y")

    def parse_hours(h_str):
        if not h_str or "h" not in h_str:
            return 0
        try:
            parts = h_str.replace("m", "").split("h")
            h = int(parts[0].strip())
            m = int(parts[1].strip()) if parts[1].strip() else 0
            return h + m / 60
        except:
            return 0

    for r in records:
        date_str = r.get("date", "")
        try:
            date_obj = datetime.strptime(date_str, "%d %B %Y")
        except:
            continue

        # Skip records older than 7 days
        if date_obj < start_date:
            continue

        check_in = r.get("checkIn", "")
        check_out = r.get("checkOut", "")
        work_hours = parse_hours(r.get("workHours", ""))
        weekday = date_obj.strftime("%A")

        daily_hours[date_str] += work_hours
        weekday_hours[weekday] += work_hours

        if date_str == today_str:
            if not check_in:
                absent += 1
            else:
                try:
                    check_in_time = datetime.strptime(check_in, "%H:%M")
                    if check_in_time > datetime.strptime("10:00", "%H:%M"):
                        late += 1
                    else:
                        on_time += 1

                    if check_out:
                        check_out_time = datetime.strptime(check_out, "%H:%M")
                        if check_out_time < datetime.strptime("16:00", "%H:%M"):
                            early += 1
                except:
                    pass

    EXPECTED_HOURS = 9
    WEEKDAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    # Line chart — only recent 7 days
    line_chart = [
        {
            "date": d,
            "actualHours": round(h, 2),
            "expectedHours": EXPECTED_HOURS
        }
        for d, h in sorted(daily_hours.items(), key=lambda x: datetime.strptime(x[0], "%d %B %Y"))
    ]

    # Bar chart — only weekdays present in last 7 days
    bar_chart = [
        {"day": wd, "actualHours": round(weekday_hours.get(wd, 0), 2)}
        for wd in WEEKDAYS_ORDER
    ]

    return jsonify({
        "lineChart": line_chart,
        "barChart": bar_chart,
        "stats": {
            "onTime": on_time,
            "late": late,
            "early": early,
            "absent": absent,
            "total": len(daily_hours)  # Only recent days count
        }
    }), 200

# ── GET /api/admin/attendance-overview ────────
@app.route("/api/admin/attendance-overview", methods=["GET"])
def admin_attendance_data():
    records = list(col_att.find({}))

    table_data = []
    daily_hours_sum = defaultdict(float)
    daily_attendance_count = defaultdict(int)
    employee_hours_sum = defaultdict(float)
    employee_days_present = defaultdict(set)
    employee_ids = set()

    on_time_count = 0
    absent_ids = set()
    late_count = 0
    early_departure_count = 0
    time_off_count = 0

    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    last_7_days = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
    EXPECTED_HOURS = 9

    def parse_work_hours(value):
        if not value:
            return 0
        try:
            if "h" in value and "m" in value:
                h, m = value.lower().replace("m", "").split("h")
                return int(h.strip() or 0) + (int(m.strip() or 0) / 60)
        except:
            pass
        return 0

    for r in records:
        try:
            raw_date = r.get("date", "")
            try:
                parsed_date = datetime.strptime(raw_date, "%d %B %Y").strftime("%Y-%m-%d")
            except:
                parsed_date = raw_date

            emp_id = r.get("id", "")
            name = r.get("name", "")
            dept = r.get("department", "Unknown")
            check_in = r.get("checkIn", "")
            check_out = r.get("checkOut", "")
            work_hours = r.get("workHours", "")

            employee_ids.add(emp_id)

            if parsed_date in last_7_days and check_in:
                employee_days_present[emp_id].add(parsed_date)

            if parsed_date == today_str:
                if not check_in:
                    absent_ids.add(emp_id)
                else:
                    if check_in > "10:00":
                        late_count += 1
                    else:
                        on_time_count += 1
                    if check_out and check_out < "16:00":
                        early_departure_count += 1

            table_data.append({
                "id": emp_id,
                "name": name,
                "dept": dept,
                "date": parsed_date,
                "in": check_in,
                "out": check_out,
                "hours": work_hours
            })

            hours_val = parse_work_hours(work_hours)
            daily_hours_sum[parsed_date] += hours_val
            daily_attendance_count[parsed_date] += 1

            if parsed_date in last_7_days:
                employee_hours_sum[emp_id] += hours_val

        except Exception as e:
            print("Error processing record:", e)

    # Line chart: average hours per day
    line_data = []
    for date_str in last_7_days:
        hours_val = daily_hours_sum.get(date_str, 0)
        count_val = daily_attendance_count.get(date_str, 0) or 1
        avg_hours = round(hours_val / count_val, 2)
        formatted_date = datetime.strptime(date_str, "%Y-%m-%d").strftime("%d %B %Y")
        line_data.append({
            "date": formatted_date,
            "actualHours": avg_hours,
            "expectedHours": EXPECTED_HOURS
        })

    # Bar chart: average hours per employee
    bar_data = []
    for emp_id in sorted(employee_ids):
        days_present = len(employee_days_present.get(emp_id, set())) or 1
        avg_hours = round(employee_hours_sum.get(emp_id, 0) / days_present, 2)
        bar_data.append({
            "id": emp_id,
            "actualHours": avg_hours,
            "expectedHours": EXPECTED_HOURS
        })

    return jsonify({
        "table": sorted(table_data, key=lambda x: x["date"], reverse=True),
        "lineChart": line_data,
        "barChart": bar_data,
        "stats": {
            "total": len(employee_ids),
            "onTime": on_time_count,
            "absent": len(absent_ids),
            "late": late_count,
            "early": early_departure_count,
            "timeoff": time_off_count
        }
    }), 200


# ── RUN ────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
