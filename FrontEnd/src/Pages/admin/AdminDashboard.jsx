import React, { useEffect, useState, useRef } from "react";
import {
  FaUsers, FaClock, FaUserTimes, FaCalendarCheck,
  FaSignOutAlt, FaPlaneDeparture, FaCalendarAlt, FaSearch
} from "react-icons/fa";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "./AdminDashboard.css";

dayjs.extend(isoWeek);

const AdminDashboard = () => {
  const [tableRows, setTableRows] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statsData, setStatsData] = useState({
    total: 0,
    onTime: 0,
    absent: 0,
    late: 0,
    early: 0,
    timeoff: 0
  });

  const today = dayjs().format("DD MMMM YYYY");
  const tableRef = useRef(null);

  // ⏱ Clock updates every minute
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch on load
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/attendance-overview")
      .then(res => res.json())
      .then(data => {
        setTableRows(data.table || []);
        setAttendanceData(data.lineChart || []);
        setWeeklyAttendance(data.barChart || []);
        setStatsData(data.stats || {});
      })
      .catch(err => console.error(" Error fetching:", err));
  }, []);

  // Filter + Sort (Backend sends date as YYYY-MM-DD)
  const filteredRows = tableRows
    .filter(row =>
      row.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

  const stats = [
    { icon: <FaUsers />, value: statsData.total, label: "Total Employees", note: `${statsData.total} active records`, color: "green" },
    { icon: <FaClock />, value: statsData.onTime, label: "On Time", note: "Compared to yesterday", color: "green" },
    { icon: <FaUserTimes />, value: statsData.absent, label: "Absent", note: "Check missed today", color: "red" },
    { icon: <FaCalendarCheck />, value: statsData.late, label: "Late Arrival", note: "Arrived after 10 AM", color: "red" },
    { icon: <FaSignOutAlt />, value: statsData.early, label: "Early Departures", note: "Left before 4 PM", color: "green" },
    { icon: <FaPlaneDeparture />, value: statsData.timeoff, label: "Time‑off", note: "Leave records", color: "blue" }
  ];

  return (
    <div className="dashboard">
      {/* TOP ROW */}
      <div className="top-row">
        <div className="clock-box">
          <FaCalendarAlt size={24} color="#555" />
          <h2>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</h2>
          <p>Realtime Insight</p>
          <div className="date">{today}</div>
          <button
            className="view-btn"
            onClick={() => tableRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            View Attendance
          </button>
        </div>

        <div className="stat-cards">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-header">
                <div className="stat-value">{s.value}</div>
                <div className="icon">{s.icon}</div>
              </div>
              <div className="stat-label">{s.label}</div>
              <div className={`note ${s.color}`}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS */}
      <div className="chart-section">
        {/* Line Chart */}
        <div className="line-chart">
          <div className="chart-header">
            <h4>Daily Working Hours</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => dayjs(d, "DD MMMM YYYY").format("DD MMM")}
              />
              <YAxis domain={[0, 12]} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip
                labelFormatter={(d) => dayjs(d, "DD MMMM YYYY").format("DD MMM YYYY")}
                formatter={(v) => `${v} hrs`}
              />
              <Line
                type="monotone"
                dataKey="actualHours"
                stroke="#3366ff"
                name="Actual Hours"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expectedHours"
                stroke="#ff9933"
                name="Expected Hours"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bar-chart">
          <div className="chart-header">
            <h4>Weekly Average Hours (by Employee)</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
              <XAxis dataKey="id" angle={-25} textAnchor="end" interval={0} />
              <YAxis domain={[0, 12]} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v) => `${v} hrs`} />
              <Bar dataKey="actualHours" radius={[4, 4, 0, 0]} fill="#3366ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="table-card" ref={tableRef}>
        <div className="table-header">
          <h4>Attendance Overview</h4>
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Quick Search by ID or Name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="date-picker">
            <FaCalendarAlt />
            <span>{dayjs().format("DD MMM YYYY")}</span>
          </div>
        </div>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Check‑in</th>
              <th>Check‑out</th>
              <th>Work hours ▾</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => (
              <tr key={i}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{dayjs(r.date).format("DD MMMM YYYY")}</td>
                <td className="blue-text">{r.in}</td>
                <td className="blue-text">{r.out}</td>
                <td>{r.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
