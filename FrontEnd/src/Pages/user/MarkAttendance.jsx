import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarkAttendance.css";

const MarkAttendance = () => {
  const { state } = useLocation();  // receives { id, name }
  console.log(state); 
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail");  //  Get email


  // --- Check‑in -------------------------------------------------------------
  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/attendance", {
        id: state.id,
        name: state.name,
        email: email,           // email
        mode: "in",
      });
      toast.success(" Check‑in saved");
      navigate("/dashboard/user");
    } catch (err) {
      toast.error(err.response?.data?.error || " Check‑in failed");
    }
  };

  // --- Check‑out -----------------------------------------------------------
  const handleCheckOut = async () => {
  try {
    await axios.post("http://localhost:5000/api/attendance", {
      id: state.id,
      name: state.name,
      email: localStorage.getItem("userEmail"),  // make sure it's not undefined
      mode: "out",
    });
    toast.success("Check‑out saved");
    navigate("/dashboard/user");
  } catch (err) {
    toast.error(err.response?.data?.error || " Check‑out failed");
  }
};

  return (
    <div className="mark-container">
      <h2>Mark Attendance</h2>
      <form onSubmit={handleCheckIn}>
        <label>
          ID:&nbsp;<input readOnly value={state.id} />
        </label>
        <label>
          Name:&nbsp;<input readOnly value={state.name} />
        </label>

        <button type="submit">✔ Check In</button>
        <button type="button" onClick={handleCheckOut}>⏹ Check Out</button>
      </form>
    </div>
  );
};

export default MarkAttendance;
