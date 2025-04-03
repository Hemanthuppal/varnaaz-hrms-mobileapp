import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, onSnapshot, getDoc, query, where } from "firebase/firestore";
import { useAuth } from '../../../Context/AuthContext';
import './AddPayslip.css';

const PayslipTable = () => {
    const [payslips, setPayslips] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(''); // State for selected month
    const { user } = useAuth();
    const db = getFirestore();

    // Helper function to format date to YYYY-MM
    const formatDate = (date) => {
        const d = new Date(date.seconds ? date.seconds * 1000 : date); // Handle both timestamp and Date
        const year = d.getFullYear();
        const month = (`0${d.getMonth() + 1}`).slice(-2); // Add leading zero
        return `${year}-${month}`;
    };

    // Get the current month in YYYY-MM format
    const getCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (`0${today.getMonth() + 1}`).slice(-2); // Add leading zero to month
        return `${year}-${month}`;
    };

    useEffect(() => {
        setSelectedMonth(getCurrentMonth()); // Set initial selected month to current month

        if (!user || !user.employeeUid) return;

        const usersCollection = collection(db, "users");
        const employeeQuery = query(usersCollection, where("assignedManagerUid", "==", user.employeeUid));

        const unsubscribeUsers = onSnapshot(employeeQuery, async (userSnapshot) => {
            const employeeUids = userSnapshot.docs.map(doc => doc.data().employeeUid);

            if (employeeUids.length === 0) return;

            const payslipData = [];
            for (const employeeUid of employeeUids) {
                const payslipDocRef = doc(db, 'payslip', employeeUid);
                const payslipSnapshot = await getDoc(payslipDocRef);

                if (payslipSnapshot.exists()) {
                    const data = payslipSnapshot.data();
                    for (const month in data) {
                        if (data.hasOwnProperty(month)) {
                            payslipData.push({
                                id: employeeUid,
                                ...data[month], // Monthly payslip data
                            });
                        }
                    }
                }
            }

            setPayslips(payslipData); // Set the fetched payslip data
        }, (error) => {
            console.error("Error fetching users or payslips: ", error);
        });

        return () => unsubscribeUsers();
    }, [user, db]);

    // Function to handle month selection change
    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    // Filter payslips based on the selected month
    const filteredPayslips = payslips.filter(payslip => {
        const payslipMonth = formatDate(payslip.createdAt);
        return selectedMonth === '' || payslipMonth === selectedMonth;
    });

    // Disable future months
    const maxMonth = getCurrentMonth(); // Current month is the maximum selectable month

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
                    max={maxMonth} // Disable future months by setting the max attribute
                />
            </div>

            <table className="styled-table ">
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
                                    <a href={payslip.pdfUrl} target="_blank" rel="noopener noreferrer">
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10">No payslip found for the selected month.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PayslipTable;