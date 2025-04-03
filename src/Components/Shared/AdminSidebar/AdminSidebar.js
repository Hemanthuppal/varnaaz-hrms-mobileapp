import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {FaUsers,FaCalendarAlt,FaUserPlus,FaTachometerAlt, FaCalendarCheck,FaUmbrellaBeach,FaWalking,FaFileInvoiceDollar,} from "react-icons/fa";
import { IoHomeOutline } from "react-icons/io5";
import "./AdminSidebar.css";
// import logo from "../../Img/Company_logo.png";
import logo from "./../../Images/varnaazlogo.jpeg";
import { useAuth } from "../../Context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom';


const AdminDashboard = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();


  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    onToggleSidebar(!collapsed);
  };

  const handleNavItemClick = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };
  const handleLogout = () => {
    logout();
    console.log('Logged out');
    navigate('/');
};
const navigate = useNavigate();
const { logout } = useAuth();

  return (
    <>
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">

          <div
            className={`admin-sidebar-toggle ${collapsed ? 'collapsed' : ''}`}
            onClick={toggleSidebar}
          >
            <IoHomeOutline className="toggle-icon" />
          </div> &nbsp;&nbsp;
          <img src={logo} alt="Logo" className="admin-company-logo" />
        </div>
        <div className="admin-header-right">
          <div className="logout-button">
            <FontAwesomeIcon 
                icon={faSignOutAlt} 
                className="logout-icon" 
                onClick={handleLogout} 
                style={{ cursor: 'pointer', color: 'red', fontSize: '24px' }} 
            />
          </div>
        </div>
      </div>

      <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-position-sticky">
          <ul className="nav flex-column">

            <h2 className="text-center">Admin</h2>

            <li className={`admin-nav-item ${location.pathname === '/a-dashboard' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-dashboard" onClick={handleNavItemClick}>
                <FaTachometerAlt className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Dashboard</span>}
              </Link>
            </li>

            {/* <li className={`admin-nav-item ${location.pathname === '/manager' ? 'active' : ''}`}>
              <Link className="nav-link" to="/manager" onClick={handleNavItemClick}>
                <FaUsers className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Manager</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/employee' ? 'active' : ''}`}>
              <Link className="nav-link" to="/employee" onClick={handleNavItemClick}>
                <FaUsers className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Employee</span>}
              </Link>
            </li> */}
            
            <li className={`admin-nav-item ${location.pathname === '/a-viewonboard' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-viewonboard" onClick={handleNavItemClick}>
                <FaUserPlus className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Onboarding</span>}
              </Link>
            </li>


            <li className={`admin-nav-item ${location.pathname === '/a-employeelist' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-employeelist" onClick={handleNavItemClick}>
                <FaUsers className="admin-nav-icon" />
                {!collapsed && <span className="link_text">View Employee</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/AdminAttendence-daily' ? 'active' : ''}`}>
              <Link className="nav-link" to="/AdminAttendence-daily" onClick={handleNavItemClick}>
                <FaCalendarCheck className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Daily Attendance</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/AdminAttendence-monthly' ? 'active' : ''}`}>
              <Link className="nav-link" to="/AdminAttendence-monthly" onClick={handleNavItemClick}>
                <FaCalendarAlt className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Monthly Attendance</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/AdminAdd-holiday' ? 'active' : ''}`}>
              <Link className="nav-link" to="/AdminAdd-holiday" onClick={handleNavItemClick}>
                <FaUmbrellaBeach className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Holiday List</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/a-leave' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-leave" onClick={handleNavItemClick}>
                <FaWalking className="admin-nav-icon" />
                {!collapsed && <span className="link_text">View Leaves</span>}
              </Link>
            </li>


            <li className={`admin-nav-item ${location.pathname === '/a-addpayslip' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-addpayslip" onClick={handleNavItemClick}>
                <FaFileInvoiceDollar className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Payslips</span>}
              </Link>
            </li>

            <li className={`admin-nav-item ${location.pathname === '/a-allpayslips' ? 'active' : ''}`}>
              <Link className="nav-link" to="/a-allpayslips" onClick={handleNavItemClick}>
                <FaUserPlus className="admin-nav-icon" />
                {!collapsed && <span className="link_text">View All Payslips</span>}
              </Link>
            </li>
                      
            {/* <li className={`admin-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Link className="nav-link" to="/" onClick={handleNavItemClick}>
                <FaFileInvoiceDollar className="admin-nav-icon" />
                {!collapsed && <span className="link_text">Logout</span>}
              </Link>
            </li> */}
          </ul>
        </div>
      </div>
      </div>
    </>
  );
};

export default AdminDashboard;
