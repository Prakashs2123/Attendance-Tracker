import React, { useState } from "react";
import "./LeaveRequestModal.css";
import DatePicker from "react-multi-date-picker";
import { FaCalendarAlt } from "react-icons/fa";

const LeaveRequestModal = ({ isOpen, onClose, onLeaveSubmitted, userId, userName, email }) => {
  const [type, setType] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || selectedDates.length === 0 || !reason) {
      alert("Please fill all fields");
      return;
    }

    const leaveData = {
      id: userId,
      name: userName,
      email,
      type,
      reason,
      dates: selectedDates.map(date => date.format("YYYY/MM/DD")),
      status: "Pending",
      requestedAt: new Date().toISOString(),
    };

    const res = await fetch("http://localhost:5000/api/leave-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveData),
    });

    if (res.ok) {
      await onLeaveSubmitted(); //  Ensure dashboard refreshes
      resetForm();
      onClose();
    } else {
      const errData = await res.json();
      alert(errData.error || "Failed to submit leave request");
    }
  };

  const resetForm = () => {
    setType("");
    setSelectedDates([]);
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="leave-modal">
        <div className="modal-header">
          <h3>Update Leave</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select leave type</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Adjustment Leave">Adjustment Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Half Leave">Half Leave</option>
            </select>
          </label>

          <div className="date-row">
            <label>Date</label>
            <div className="date-calendar">
              <DatePicker
                multiple
                value={selectedDates}
                onChange={setSelectedDates}
                format="YYYY/MM/DD"
                placeholder="Select date"
                inline
                mapDays={({ date }) => {
                  const isSelected = selectedDates.some(
                    d => d.format("YYYY/MM/DD") === date.format("YYYY/MM/DD")
                  );
                  return {
                    style: isSelected
                      ? { backgroundColor: "#007BFF", color: "white", borderRadius: "50%" }
                      : {}
                  };
                }}
              />
              <div className="icon"><span><FaCalendarAlt /></span></div>
            </div>
          </div>

          <label>
            Reason
            <textarea
              placeholder="Enter your reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          <button className="done-btn" type="submit">Done</button>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
