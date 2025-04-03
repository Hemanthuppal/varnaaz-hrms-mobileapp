import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import {
  FaUserClock,
  FaCalendarCheck,
  FaCalendarWeek,
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaWalking,
} from "react-icons/fa";
import "./EmployeeSidebar.css";
import Profile from "../Logout/Logout";
import logo from "./../../Images/varnaazlogo.jpeg";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Header Section */}
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="company-logo" />
        </div>
        <div className="header-right">
          <div className="logout-button">
            <Profile />
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="sidebar">
        <ul className="nav">
          {/* Daily Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/e-attendence" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/e-attendence">
              <FaCalendarCheck className="nav-icon" />
              {/* <span className="link-text">Daily Attendance</span> */}
            </Link>
          </li>

          {/* View Weekly Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/viewattendence" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/viewattendence">
              <FaCalendarWeek className="nav-icon" />
              {/* <span className="link-text">Weekly Attendance</span> */}
            </Link>
          </li>

          {/* Monthly Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/e-monthlyattendence" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/e-monthlyattendence">
              <FaCalendarAlt className="nav-icon" />
              {/* <span className="link-text">Monthly Attendance</span> */}
            </Link>
          </li>

          {/* Leave Management */}
          <li
            className={`nav-item ${
              location.pathname === "/e-leave" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/e-leave">
              <FaWalking className="nav-icon" />
              {/* <span className="link-text">Leave Management</span> */}
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default EmployeeDashboard;
