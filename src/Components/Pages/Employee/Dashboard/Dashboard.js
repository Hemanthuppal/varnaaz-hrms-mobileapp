import React, { useState, useEffect } from 'react';
import EmployeeSidebar from './../../../Shared/EmployeeSidebar/EmployeeSidebar';

import { ThreeDots } from 'react-loader-spinner';
import './Dashboard.css';

function EmployeeDashboard() {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true); 
    useEffect(() => {
        const fetchData = async () => {
          // Simulate a network request
          await new Promise(resolve => setTimeout(resolve, 2000));
          setLoading(false); // Set loading to false after data is fetched
        };
    
        fetchData();
      }, []);
    
      if (loading) {
        return (
          <div className="loader-container">
            <ThreeDots 
              height="80" 
              width="80" 
              radius="9"
              color="#00BFFF"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
            />
          </div>
  );
}

    return (
        <div className='employee-dashboardContainer1'>
            <EmployeeSidebar onToggleSidebar={setCollapsed} />
            <div className={`employee-dashboard1 ${collapsed ? 'collapsed' : ''}`}>

                <h1>Dashboard</h1>
                <div className='employee-collapsed' style={{ display: "flex",flexWrap:"wrap"}}>
                   <h1>Employee</h1>
                </div>
               
               
            </div>
        </div>
    )
}

export default EmployeeDashboard
