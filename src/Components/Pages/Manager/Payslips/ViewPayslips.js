





import React, { useEffect, useState } from 'react';
import ManagerSidebar from '../../../Shared/ManagerSidebar/ManagerSidebar';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from '../../../Context/AuthContext';
import Pagination from 'react-bootstrap/Pagination'; // Import Pagination from Bootstrap

const ViewPayslips = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [payslips, setPayslips] = useState([]); 
    const [selectedMonth, setSelectedMonth] = useState(''); 
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const rowsPerPage = 5; // Number of rows per page
    const maxButtonsToShow = 5; // Number of pagination buttons to show

    useEffect(() => {
        const fetchPayslipData = async () => {
            const db = getFirestore();
            
            if (user) {
                const payslipDocRef = doc(db, "payslip", user.employeeUid);
                const payslipSnapshot = await getDoc(payslipDocRef);

                if (payslipSnapshot.exists()) {
                    const data = payslipSnapshot.data();
                    const payslipData = [];

                    for (const month in data) {
                        if (data.hasOwnProperty(month)) {
                            payslipData.push({
                                id: user.employeeUid, 
                                month,
                                ...data[month],
                            });
                        }
                    }

                    setPayslips(payslipData);
                    
                    if (payslipData.length > 0) {
                        setSelectedMonth(payslipData[0].month);
                    }
                } else {
                    setPayslips([]);
                }
            }
        };

        fetchPayslipData();
    }, [user]);

    const filteredPayslips = payslips.filter(payslip => payslip.month === selectedMonth);

    const handleDownloadPayslip = () => {
        const payslipForSelectedMonth = filteredPayslips[0]; 
        if (payslipForSelectedMonth && payslipForSelectedMonth.pdfUrl) {
            window.open(payslipForSelectedMonth.pdfUrl, '_blank'); 
        } else {
            alert('No payslip available for the selected month.');
        }
    };

    const currentDate = new Date();
    const maxMonth = currentDate.toISOString().slice(0, 7);

    // Pagination calculation
    const totalPages = Math.ceil(filteredPayslips.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPayslips.slice(indexOfFirstRow, indexOfLastRow);

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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                />
                {startPage > 1 && <Pagination.Ellipsis />}
                {pages}
                {endPage < totalPages && <Pagination.Ellipsis />}
                <Pagination.Next
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                />
            </Pagination>
        );
    };

    return (
        <div>
            <ManagerSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h1>View Payslip</h1>
                
                <div className="d-flex mt-3 col-4 align-items-center">
                    <label htmlFor="monthFilter" className="ms-3 me-2">Select Month:</label>
                    <input
                        type="month"
                        id="monthFilter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={maxMonth} 
                    />
                    {/* <button 
                        className="btn btn-primary ms-3"
                        onClick={handleDownloadPayslip}
                        disabled={filteredPayslips.length === 0}
                    >
                        Download Payslip
                    </button> */}
                </div>

                <div className="table-responsive mt-4">
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
                            {currentRows.length > 0 ? (
                                currentRows.map((payslip) => (
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
                                            <a href={payslip.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                View 
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10">No payslip found for this month.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Render pagination */}
                <div  style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}  className="pagination-container">
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};

export default ViewPayslips;
