import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase'; // Import your Firestore instance
import './LeaveManagement.css'; // For styling
import { FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../../Context/AuthContext'; // Use your AuthContext
import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';


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

  return (
    <div className='employee-attendenceContainer1'>
      <EmployeeSidebar onToggleSidebar={setCollapsed} />
      <div className={`employee-attendence1 ${collapsed ? 'collapsed' : ''}`}>

        <div className="leave-header">
          <button className="hrms-add-leave-btn" onClick={() => setShowModal(true)}>
            Add Leave
          </button>
        </div>

        <h2 className='hrms-h2'>Leave Records</h2>


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
                    required
                  />
                </label>
                <label>
                  To Date:
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
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

        <div className="hrms-leave-table">
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.map((leave, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{leave.leaveType}</td>
                  <td>{leave.fromDate}</td>
                  <td>{leave.toDate}</td>
                  <td>{leave.description}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(index)}
                      className="hrms-delete-btn"
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
      </div>
    </div>
  );
};

export default LeaveManagement;
