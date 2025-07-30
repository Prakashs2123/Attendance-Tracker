// src/Pages/user/UserDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import dayjs from "dayjs";
import axios from "axios";
import { FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LeaveRequestModal from "./LeaveRequestModal";
import "./UserDashboard.css";
import UserNavbar from "../../component/Navbar/UserNavbar";

const UserDashboard = () => {
  const email = localStorage.getItem("userEmail") || "";
  const userId = localStorage.getItem("userId") || "";
  const userName = localStorage.getItem("userName") || "";
  const today = dayjs().format("DD MMMM YYYY");

  const clockRef = useRef();
  useEffect(() => {
    const updateClock = () => {
      if (clockRef.current) {
        clockRef.current.innerText = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [stats, setStats] = useState({ total: 0, onTime: 0, late: 0, early: 0, absent: 0 });

  const leaveTypes = [
    "Casual Leave", "Sick Leave", "Earned Leave",
    "Adjustment Leave", "Unpaid Leave", "Half Leave"
  ];

  const navigate = useNavigate();

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance", { params: { email } });
      setRecords(res.data.reverse());
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leave-usage", { params: { email } });
      setLeaveStats(res.data);
    } catch (err) {
      console.error("Error fetching leave stats:", err);
    }
  };

  const fetchAttendanceOverview = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/user/attendance-overview", {
      params: { email: email }
    });
    const data = res.data;

    const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mergedBarData = defaultDays.map(day => {
      const found = data.barChart.find(b => b.day === day);
      return found ? found : { day, actualHours: 0 };
    });

    setLineChartData(data.lineChart || []);
    setBarChartData(mergedBarData);
    setStats(data.stats || {});
  } catch (err) {
    console.error("Error fetching attendance overview:", err);
  }
};


  const handleLeaveSubmit = async () => {
    await fetchLeaveStats(); // ✅ ensures updated leave usage is fetched after submit
  };

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(fetchAttendance, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchLeaveStats();
  }, []);

  useEffect(() => {
    fetchAttendanceOverview();
  }, []);

  return (
    <div className="user-dashboard">
      <UserNavbar />
      <div className="top-row">
        <div className="clock-box">
          <FaCalendarAlt size={24} color="#555" />
          <h2 ref={clockRef}></h2>
          <p>Realtime Insight</p>
          <div className="date">{today}</div>
          <button
            className="view-btn"
            onClick={() =>
              navigate("/dashboard/mark-attendance", {
                state: { id: userId, name: userName }
              })
            }
          >
            Mark Attendance
          </button>
        </div>

        <div className="leave-grid">
          {leaveTypes.map((type, i) => {
            const stat = leaveStats[type] || { used: 0, total: 7 };
            const used = stat.used;
            const total = stat.total;
            return (
              <div className="leave-card" key={i}>
                <div className="leave-content">
                  <div className="circle">
                    <CircularProgressbar
                      value={used}
                      maxValue={total}
                      text={`${used}/${total}`}
                      styles={buildStyles({
                        pathColor: "#3366ff",
                        textColor: "#3366ff",
                        trailColor: "#e5e7eb",
                        textSize: "24px",
                      })}
                    />
                  </div>
                  <div className="leave-details">
                    <h4>{type}</h4>
                    <p>Remaining – {total - used}</p>
                    <p>Used – {used}</p>
                    <p>Total – {total}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="charts">
        <div className="line-chart">
          <div className="chart-header">
            <h4>Working Hours Comparison</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" interval={0} tick={{ fontSize: 12 }} allowDuplicatedCategory={false} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="actualHours" name="Actual Hours" stroke="#3366ff" strokeWidth={2} dot={{ fill: "#3366ff", r: 4 }} />
              <Line type="monotone" dataKey="expectedHours" name="Expected Hours" stroke="#ff6600" strokeWidth={2} dot={{ fill: "#ff6600", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bar-chart">
          <div className="chart-header">
            <h4>Average Hours by Weekday</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData} margin={{ bottom: 40 }}>
              <XAxis dataKey="day" angle={-25} textAnchor="end" interval={0} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="actualHours" name="Actual Hours" radius={[4, 4, 0, 0]} fill="#3366ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h4>Attendance Overview</h4>
          <div className="date-picker">
            <FaCalendarAlt /> <span>{today}</span>
          </div>
          <button className="view-btn" onClick={() => setShowLeaveModal(true)}>
            Update Leave
          </button>
        </div>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Check‑in</th>
              <th>Check‑out</th>
              <th>Work hours</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="5">No attendance yet</td></tr>
            ) : (
              records.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.day}</td>
                  <td className="blue-text">{r.checkIn}</td>
                  <td className="blue-text">{r.checkOut}</td>
                  <td>{r.workHours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onLeaveSubmitted={handleLeaveSubmit}
        userId={userId}
        userName={userName}
        email={email}
      />
    </div>
  );
};

export default UserDashboard;
