import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { ThreeDots } from 'react-loader-spinner';
import { useAuth } from '../../../Context/AuthContext';
import ManagerSidebar from '../../../Shared/ManagerSidebar/ManagerSidebar';
import './EmployeeAttendance.css';
import ReactPaginate from 'react-paginate';
import Navbar from '../../Manager/Managerheader/ManagerHeader'

const EmployeeAttendance = () => {
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5); // Number of rows per page

    const fetchManagerAttendance = async () => {
        try {
            const managerUid = user?.employeeUid;

            const usersQuery = query(
                collection(db, 'users'),
                where('employeeUid', '==', managerUid)
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

    const handleDownloadExcel = () => {
        setIsDownloading(true); // Set loading state to true
       
        setTimeout(() => {
           
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

    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
    };

    const paginatedData = monthlyData.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

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
            <ManagerSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-MonthlyAttendence1 ${collapsed ? 'collapsed' : ''}`}>
            {/* <Navbar/> */}
                <div className="d-flex justify-content-center">
                    <h1 className='manager-monthlyattendance-heading'>My Monthly Attendance </h1>
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

                <div className="table-responsive mt-3">
                    {/* <table className="table table-striped "> */}
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
                            {paginatedData.length > 0 ? (
                                paginatedData.map((user, index) => (
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
                <div>
                       {/* Pagination */}
                      <ReactPaginate
                        previousLabel={"<"}
                        nextLabel={">"}
                        pageCount={Math.ceil(monthlyData.length / itemsPerPage)}
                        onPageChange={handlePageClick}
                        containerClassName={"pagination justify-content-center"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        previousLinkClassName={"page-link"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        breakLinkClassName={"page-link"}
                        activeClassName={"active"}
                    /> 
                    </div>
            </div>
        </div>
    );
}

export default EmployeeAttendance;
