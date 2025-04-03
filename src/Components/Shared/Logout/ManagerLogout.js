import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "./../../Context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Profile from "../../Pages/Manager/Dashboard/Profile";

const Logout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();


    return (
        <div>
            {/* <FontAwesomeIcon 
                icon={faSignOutAlt} 
                className="logout-icon" 
                onClick={handleLogout} 
                style={{ cursor: 'pointer', color: 'red', fontSize: '24px' }} 
            /> */}
            <div className="header">
                <div className="header-left">
                    {/* <img src={logo} alt="Logo" className="company-logo" /> */}
                </div>
                <div className="header-right">
                    <div className="logout-button2">
                        {/* <Logout /> */}
                        <Profile/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logout;
