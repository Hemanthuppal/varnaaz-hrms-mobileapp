import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../Shared/AdminSidebar/AdminSidebar';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import './ViewAllpayslips.css';
import { Modal, Button, Form, Alert, Row, Col, Pagination } from 'react-bootstrap';

const ViewAllpayslips = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [payslips, setPayslips] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const [selectedRole, setSelectedRole] = useState('All'); // State for role filter
    const maxMonth = currentMonth; // Disable future months
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(5);
    const maxButtonsToShow = 5;

    const fetchPayslipData = async () => {
        try {
            const payslipCollection = collection(db, 'payslip');
            const payslipSnapshot = await getDocs(payslipCollection);
            const payslipData = [];

            payslipSnapshot.docs.forEach(doc => {
                const data = doc.data();
                for (const month in data) {
                    if (data.hasOwnProperty(month)) {
                        payslipData.push({
                            id: doc.id,
                            ...data[month], // Spread the payslip data for the month
                        });
                    }
                }
            });

            setPayslips(payslipData);
        } catch (error) {
            console.error('Error fetching payslip data: ', error);
        }
    };

    useEffect(() => {
        fetchPayslipData();
        setSelectedMonth(currentMonth); // Set default selected month to current month
    }, [currentMonth]);

    // Filter payslips based on selected month and role
    // const filteredPayslips = payslips.filter((payslip) => {
    //     const monthMatches = selectedMonth ? payslip.selectedMonth === selectedMonth : true;
    //     const roleMatches = selectedRole === 'All' || payslip.role === selectedRole;
    //     return monthMatches && roleMatches;
    // });

    // Function to format month and year for display
    const getMonthName = (monthString) => {
        const date = new Date(`${monthString}-01`); // Create a date object with the first day of the month
        return date.toLocaleString('default', { month: 'long', year: 'numeric' }); // Format to full month name and year
    };

    // Handler for role selection change
    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };


    // Handler for role selection change
    // const handleRoleChange = (e) => {
    //     setSelectedRole(e.target.value);
    // };
    const filteredPayslips = payslips.filter((payslip) => {
        const monthMatches = selectedMonth ? payslip.selectedMonth === selectedMonth : true;
        const roleMatches = selectedRole === 'All' || payslip.role === selectedRole;
        return monthMatches && roleMatches;
    });
    
    const indexOfLastPayslip = currentPage * recordsPerPage;
    const indexOfFirstPayslip = indexOfLastPayslip - recordsPerPage;
    const currentPayslips = filteredPayslips.slice(indexOfFirstPayslip, indexOfLastPayslip);
    
    const totalPages = Math.ceil(filteredPayslips.length / recordsPerPage);
    
    const renderPagination = () => {
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
        if (endPage - startPage + 1 < maxButtonsToShow) {
            startPage = Math.max(1, endPage - maxButtonsToShow + 1);
        }
    
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Pagination.Item
                    key={i}
                    active={i === currentPage}
                    onClick={() => setCurrentPage(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }
    
        return (
            <Pagination>
                <Pagination.Prev
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                />
                {startPage > 1 && <Pagination.Ellipsis />}
                {pages}
                {endPage < totalPages && <Pagination.Ellipsis />}
                <Pagination.Next
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                />
            </Pagination>
        );
    };
    

    return (
        <div>
            <AdminSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h2 className='allpayheading text-center'>Payslips for {getMonthName(selectedMonth)}</h2>
                <div style={{width:'50%'}} className="d-flex mt-3 col-4">
                    <label htmlFor="monthFilter" className="ms-3 me-2">Select Month:</label>
                    <input
                        type="month"
                        id="monthFilter"
                        className='monthfilterpayslips'
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={maxMonth} // Disable future months
                    />
                {/* </div>

                <div className="d-flex mt-3 col-4"> */}
                    <label htmlFor="roleSelect" className="ms-3 me-2">Select Role:</label>
                    <select
                        className="leavfilter"
                        id="roleSelect"
                        value={selectedRole}
                        onChange={handleRoleChange}
                    >
                        <option value="All">All</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                    </select>
                </div>
      
                <div className="table-responsive">
                    {/* <table className="table table-bordered paysliptable"> */}
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>S.no</th>
                                <th>Date</th>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Role</th>
                                <th>Basic Salary</th>
                                <th>Travelling Allowance</th>
                                <th>EPF</th>
                                <th>Professional Tax</th>
                                <th>Net Salary</th>
                                <th>Payslip</th>
                            </tr>
                        </thead>
                        <tbody>
    {currentPayslips.length > 0 ? (
        currentPayslips.map((payslip,index) => (
            <tr key={payslip.id}>
                <td>{index + 1}</td>
                <td>{new Date(payslip.createdAt.seconds * 1000).toLocaleDateString()}</td>
                <td>{payslip.employeeId}</td>
                <td>{payslip.fullName}</td>
                <td>{payslip.role}</td>
                <td>{payslip.basicsalary}</td>
                <td>{payslip.travellingAllowance}</td>
                <td>{payslip.epf}</td>
                <td>{payslip.professionalTax}</td>
                <td>{payslip.netSalary}</td>
                <td>
                    <a
                        href={payslip.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View
                    </a>
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="10">No payslips available for the selected month.</td>
        </tr>
    )}
</tbody>

                    </table>
                   
                </div>
                <div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};

export default ViewAllpayslips;
