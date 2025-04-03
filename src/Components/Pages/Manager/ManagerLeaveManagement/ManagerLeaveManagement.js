import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase'; // Your Firestore instance
import { useAuth } from '../../../Context/AuthContext'; // Use your AuthContext
import { FaTrashAlt } from 'react-icons/fa';
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import './ManagerLeaveManagement.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';

const ManagerLeaveManagement = () => {
  const { user } = useAuth(); // Get the user from AuthContext
  const [showModal, setShowModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const paginatedLeaves = leaveData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

 


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

    // Check if the new leave date overlaps with any existing leave data
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
      alert('You cannot apply for leave on the same date(s) as an existing application.');
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
  const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format

  // Render pagination component
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

  return (
    <div className='employee-attendenceContainer1'>
      <ManagerDashboard onToggleSidebar={setCollapsed} />
      <div className={`employee-attendence1 ${collapsed ? 'collapsed' : ''}`}>
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2>My Leaves</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add Leave
            </Button>
          </div>

          <Modal show={showModal} onHide={closeModal}>
            <Modal.Header closeButton>
              <Modal.Title>Add Leave</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="leaveType" className="form-label">Select Leave:</label>
                  <select
                    className="form-select"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    required
                  >
                    <option value="">--Select Leave Type--</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="fromDate" className="form-label">From Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    min={today} // Restrict past dates
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="toDate" className="form-label">To Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || today} // Ensure the 'To Date' is not earlier than 'From Date'
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description:</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeModal}>
                    Close
                  </Button>
                  <Button type="submit" variant="primary">
                    {loading ? 'Submitting...' : 'Submit'}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Body>
          </Modal>

          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Serial No</th>
                  <th>Leave Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.fromDate}</td>
                    <td>{leave.toDate}</td>
                    <td>{leave.description}</td>
                    <td>{leave.status}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(index)}
                        className="btn btn-danger"
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
  );
};

export default ManagerLeaveManagement;
