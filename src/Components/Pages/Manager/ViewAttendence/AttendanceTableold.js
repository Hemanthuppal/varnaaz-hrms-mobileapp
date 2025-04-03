import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Context/AuthContext';
import { db } from '../../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Pagination } from 'react-bootstrap';
import './AttendenceTable.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Manager/Managerheader/ManagerHeader'

const getWeekStartDate = (date) => {
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust if day is Sunday
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    return startDate;
};

function ManagerAttendenceTable() {
    const { user } = useAuth();
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    // Week navigation state
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(getWeekStartDate(new Date()));

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5; // Number of records per page
    const maxButtonsToShow = 5; // Maximum pagination buttons to show

    // Pagination calculations
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = attendanceData.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(attendanceData.length / recordsPerPage);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const attendanceRef = doc(db, 'attendance', user.employeeUid);
                const attendanceSnap = await getDoc(attendanceRef);

                if (attendanceSnap.exists()) {
                    const data = attendanceSnap.data() || {};
                    // Convert attendance data into an array and parse dates
                    const attendanceArray = Object.entries(data).map(([dateStr, record]) => ({
                        date: dateStr,
                        ...record,
                    }));
                    setAttendanceData(attendanceArray);
                } else {
                    setAttendanceData([]);
                }
            } catch (error) {
                console.error('Error fetching attendance data:', error);
                setError('Failed to fetch attendance data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [user]);

    useEffect(() => {
        // Filter attendance data for the current week whenever the week changes
        filterAttendanceForWeek(currentWeekStartDate);
    }, [currentWeekStartDate, attendanceData]);

    const filterAttendanceForWeek = (weekStartDate) => {
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        const filteredData = attendanceData.filter((record) => {
            const recordDate = new Date(record.date.split('-').reverse().join('-')); // Assuming date format is 'dd-mm-yyyy'
            return recordDate >= weekStartDate && recordDate <= weekEndDate;
        });

        // Sort the filtered data by date
        filteredData.sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        setFilteredAttendance(filteredData);
        setCurrentPage(1); // Reset to first page whenever data changes
    };

    const [filteredAttendance, setFilteredAttendance] = useState([]);

    // Pagination calculations for filtered data
    const totalFilteredPages = Math.ceil(filteredAttendance.length / recordsPerPage);
    const indexOfLastFilteredRecord = currentPage * recordsPerPage;
    const indexOfFirstFilteredRecord = indexOfLastFilteredRecord - recordsPerPage;
    const currentFilteredRecords = filteredAttendance.slice(
        indexOfFirstFilteredRecord,
        indexOfLastFilteredRecord
    );

    function formatDate(dateString) {
        // Check if dateString is not a string and convert it if necessary
        if (dateString instanceof Date) {
            dateString = dateString.toISOString().split('T')[0]; // Convert Date to 'YYYY-MM-DD' format
        } else if (typeof dateString !== 'string') {
            console.error('formatDate expects a string or Date object');
            return ''; // Return an empty string or handle the error as needed
        }

        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }


    const handlePreviousWeek = () => {
        const newStartDate = new Date(currentWeekStartDate);
        newStartDate.setDate(newStartDate.getDate() - 7);
        setCurrentWeekStartDate(getWeekStartDate(newStartDate));
    };

    const handleNextWeek = () => {
        if (nextWeekDisabled) return; // Do nothing if next week is disabled

        const newStartDate = new Date(currentWeekStartDate);
        newStartDate.setDate(newStartDate.getDate() + 7);
        setCurrentWeekStartDate(getWeekStartDate(newStartDate));
    };


    const renderPagination = () => {
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalFilteredPages, startPage + maxButtonsToShow - 1);

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
                {endPage < totalFilteredPages && <Pagination.Ellipsis />}
                <Pagination.Next
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalFilteredPages))}
                    disabled={currentPage === totalFilteredPages}
                />
            </Pagination>
        );
    };

    const nextWeekDisabled = (() => {
        const nextWeekStartDate = new Date(currentWeekStartDate);
        nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
        return nextWeekStartDate > new Date(); // Disables if the next week's start date is in the future
    })();



    const [isModalOpen, setIsModalOpen] = useState({ checkIn: false, checkOut: false });

    // Function to handle opening the modal for a specific field
    const openModal = (field) => {
        setIsModalOpen({ ...isModalOpen, [field]: true });
    };

    // Function to handle closing the modal
    const closeModal = (field) => {
        setIsModalOpen({ ...isModalOpen, [field]: false });
    };

    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/m-employeeattendance');
    };

    const handleNavigate1 = () => {
        navigate('/m-monthlyattendance');
    };
    return (
        <div className='view-attendance-container'>
            <ManagerDashboard onToggleSidebar={setCollapsed} />
            <div className={`view-attendance-content ${collapsed ? 'collapsed' : ''}`}>
            {/* <Navbar/> */}
                 {/* Button to navigate to m-employeeattendance */}
                 {/* <button 
                        onClick={handleNavigate}
                        className="btn btn-primary"
                        style={{ marginRight: '20px',marginTop:'15px' }}
                    >
                        Go to Monthly Attendance
                    </button>

                    <button
                        onClick={handleNavigate1}
                        className="btn btn-primary"
                        style={{ marginRight: '20px',marginTop:'15px' }}
                    >
                        Go to Employee Monthly Attendance
                    </button> */}
                <div className="navigation-buttons d-flex align-items-center">
                   

                    <FaArrowLeft
                        onClick={handlePreviousWeek}
                        style={{ cursor: 'pointer', marginTop: '-7px', marginLeft: '300px' }}
                        size={24}
                    />
                    &nbsp; &nbsp;
                    <h2 className='attendance-heading'>
                         {formatDate(currentWeekStartDate)} to{' '}
                        {formatDate(new Date(currentWeekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000))}
                    </h2>
                    &nbsp; &nbsp;
                    <FaArrowRight
                        onClick={handleNextWeek}
                        style={{
                            cursor: nextWeekDisabled ? 'not-allowed' : 'pointer',
                            color: nextWeekDisabled ? 'gray' : 'inherit',
                            marginTop: '-6px'
                        }}
                        size={24}
                        disabled={nextWeekDisabled}
                    />
                </div>


                {loading ? (
                    <div>Loading attendance data...</div>
                ) : error ? (
                    <div>{error}</div>
                ) : (
                    <>
                        <div className="table-responsive mt-3">
                            {/* <table className="table table-striped mt-3"> */}
                            <table className="styled-table ">
                                <thead>
                                    <tr className='td'>
                                        <th>S.No</th>
                                        <th>Date</th>
                                        <th>Check-In</th>
                                        <th>Check-Out</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                        {/* <th>Check-In Location</th>
                                        <th>Check-Out Location</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentFilteredRecords.length > 0 ? (
                                        currentFilteredRecords.map((data, index) => (
                                            <tr key={index} className='td'>
                                                <td>{indexOfFirstFilteredRecord + index + 1}</td>
                                                <td>{data.date}</td>
                                                <td>
                                                    {data.checkIn
                                                        ? new Date(data.checkIn.seconds * 1000).toLocaleTimeString()
                                                        : 'N/A'}
                                                </td>
                                                <td>
                                                    {data.checkOut
                                                        ? new Date(data.checkOut.seconds * 1000).toLocaleTimeString()
                                                        : 'N/A'}
                                                </td>
                                                <td>
                                                    {data.duration
                                                        ? `${Math.floor(data.duration / 3600000)}h ${Math.floor(
                                                            (data.duration % 3600000) / 60000
                                                        )}m`
                                                        : 'N/A'}
                                                </td>
                                                <td>{data.statuses || 'N/A'}</td>
                                                {/* <td>{data.checkInLocation || 'N/A'}</td>
                                              <td>{data.checkOutLocation || 'N/A'}</td> */}


                                                {/* CheckInLocation Field */}
                                                {/* <td>
                                                    <button style={{ borderRadius: '5px', color: 'blue', border: 'none' }} onClick={() => openModal('checkIn')}>View</button>
                                                    {isModalOpen.checkIn && (
                                                        <div className="modal-view-atten">
                                                            <div className="modal-content-view-atten">
                                                                <span className="close" onClick={() => closeModal('checkIn')}>
                                                                    &times;
                                                                </span>
                                                                <p>Check-In Location: {data.checkInLocation || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td> */}

                                                {/* CheckOutLocation Field */}
                                                {/* <td>
                                                    <button style={{ borderRadius: '5px', color: 'blue', border: 'none' }} onClick={() => openModal('checkOut')}>View</button>
                                                    {isModalOpen.checkOut && (
                                                        <div className="modal-view-atten">
                                                            <div className="modal-content-view-atten">
                                                                <span className="close" onClick={() => closeModal('checkOut')}>
                                                                    &times;
                                                                </span>
                                                                <p>Check-Out Location: {data.checkOutLocation || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td> */}
                                                <td></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="text-center">
                                                No attendance records available for this week.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-center mt-3">
                            {renderPagination()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ManagerAttendenceTable
