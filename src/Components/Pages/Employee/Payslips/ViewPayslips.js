import React, { useEffect, useState } from 'react';
import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';
import { getFirestore, doc, getDoc } from "firebase/firestore";
// Import Firebase Auth
import { useAuth } from '../../../Context/AuthContext';

const ViewPayslips = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [payslips, setPayslips] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(''); // State for selected month
    const { user } = useAuth();

    useEffect(() => {
        const fetchPayslipData = async () => {
            const db = getFirestore();
            
            if (user) {
                const payslipDocRef = doc(db, "payslip", user.employeeUid);
                const payslipSnapshot = await getDoc(payslipDocRef);

                if (payslipSnapshot.exists()) {
                    const data = payslipSnapshot.data();
                    const payslipData = []; // Initialize payslipData

                    for (const month in data) {
                        if (data.hasOwnProperty(month)) {
                            payslipData.push({
                                id: user.employeeUid, // Employee ID
                                month, // Store month for later reference
                                ...data[month], // Monthly payslip data
                            });
                        }
                    }

                    setPayslips(payslipData); // Set the payslip data

                    // Set the initial selected month to the most recent one (if any)
                    if (payslipData.length > 0) {
                        setSelectedMonth(payslipData[0].month);
                    }
                } else {
                    setPayslips([]); // No payslip found, set to empty array
                }
            }
        };

        fetchPayslipData(); // Call the fetch function
    }, [user]);

    // Filter payslips based on the selected month
    const filteredPayslips = payslips.filter(payslip => payslip.month === selectedMonth);

    // Determine maxMonth based on the current date
    const currentDate = new Date();
    const maxMonth = currentDate.toISOString().slice(0, 7); // Format: YYYY-MM

    return (
        <div>
            <EmployeeSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h1>View Payslips</h1>

                {/* Month Filter */}
                <div className="d-flex mt-3 col-4">
                    <label htmlFor="monthFilter" className="ms-3 me-2">Select Month:</label>
                    <input
                        type="month"
                        id="monthFilter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={maxMonth} // Disable future months
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
                                filteredPayslips.map((payslip) => (
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
            </div>
        </div>
    );
}

export default ViewPayslips;
