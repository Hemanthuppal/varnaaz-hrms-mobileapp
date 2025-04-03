import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase'; // Adjust the import path
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { ThreeDots } from 'react-loader-spinner';
import "./Monthlyattendance.css";
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import { useAuth } from '../../../Context/AuthContext';
import Pagination from 'react-bootstrap/Pagination';
import Navibar from '../../Manager/Managerheader/ManagerHeader';

function MonthlyAttendence() {
    // Utility functions
    const getFormattedMonth = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    const { user } = useAuth();
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

    const getAttendanceStatus = (userAttendance, dateKey, date) => {
        const today = new Date();

        // If the date is in the future, return an empty string
        if (date > today) {
            return ''; // Future days will be left blank
        }

        // Check if the date is a holiday
        if (holidays.some(holiday => holiday.date === dateKey)) {
            return 'F'; // 'F' for Festival
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
    const [holidays, setHolidays] = useState([]); // State to hold holiday data
    const [users, setUsers] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [currentDate] = useState(new Date());
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(getFormattedMonth(new Date()));
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // Pagination current page
    const [usersPerPage] = useState(10);

    const fetchManagerAttendance = async () => {
        try {
            const managerUid = user?.employeeUid;

            const usersQuery = query(
                collection(db, 'users'),
                where('assignedManagerUid', '==', managerUid)
            );

            const usersSnapshot = await getDocs(usersQuery);
            const matchedUsers = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUsers(matchedUsers);

            const employeeUids = matchedUsers.map(user => user.employeeUid);

            if (employeeUids.length === 0) {
                setAttendanceData([]);
                return;
            }

            const attendanceQuery = query(
                collection(db, 'attendance'),
                where(documentId(), 'in', employeeUids)
            );

            const attendanceSnapshot = await getDocs(attendanceQuery);
            const allAttendance = [];

            attendanceSnapshot.forEach(attendanceDoc => {
                const attendanceData = attendanceDoc.data();
                allAttendance.push({
                    id: attendanceDoc.id,
                    ...attendanceData
                });
            });

            setAttendanceData(allAttendance);
        } catch (error) {
            console.error('Error fetching attendance data: ', error);
        }
    };

    // Fetch holiday data
    const fetchHolidays = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'holidays'));
            const holidaysData = querySnapshot.docs.map(doc => doc.data());
            setHolidays(holidaysData);
        } catch (error) {
            console.error("Error fetching holidays data: ", error);
        }
    };

    useEffect(() => {

        fetchHolidays();
        setLoading(false);
    }, []);

    const processMonthlyAttendanceData = () => {
        const year = currentDate.getFullYear();
        const month = parseInt(selectedMonth.split('-')[1], 10) - 1; // Convert to 0-based month
        const monthDates = getMonthDates(year, month);
        const dateKeys = monthDates.map(formatDateForKey);

        const filteredUsers = selectedRole === 'All' ? users : users.filter(user => user.role === selectedRole);

        // This flag will check if there's any attendance data for the selected month
        let isAttendanceDataAvailable = false;

        const processedData = filteredUsers.map(user => {
            const userAttendance = attendanceData.find(entry => entry.id === user.id) || {};
            let totalPresent = 0;
            const dailyStatuses = dateKeys.map((dateKey, index) => {
                const status = getAttendanceStatus(userAttendance, dateKey, monthDates[index]);
                if (status === 'P') totalPresent++; // Count only 'P' as Present
                // If any attendance data is found, set the flag to true
                if (status !== 'A' && status !== 'H' && status !== 'F') {
                    isAttendanceDataAvailable = true;
                }
                return status;
            });

            return {
                ...user,
                dailyStatuses,
                totalPresent
            };
        });

        // If no attendance data is available for the selected month, return an empty array
        if (!isAttendanceDataAvailable) {
            return []; // This triggers the "No data found" message
        }

        return processedData;
    };

    const monthlyData = processMonthlyAttendanceData();

     // Pagination logic
     const indexOfLastUser = currentPage * usersPerPage;
     const indexOfFirstUser = indexOfLastUser - usersPerPage;
     const currentUsers = monthlyData.slice(indexOfFirstUser, indexOfLastUser);
     const totalPages = Math.ceil(monthlyData.length / usersPerPage);
 
     const renderPagination = () => {
         const maxButtonsToShow = 5;
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
             <Pagination >
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
 

    const handleDownloadExcel = () => {
        setIsDownloading(true); // Set loading state to true
        setTimeout(() => {
            // Your download logic here, e.g., calling an API to generate the Excel file
            // After download is complete, reset the loading state
            setIsDownloading(false);
          }, 3000); // Example delay (3 seconds)

        const maxDaysInMonth = getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).length;

        const orderedData = monthlyData.map(user => {
            const row = {
                'Employee Name': user.fullName || 'N/A',
                'Total Present': user.totalPresent || 0
            };

            user.dailyStatuses.forEach((status, index) => {
                row[index + 1] = status; // Columns for days
            });

            return row;
        });

        // Create the worksheet with explicit column order
        const ws = XLSX.utils.json_to_sheet(orderedData, {
            header: ['Employee Name', ...Array.from({ length: maxDaysInMonth }, (_, i) => (i + 1).toString()), 'Total Present']
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Attendance');
        XLSX.writeFile(wb, `Monthly_Attendance_Report_${selectedMonth}_${currentDate.getFullYear()}.xlsx`);
    };





    const maxMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    useEffect(() => {
        const fetchData = async () => {
            await fetchManagerAttendance();
            setLoading(false);
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
                    visible={true}
                />
            </div>
        );
    }

    return (
        <div className='manager-MonthlyAttendence'>
            <ManagerDashboard onToggleSidebar={setCollapsed} />
            <div className={`manager-MonthlyAttendence1 ${collapsed ? 'collapsed' : ''}`}>
                {/* <Navibar/> */}
                <div className="d-flex justify-content-center">
                    <h1 className='manager-monthlyattendance-heading'>Employees Monthly Attendance </h1>
                </div>

                <div className="d-flex justify-content-between mt-3">
                    <div className="d-flex align-items-center">
                        <label htmlFor="monthFilter" className="ms-3 me-2">Select Month:</label>
                        <input
                            type="month"
                            id="monthFilter"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            max={maxMonth}
                        />
                    </div>
                    {/* <button className="btn btn-primary export-button" onClick={handleDownloadExcel}>Download Excel</button> */}
                    <button
                        className="btn btn-primary export-button"
                        onClick={handleDownloadExcel}
                        disabled={isDownloading} // Disable button while downloading
                    >
                        {isDownloading ? 'Downloading...' : 'Download Excel'}
                    </button>
                </div>

                <div className=" mt-3">
                    {/* <table className="table table-striped"> */}
                    <div className='table-responsive'>
                    <table className="styled-table ">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                {getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).map(date => (
                                    <th key={date.getDate()}>{date.getDate().toString().padStart(2, '0')}</th>
                                ))}
                                <th>Total Present</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.length > 0 ? (
                                monthlyData.map((user, index) => (
                                    <tr key={index}>
                                        <td>{user.fullName || 'N/A'}</td>
                                        {user.dailyStatuses.map((status, dayIndex) => (
                                            <td
                                                key={dayIndex}
                                                style={{
                                                    color: status === 'P' ? 'green' : status === 'A' ? 'red' : status === 'F' ? 'blue' : 'purple',
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
                                    <td colSpan={getMonthDates(currentDate.getFullYear(), parseInt(selectedMonth.split('-')[1], 10) - 1).length + 2}>No data available</td>
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
        </div>
    );
}

export default MonthlyAttendence;
