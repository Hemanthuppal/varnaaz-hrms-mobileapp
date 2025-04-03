import React from 'react';
import Logout from './../Logout/Logout';
// import "./Header.css" ;
import logo from "./../../Images/varnaazlogo.jpeg";

const Header = () => {
  return (
    <div className="header">
         <img src={logo} alt="Logo" className="company-logo" />
      <h2>Varnaaz</h2>
      <div className="logout-button">
        <Logout />
      </div>
    </div>
  );
}

export default Header;
