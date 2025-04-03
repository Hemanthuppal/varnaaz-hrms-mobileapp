import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Context/AuthContext';
import { db } from '../../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Pagination } from 'react-bootstrap';
import './AttendenceTable.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

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

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null); // To hold the selected record's data

    // Week navigation state
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(getWeekStartDate(new Date()));

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5; // Number of records per page
    const maxButtonsToShow = 5; // Maximum pagination buttons to show

    const [filteredAttendance, setFilteredAttendance] = useState([]);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const attendanceRef = doc(db, 'attendance', user.employeeUid);
                const attendanceSnap = await getDoc(attendanceRef);

                if (attendanceSnap.exists()) {
                    const data = attendanceSnap.data() || {};
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

        filteredData.sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        setFilteredAttendance(filteredData);
        setCurrentPage(1);
    };

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentFilteredRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);

    const totalFilteredPages = Math.ceil(filteredAttendance.length / recordsPerPage);

    const handlePreviousWeek = () => {
        const newStartDate = new Date(currentWeekStartDate);
        newStartDate.setDate(newStartDate.getDate() - 7);
        setCurrentWeekStartDate(getWeekStartDate(newStartDate));
    };

    const handleNextWeek = () => {
        if (nextWeekDisabled) return;
        const newStartDate = new Date(currentWeekStartDate);
        newStartDate.setDate(newStartDate.getDate() + 7);
        setCurrentWeekStartDate(getWeekStartDate(newStartDate));
    };

    const nextWeekDisabled = (() => {
        const nextWeekStartDate = new Date(currentWeekStartDate);
        nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
        return nextWeekStartDate > new Date();
    })();

    const handleViewRecord = (record) => {
        setSelectedRecord(record); // Set the selected record
        setShowModal(true); // Show the modal
    };

    return (
        <div className='view-attendance-container'>
            <ManagerDashboard onToggleSidebar={setCollapsed} />
            <div className={`view-attendance-content ${collapsed ? 'collapsed' : ''}`}>
                <div className="navigation-buttons d-flex align-items-center">
                    <FaArrowLeft onClick={handlePreviousWeek} style={{ cursor: 'pointer', marginTop: '-7px', marginLeft: '300px', cursor: 'pointer' }} size={24} />
                    <h2 className='attendancetable-heading'>
                        {`${currentWeekStartDate.toLocaleDateString()} to ${new Date(currentWeekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                    </h2>
                    <FaArrowRight
                        onClick={handleNextWeek}
                        style={{ cursor: nextWeekDisabled ? 'not-allowed' : 'pointer', color: nextWeekDisabled ? 'gray' : 'inherit', marginLeft: '5px', marginTop: '-6px' }}
                        size={24}
                    />
                </div>

                {loading ? (
                    <div>Loading attendance data...</div>
                ) : error ? (
                    <div>{error}</div>
                ) : (
                    <>
                        <div className="table-responsive mt-3">
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Date</th>
                                        <th>Check-In</th>
                                        <th>Check-Out</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody   style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                                    {currentFilteredRecords.length > 0 ? (
                                        currentFilteredRecords.map((data, index) => (
                                            <tr key={index}>
                                                <td>{indexOfFirstRecord + index + 1}</td>
                                                <td>{data.date}</td>
                                                <td>{data.checkIn ? new Date(data.checkIn.seconds * 1000).toLocaleTimeString() : 'N/A'}</td>
                                                <td>{data.checkOut ? new Date(data.checkOut.seconds * 1000).toLocaleTimeString() : 'N/A'}</td>
                                                <td>{data.duration ? `${Math.floor(data.duration / 3600000)}h ${Math.floor((data.duration % 3600000) / 60000)}m` : 'N/A'}</td>
                                                <td>{data.status || 'N/A'}</td>
                                                <td>
                                                    <Button onClick={() => handleViewRecord(data)} className="btn btn-sm btn-info">View</Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center">
                                                No attendance records available for this week.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-center mt-3">
                            <Pagination>
                                <Pagination.Prev
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                />
                                {Array.from({ length: totalFilteredPages }).map((_, idx) => (
                                    <Pagination.Item
                                        key={idx}
                                        active={currentPage === idx + 1}
                                        onClick={() => setCurrentPage(idx + 1)}
                                    >
                                        {idx + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalFilteredPages))}
                                    disabled={currentPage === totalFilteredPages}
                                />
                            </Pagination>
                        </div>
                    </>
                )}

                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Attendance Record Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedRecord ? (
                            <div>
                                <p><strong>Date:</strong> {selectedRecord.date}</p>
                                <p><strong>Check-In:</strong> {selectedRecord.checkIn ? new Date(selectedRecord.checkIn.seconds * 1000).toLocaleTimeString() : 'N/A'}</p>
                                <p><strong>Check-Out:</strong> {selectedRecord.checkOut ? new Date(selectedRecord.checkOut.seconds * 1000).toLocaleTimeString() : 'N/A'}</p>
                                <p><strong>CheckInLocation:</strong> {selectedRecord.checkInLocation || 'N/A'}</p>
                                <p><strong>CheckOutLocation:</strong> {selectedRecord.checkOutLocation || 'N/A'}</p>
                                <p><strong>Duration:</strong> {selectedRecord.duration ? `${Math.floor(selectedRecord.duration / 3600000)}h ${Math.floor((selectedRecord.duration % 3600000) / 60000)}m` : 'N/A'}</p>
                                <p><strong>Status:</strong> {selectedRecord.status || 'N/A'}</p>
                            </div>
                        ) : (
                            <p>No details available.</p>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
}

export default ManagerAttendenceTable;
