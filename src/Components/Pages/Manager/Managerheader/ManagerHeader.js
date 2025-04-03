import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaCalendarCheck } from 'react-icons/fa';
import './ManagerHeader.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="manageremployee_navbar bg-light">
      <div className="container-fluid d-flex justify-content-center">
        <ul className="manageremployee_navbar-nav d-flex flex-row align-items-center">
          <li className={`manageremployee_nav-item mx-3 ${location.pathname === '/m-emponboarding' ? 'active' : ''}`}>
            <Link className="manageremployee_nav-link text-center" to="/m-emponboarding">
              {/* <FaTachometerAlt className="nav-icon" /> */}
              <div className="manageremployee_link_text">Onboarding</div>
            </Link>
          </li>
          <li className={`manageremployee_nav-item mx-3 ${location.pathname === '/m-viewemployees' ? 'active' : ''}`}>
            <Link className="manageremployee_nav-link text-center" to="/m-viewemployees">
              {/* <FaCalendarCheck className="nav-icon" /> */}
              <div className="manageremployee_link_text">Employees</div>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
