import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase'; // Import your Firestore instance
import './LeaveManagement.css'; // For styling
import { FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../../Context/AuthContext'; // Use your AuthContext
import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';
import Pagination from 'react-bootstrap/Pagination';

const LeaveManagement = () => {
  const { user } = useAuth(); // Get the user from AuthContext
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [description, setDescription] = useState('');
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEMS_PER_PAGE = 5; // Set the number of items per page
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(leaveData.length / ITEMS_PER_PAGE); // Calculate total pages

  useEffect(() => {
    if (!user || !user.employeeUid) {
      console.error('No authenticated user or invalid UID');
      return;
    }

    const fetchLeaveData = async () => {
      try {
        const leaveDocRef = doc(db, 'leaves', user.employeeUid);
        const leaveDocSnap = await getDoc(leaveDocRef);

        if (leaveDocSnap.exists()) {
          const leaves = leaveDocSnap.data().leaves || [];
          setLeaveData(leaves);
        } else {
          console.log('No leave data found for this user');
        }
      } catch (error) {
        console.error('Error fetching leave data: ', error);
      }
    };

    fetchLeaveData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!leaveType || !fromDate || !toDate || !description) {
      alert('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!user || !user.employeeUid) {
      console.error('No authenticated user or invalid UID');
      setLoading(false);
      return;
    }

    // Convert input dates to Date objects for comparison
    const newFromDate = new Date(fromDate);
    const newToDate = new Date(toDate);

    // Check if the new date range overlaps with any existing leave data
    const isOverlapping = leaveData.some((leave) => {
      const existingFromDate = new Date(leave.fromDate);
      const existingToDate = new Date(leave.toDate);

      // Check if the new leave overlaps with any existing leave
      return (
        (newFromDate >= existingFromDate && newFromDate <= existingToDate) ||
        (newToDate >= existingFromDate && newToDate <= existingToDate) ||
        (newFromDate <= existingFromDate && newToDate >= existingToDate)
      );
    });

    if (isOverlapping) {
      alert('The selected date range overlaps with an existing leave application.');
      setLoading(false);
      return;
    }

    const newLeave = {
      leaveType,
      fromDate,
      toDate,
      description,
      timestamp: new Date(),
      status: 'Pending',
    };

    try {
      const leaveDocRef = doc(db, 'leaves', user.employeeUid);
      const leaveDocSnap = await getDoc(leaveDocRef);

      if (leaveDocSnap.exists()) {
        // Update the document with the new leave
        await updateDoc(leaveDocRef, {
          leaves: arrayUnion(newLeave),
        });
      } else {
        // Create a new document with the leave entry
        await setDoc(leaveDocRef, {
          leaves: [newLeave],
        });
      }

      console.log('Leave added successfully');
      setShowModal(false);
      setLeaveType('');
      setFromDate('');
      setToDate('');
      setDescription('');

      // Fetch updated leave data
      const updatedLeaveDocSnap = await getDoc(leaveDocRef);
      if (updatedLeaveDocSnap.exists()) {
        const updatedLeaves = updatedLeaveDocSnap.data().leaves || [];
        setLeaveData(updatedLeaves);
      }

    } catch (error) {
      console.error('Error adding leave: ', error);
    } finally {
      setLoading(false);
    }
  };

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


  const closeModal = () => {
    setShowModal(false);
    setLeaveType('');
    setFromDate('');
    setToDate('');
    setDescription('');
  };

  const handleDelete = async (indexToDelete) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this leave record?');
    if (!isConfirmed) return;

    try {
      const leaveDocRef = doc(db, 'leaves', user.employeeUid);
      const leaveDocSnap = await getDoc(leaveDocRef);

      if (leaveDocSnap.exists()) {
        const existingLeaves = leaveDocSnap.data().leaves || [];
        const updatedLeaves = existingLeaves.filter((_, index) => index !== indexToDelete);

        await updateDoc(leaveDocRef, { leaves: updatedLeaves });
        setLeaveData(updatedLeaves);
        console.log('Leave deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting leave: ', error);
    }
  };
  

  return (
    <div className='employee-attendenceContainer1'>
      <EmployeeSidebar onToggleSidebar={setCollapsed} />
      <div className={`employee-attendence1 ${collapsed ? 'collapsed' : ''}`}>
        <div>
          <div className="col text-end mt-3">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Leave
            </button>
          </div>

          {showModal && (
            <div className="hrms-modal">
              <div className="hrms-modal-content">
                <span className="hrms-close" onClick={closeModal}>
                  &times;
                </span>
                <h2>Add Leave</h2>
                <form onSubmit={handleSubmit}>
                  <label>
                    Select Leave:
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      required
                    >
                      <option value="">--Select Leave Type--</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Earned Leave">Earned Leave</option>
                    </select>
                  </label>
                  <label>
                    From Date:
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // Disable past dates
                      required
                    />
                  </label>
                  <label>
                    To Date:
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || new Date().toISOString().split('T')[0]} // Disable past dates and ensure "To Date" is after or on "From Date"
                      required
                    />
                  </label>



                  <label>
                    Description:
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </label>
                  <div className="hrms-close-submit-btn">
                    <button type="submit" className="hrms-submit-btn">
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                    <button type="button" className="hrms-close-btn" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div >
            <h2 className="text-center my-3">Leave Records</h2>
            <div className="table-responsive">
            <table className="styled-table">
              <thead >
                <tr>
                  <th>S.No</th>
                  <th>Leave Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody   style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                {leaveData.map((leave, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.fromDate}</td>
                    <td>{leave.toDate}</td>
                    <td>{leave.description}</td>
                    <td>{leave.status}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(index)}
                        className="btn btn-danger btn-sm"
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="d-flex justify-content-center">
          {renderPagination()}
          </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
