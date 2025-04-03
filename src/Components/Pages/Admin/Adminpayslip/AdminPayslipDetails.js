import React, { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, where } from "firebase/firestore";
import './AdminPayslip.css';
import { Modal, Button, Form, Alert, Row, Col, Pagination } from 'react-bootstrap';

const PayslipTable = () => {
    const [payslips, setPayslips] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(''); // State to hold selected month
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(5);
    const maxButtonsToShow = 5;

    // Helper function to format date to YYYY-MM
    const formatDate = (date) => {
        const d = new Date(date.seconds ? date.seconds * 1000 : date); // Handle timestamp and Date object
        const year = d.getFullYear();
        const month = (`0${d.getMonth() + 1}`).slice(-2); // Ensure leading zero for single-digit months
        return `${year}-${month}`;
    };

    // Get the current month in YYYY-MM format
    const getCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (`0${today.getMonth() + 1}`).slice(-2); // Add leading zero for single-digit months
        return `${year}-${month}`;
    };

    useEffect(() => {
        const db = getFirestore();
        const payslipCollection = collection(db, "payslip");

        // Query to get only managers' payslips
        const managerPayslipQuery = query(payslipCollection, where("role", "==", "Manager"));

        // Real-time listener
        const unsubscribe = onSnapshot(managerPayslipQuery, (snapshot) => {
            const payslipList = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // Loop through each month's payslip data in the document
                Object.keys(data).forEach(monthKey => {
                    const payslipForMonth = data[monthKey];
                    if (payslipForMonth.role === "Manager") {  // Double check role inside nested data
                        payslipList.push({
                            id: doc.id,
                            ...payslipForMonth,  // Spread the nested payslip data
                        });
                    }
                });
            });

            setPayslips(payslipList);
        }, (error) => {
            console.error("Error fetching payslips: ", error);
        });

        setSelectedMonth(getCurrentMonth()); // Set initial selected month to current month

        // Clean up listener on unmount
        return () => unsubscribe();
    }, []);

    // Handle month selection change
    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    // Disable future months in the month selector
    const maxMonth = getCurrentMonth();

    // Filter payslips based on the selected month
    const filteredPayslips = payslips.filter(payslip => {
        const payslipMonth = formatDate(payslip.createdAt);
        return selectedMonth === '' || payslipMonth === selectedMonth;
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
        <div className="table-responsive">
            {/* Month Selector */}
            <div className="month-selector col-3">
                <label htmlFor="month">Select Month: </label>
                <input
                    type="month"
                    id="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    max={maxMonth} // Ensure future months are not selectable
                />
            </div>

            <div className="table-responsive">
                    <table className="styled-table">
                <thead>
                    <tr>
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
                    {filteredPayslips.length > 0 ? (
                        filteredPayslips.map(payslip => (
                            <tr key={payslip.id}>
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
    );
};

export default PayslipTable;
