import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase'; // Adjust the import path
import { collection, getDocs } from 'firebase/firestore';
import Pagination from 'react-bootstrap/Pagination'; 
import { ThreeDots } from 'react-loader-spinner';
import "./MonthlyAttendence.css"
import AdminDashboard from '../../../Shared/AdminSidebar/AdminSidebar';
import * as XLSX from 'xlsx';

function MonthlyAttendence() {
    // Utility functions
    const getFormattedMonth = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const getMonthDates = (year, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    };

    const formatDateForKey = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const getAttendanceStatus = (userAttendance, dateKey, date, holidays) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date > today) {
            return ''; // Future dates are left blank
        }

        // Check if the date is a holiday
        const isHoliday = holidays.some(holiday => holiday.date === dateKey);
        if (isHoliday) {
            return 'F'; // 'F' for Festival (Holiday)
        }

        const dayAttendance = userAttendance[dateKey];
        if (dayAttendance && dayAttendance.statuses === 'Present') {
            return 'P'; // 'P' for Present
        } else if (date.getDay() === 0) {
            return 'H'; // 'H' for Holiday (Sunday)
        } else {
            return 'A'; // 'A' for Absent
        }
    };

    const [collapsed, setCollapsed] = useState(false);
    const [users, setUsers] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidays, setHolidays] = useState([]); // State for holidays data
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRole, setSelectedRole] = useState('All'); // State to hold the selected role
    const [selectedMonth, setSelectedMonth] = useState(getFormattedMonth(new Date())); // State to hold the selected month

    const [currentPage, setCurrentPage] = useState(1); // For pagination
    const usersPerPage = 5; // Set the number of users per page
    const maxButtonsToShow = 5; // Number of pagination buttons to show

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const userData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
                .filter(user => user.role === 'Employee' || user.role === 'Manager'); // Filter by roles
            setUsers(userData);
        } catch (error) {
            console.error("Error fetching users data: ", error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'attendance'));
            const attendance = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAttendanceData(attendance);
        } catch (error) {
            console.error("Error fetching attendance data: ", error);
        }
    };

    // Fetch holiday data from the holidays collection
    const fetchHolidays = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'holidays'));
            const holidayData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHolidays(holidayData);
        } catch (error) {
            console.error("Error fetching holidays data: ", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAttendance();
        fetchHolidays(); // Fetch holidays when the component mounts
    }, []);

    const processMonthlyAttendanceData = () => {
        const year = currentDate.getFullYear();
        const month = parseInt(selectedMonth.split('-')[1], 10) - 1; // Convert to 0-based month
        const monthDates = getMonthDates(year, month);
        const dateKeys = monthDates.map(formatDateForKey);

        const filteredUsers = selectedRole === 'All' ? users : users.filter(user => user.role === selectedRole);

        return filteredUsers.map(user => {
            const userAttendance = attendanceData.find(entry => entry.id === user.id) || {};
            let totalPresent = 0;
            const dailyStatuses = dateKeys.map((dateKey, index) => {
                const date = monthDates[index];
                const status = getAttendanceStatus(userAttendance, dateKey, new Date(date), holidays); // Pass holidays data
                if (status === 'P') totalPresent++; // Count only 'P' as Present
                return status;
            });

            return {
                ...user,
                dailyStatuses,
                totalPresent
            };
        });
    };

    const monthlyData = processMonthlyAttendanceData();

    const downloadExcel = () => {
        const wsData = [
            ['Employee Name', ...getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).map(date => date.getDate().toString().padStart(2, '0')), 'Total Present']
        ];

        monthlyData.forEach(user => {
            const row = [
                user.fullName || 'N/A',
                ...user.dailyStatuses,
                user.totalPresent
            ];
            wsData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance Data');

        XLSX.writeFile(wb, `Monthly_Attendance_${selectedMonth}.xlsx`);
    };

    // Get current year and month for the max date attribute
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const maxMonth = `${currentYear}-${currentMonth}`;


    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Simulate a network request
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLoading(false); // Set loading to false after data is fetched
        };

        fetchData();
    }, []);

    // Pagination Logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const paginatedData = monthlyData.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(monthlyData.length / usersPerPage);

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
            <Pagination style={{marginLeft:'535px'}}>
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
        <div className='monthlyattendance-container'>
            <AdminDashboard onToggleSidebar={setCollapsed} />
            <div className={`monthlyattendance-content ${collapsed ? 'collapsed' : ''}`}>
                <div className="d-flex justify-content-center">
                    <h1 className='monthlyattendance-heading'>Monthly Attendance for {new Date(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h1>
                </div>
                <div className="monthly-filter-container">
                    <label htmlFor="role-select" className="me-2">Role:</label>
                    <select
                        id="role-select"
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value)}
                        className="me-3 filter-select"
                    >
                        <option value="All">All</option>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                    </select>

                    <label htmlFor="monthFilter" className="me-2">Select Month:</label>
                    <input
                        type="month"
                        id="monthFilter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={maxMonth}
                        className="me-3 filter-month"
                    />

                    <button onClick={downloadExcel} className="btn btn-primary download-btn">Download Excel</button>
                </div>



                <div className="table-responsive mt-3">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                {getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).map(date => (
                                    <th key={date.getDate()}>{date.getDate().toString().padStart(2, '0')}</th>
                                ))}
                                <th>Total Present</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 && monthlyData.some(user => user.totalPresent > 0) ? (
                                paginatedData.map((user, index) => (
                                    <tr key={index}>
                                        <td>{user.fullName || 'N/A'}</td>
                                        {user.dailyStatuses.map((status, dayIndex) => (
                                            <td
                                                key={dayIndex}
                                                style={{
                                                    color: status === 'P' ? 'green' : status === 'A' ? 'red' : status === 'F' ? 'blue' : 'black', // Use blue for "F"
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {status}
                                            </td>
                                        ))}
                                        <td>{user.totalPresent}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).length + 2}>No data found</td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                    {renderPagination()} {/* Pagination rendering */}
                </div>
            </div>
        </div>
    )
}

export default MonthlyAttendence;
