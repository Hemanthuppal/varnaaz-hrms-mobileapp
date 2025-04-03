import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase'; // Adjust the import path
import { collection, getDocs } from 'firebase/firestore';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Pagination } from 'react-bootstrap';
import { ThreeDots } from 'react-loader-spinner';
import AdminDashboard from '../../../Shared/AdminSidebar/AdminSidebar'
import "./AdminAttendence.css"

const AdminAttendence = () => {
  const [collapsed, setCollapsed] = useState(false);
    const [users, setUsers] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [roleFilter, setRoleFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(5);
    const maxButtonsToShow = 5;

    const today = new Date();

    const formatDuration = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}h ${minutes}m ${secs}s`;
  };


  const formatDateForKey = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
  };

  const fetchUsers = async () => {
      try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          const userData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          }))
          .filter(user => user.role === 'Employee' || user.role === 'Manager' );
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
          console.log("Attendance Data for the month:", attendance);
      } catch (error) {
          console.error("Error fetching attendance data: ", error);
      }
  };

  useEffect(() => {
      fetchUsers();
      fetchAttendance();
  }, []);

  const todayKey = formatDateForKey(currentDate);

  // Process the nested attendance data
  const processAttendanceData = () => {
      return attendanceData.map(doc => {
          const dateData = doc[todayKey] || {};

          const durationInMillis = dateData.duration || 0;
          const durationInSeconds = Math.floor(durationInMillis / 1000);
          const hours = Math.floor(durationInSeconds / 3600);
          const minutes = Math.floor((durationInSeconds % 3600) / 60);
          const seconds = durationInSeconds % 60;

          return {
              id: doc.id,
              employeeName: dateData.employeeName || 'N/A',
              checkIn: dateData.checkIn ? new Date(dateData.checkIn.seconds * 1000).toLocaleTimeString() : 'N/A',
              checkInLocation: dateData.checkInLocation || 'N/A',
              checkinImage: dateData.checkinImage || null,
              checkOut: dateData.checkOut ? new Date(dateData.checkOut.seconds * 1000).toLocaleTimeString() : 'N/A',
              checkOutLocation: dateData.checkOutLocation || 'N/A',
              checkoutImage: dateData.checkoutImage || null,
              statuses: dateData.statuses || 'N/A',
              duration: durationInMillis ? `${hours}h ${minutes}m ${seconds}s` : 'N/A'
          };
      });
  };

  const combinedData = users
      .filter(user => roleFilter === 'All' || user.role === roleFilter)
      .map(user => {
          const userAttendance = processAttendanceData().find(entry => entry.id === user.id);
          return {
              ...user,
              ...userAttendance
          };
      });

  // Filter the data based on the search query
  const filteredData = combinedData.filter(user =>
      Object.keys(user).some(key =>
          String(user[key]).toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handlePrevious = () => {
      const prevDate = new Date(currentDate);
      prevDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDate);
  };

  const handleNext = () => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      if (nextDate <= new Date()) {
          setCurrentDate(nextDate);
      }
  };

  const isToday = formatDateForKey(currentDate) === formatDateForKey(today);

  const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
  };

  const handleDownloadPDF = () => {
      const doc = new jsPDF();

      doc.text(`Attendance Report - ${formatDate(currentDate)}`, 14, 10);

      const tableColumn = ["S.No", "Name", "Role", "Check-In", "Check-In Location", "Check-Out", "Check-Out Location",  "Status", "Duration"];
      const tableRows = [];

      combinedData.forEach((user, index) => {
          const userData = [
              index + 1,
              user.name || 'N/A',
              user.role || 'N/A',
              user.checkIn || 'N/A',
              user.checkInLocation || 'N/A',
              
              user.checkOut || 'N/A',
              user.checkOutLocation || 'N/A',
             
              user.statuses || 'N/A',
              user.duration || 'N/A'
          ];
          tableRows.push(userData);
      });

      doc.autoTable(tableColumn, tableRows, { startY: 20 });
      doc.save(`Attendance_Report_${formatDate(currentDate)}.pdf`);
  };






  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
          // Simulate a network request
          await new Promise(resolve => setTimeout(resolve, 2000));
          setLoading(false); // Set loading to false after data is fetched
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
                  wrapperStyle={{}}
                  wrapperClass=""
                  visible={true}
              />
          </div>
      );
  }

  const handleImageClick = (imageUrl) => {
      setModalImage(imageUrl);
      setShowModal(true);
      setIsLoading(true); // Start loading

  };

  const handleCloseModal = () => {
      setShowModal(false);
      setIsLoading(false); // Reset loading state
  };

  const handleImageLoad = () => {
      setIsLoading(false); // Image loaded
  };
  const handleImageError = () => {
      setIsLoading(false); // Reset loading state on error
      // You can also set an error state here if you want to display an error message
  };


  const indexOfLastData = currentPage * recordsPerPage;
  const indexOfFirstData = indexOfLastData - recordsPerPage;
  const currentData = filteredData.slice(indexOfFirstData, indexOfLastData);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

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
    <div className='admin-attendance-container'>
        <AdminDashboard onToggleSidebar={setCollapsed} />
        <div className={`admin-attendance-content ${collapsed ? 'collapsed' : ''}`}>
       
                <div className="d-flex justify-content-center">
                    <div className="navigation-buttons d-flex align-items-center">
                        <FaArrowLeft
                            onClick={handlePrevious}
                            style={{ cursor: 'pointer' }}
                            size={24}
                        />
                        &nbsp; &nbsp;
                        <h3 className='attendance-heading'>Attendance for {formatDate(currentDate)}</h3>
                        &nbsp; &nbsp;
                        <FaArrowRight
                            onClick={handleNext}
                            style={{ cursor: isToday ? 'not-allowed' : 'pointer', opacity: isToday ? 0.5 : 1 }}
                            size={24}
                            disabled={isToday}
                        />
                    </div>
                </div>

                <div className="filter-container d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <label htmlFor="roleFilter">Role: </label>
                        <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="All">All</option>
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            
                        </select>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="attendance-search"
                        />
                    </div>
                    {/* <div>
                        <button className="btn btn-primary" onClick={handleDownloadPDF}>Download PDF</button>
                    </div> */}
                </div>

                <div className="table-responsive">
    <table className="styled-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Check-In</th>
                            <th>Check-In Location</th>
                           
                            <th>Check-Out</th>
                            <th>Check-Out Location</th>
                            
                            <th>Status</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map((user, index) => (
                                <tr key={index}>
                                    <td>{indexOfFirstData+index + 1 }</td> {/* Updated S.No calculation */}
                                    <td>{user.fullName || 'N/A'}</td>
                                    <td>{user.role || 'N/A'}</td>
                                    <td>{user.checkIn || 'Not Checked In'}</td>
                                    <td>{user.checkInLocation || 'N/A'}</td>
                                   



                                    <td>{user.checkOut || 'Not Checked Out'}</td>
                                    <td>{user.checkOutLocation || 'N/A'}</td>
                                   


                                    <td>{user.statuses || 'N/A'}</td>
                                    <td>{user.duration || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" className="text-center">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
</div>


                {/* <ReactPaginate
                    pageCount={Math.ceil(filteredData.length / entriesPerPage)}
                    onPageChange={handlePageClick}
                    containerClassName={'pagination'}
                    pageClassName={'page-item'}
                    pageLinkClassName={'page-link'}
                    activeClassName={'active'}
                    previousClassName={'previous'}
                    nextClassName={'next'}
                /> */}


                {showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            position: 'relative',
                            padding: '40px 15px 15px 15px',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                        }}>
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    right: '16px',
                                    cursor: 'pointer',
                                    fontSize: '45px',
                                }}
                                onClick={handleCloseModal}
                            >
                                &times;
                            </span>
                            {isLoading && (
                            <div style={{ textAlign: 'center', fontWeight:"bold" }}>
                                <p>Loading...</p>
                            </div>
                        )}
                            <img
                                src={modalImage}
                                alt="Check-in"
                                style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius:'5px'}}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        </div>
                    </div>
                )}
            </div>
    </div>
    
  )
}

export default AdminAttendence
