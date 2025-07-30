import React, { useState } from "react";
import "./AttendancePage.css";

const dummyEmployees = [
  {
    id: "emp001",
    password: "1234",
    name: "Amit Kumar",
    role: "Software Engineer",
  },
  {
    id: "emp002",
    password: "5678",
    name: "Sneha Rao",
    role: "HR Manager",
  },
];

const AttendancePage = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [employee, setEmployee] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const found = dummyEmployees.find(
      (emp) => emp.id === userId && emp.password === password
    );
    if (found) {
      setEmployee(found);
      setError("");
    } else {
      setError("Invalid ID or Password");
    }
  };

  const handleMarkAttendance = () => {
    setAttendanceMarked(true);
    // TODO: Send to backend
  };

  return (
    <div className="attendance-container">
      {!employee ? (
        <div className="login-box">
          <h2>Employee Login</h2>
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="info-box">
          <h2>Welcome, {employee.name}</h2>
          <p><strong>Employee ID:</strong> {employee.id}</p>
          <p><strong>Role:</strong> {employee.role}</p>

          {!attendanceMarked ? (
            <button className="mark-btn" onClick={handleMarkAttendance}>
              Mark Present
            </button>
          ) : (
            <p className="success">✅ Attendance marked successfully!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
