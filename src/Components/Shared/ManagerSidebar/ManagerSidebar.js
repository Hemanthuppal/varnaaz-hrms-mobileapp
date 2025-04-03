import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import {
  FaUserTie,
  FaUserCheck,
  FaClipboardList,
  FaCalendarCheck,
  FaRegCalendarAlt,
  FaCalendarAlt,
  FaWalking,
  FaFileAlt,
} from "react-icons/fa";
import "./ManagerSidebar.css";
import ManagerMyProfile from "../Logout/ManagerLogout";
import logo from "./../../Images/varnaazlogo.jpeg";

const ManagerDashboard = () => {
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
            <ManagerMyProfile />
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="sidebar">
        <ul className="nav">
          {/* View Employees */}
          <li
            className={`nav-item ${
              location.pathname === "/m-viewemployees" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-viewemployees">
              <FaUserTie className="manager-nav-icon" />
              {/* <span className="link-text">View Employees</span> */}
            </Link>
          </li>

          {/* Daily Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/m-Attendence" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-Attendence">
              <FaCalendarCheck className="manager-nav-icon" />
              {/* <span className="link-text">Daily Attendance</span> */}
            </Link>
          </li>

          {/* View Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/m-viewattendence" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-viewattendence">
              <FaRegCalendarAlt className="manager-nav-icon" />
              {/* <span className="link-text">View Attendance</span> */}
            </Link>
          </li>

          {/* Employee Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/m-employeeattendance" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-employeeattendance">
              <FaClipboardList className="manager-nav-icon" />
              {/* <span className="link-text">Employee Attendance</span> */}
            </Link>
          </li>

          {/* Monthly Attendance */}
          <li
            className={`nav-item ${
              location.pathname === "/m-monthlyattendance" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-monthlyattendance">
              <FaCalendarAlt className="manager-nav-icon" />
              {/* <span className="link-text">Monthly Attendance</span> */}
            </Link>
          </li>

          {/* Leave Management */}
          <li
            className={`nav-item ${
              location.pathname === "/m-leave" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-leave">
              <FaWalking className="manager-nav-icon" />
              {/* <span className="link-text">Leave Management</span> */}
            </Link>
          </li>

          {/* Employee Leave */}
          <li
            className={`nav-item ${
              location.pathname === "/m-employeeleave" ? "active" : ""
            }`}
          >
            <Link className="nav-link" to="/m-employeeleave">
              <FaFileAlt className="manager-nav-icon" />
              {/* <span className="link-text">Employee Leave</span> */}
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default ManagerDashboard;
