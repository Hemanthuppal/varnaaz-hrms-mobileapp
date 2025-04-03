import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase'; // Your Firestore instance
import { collection, getDocs, query, where, documentId, updateDoc, doc } from 'firebase/firestore'; // Firestore functions
import { useAuth } from '../../../Context/AuthContext';
import ManagerSidebar from '../../../Shared/ManagerSidebar/ManagerSidebar';
import "./EmployeeLeaves.css";
import Pagination from 'react-bootstrap/Pagination';

const EmployeeLeaves = () => {
  const { user } = useAuth(); // Assuming this provides the authenticated user
  const [leaves, setLeaves] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [employees, setEmployees] = useState({}); // State to hold employee data

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Set the number of leaves per page
  const [totalPages, setTotalPages] = useState(1);
  const maxButtonsToShow = 5; // Number of pagination buttons to display

  // Function to fetch matched employees and their leaves
  const fetchManagerLeaves = async () => {
    try {
      if (user && user.role === 'Manager') {
        const managerUid = user.employeeUid; // Get the manager's employeeUid

        // Query to fetch all users where assignedManagerUid matches the manager's employeeUid
        const usersQuery = query(
          collection(db, 'users'),
          where('assignedManagerUid', '==', managerUid)
        );

        const usersSnapshot = await getDocs(usersQuery);
        const matchedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Extract employeeUid from matched users and create a mapping for employee details
        const employeeDetails = {};
        matchedUsers.forEach(user => {
          employeeDetails[user.employeeUid] = {
            fullName: user.fullName,
            email: user.email,
          };
        });
        setEmployees(employeeDetails); // Save employee details to state

        const employeeUids = matchedUsers.map(user => user.employeeUid);

        // If no employee matches, stop further processing
        if (employeeUids.length === 0) {
          setLeaves([]); // No leaves found
          return;
        }

        // Fetch leaves where the docId matches any of the employeeUids
        const leavesQuery = query(
          collection(db, 'leaves'),
          where(documentId(), 'in', employeeUids) // Match the Firestore document ID with employeeUid
        );

        const leavesSnapshot = await getDocs(leavesQuery);
        const leavesList = leavesSnapshot.docs.map(leaveDoc => ({
          id: leaveDoc.id,
          ...leaveDoc.data(),
        }));

        // Loop through the fetched leave documents to extract data from the nested leaves array
        const allLeaves = [];
        leavesList.forEach(leaveDoc => {
          if (leaveDoc.leaves && Array.isArray(leaveDoc.leaves)) {
            leaveDoc.leaves.forEach(nestedLeave => {
              allLeaves.push({
                docId: leaveDoc.id, // Leave document ID
                ...nestedLeave,  // Spread the individual leave data
              });
            });
          }
        });

        // Store the flattened leave data in state
        setLeaves(allLeaves);
        setTotalPages(Math.ceil(allLeaves.length / itemsPerPage)); // Calculate total pages for pagination
      }
    } catch (error) {
      console.error('Error fetching leaves: ', error);
    }
  };

  // Function to update the leave status
  const updateLeaveStatus = async (docId, index, status) => {
    try {
      const leaveDocRef = doc(db, 'leaves', docId);
      const updatedLeaves = leaves.map((leave, i) => {
        if (i === index) {
          leave.status = status;
          leave.disabled = true; // Disable the dropdown after selection
        }
        return leave;
      });

      await updateDoc(leaveDocRef, { leaves: updatedLeaves });
      setLeaves([...updatedLeaves]);
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  // Function to handle the dropdown change
  const handleStatusChange = (event, docId, index) => {
    const newStatus = event.target.value;
    if (newStatus) {
      updateLeaveStatus(docId, index, newStatus);
    }
  };

  // Fetch the leaves when the component mounts
  useEffect(() => {
    fetchManagerLeaves();
  }, [user]);

  // Function to render pagination
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
      <Pagination style={{ marginLeft: '126px', marginTop:'10px' }}>
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

  // Paginate leaves data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = leaves.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className='manager-Leave-container'>
      <ManagerSidebar onToggleSidebar={setCollapsed} />
      <div className={`manager-Leave-content ${collapsed ? 'collapsed' : ''}`}>
        <h1 className='empleaveheading'>Employee Leaves</h1>
        <div className="table-responsive">
          <table className="styled-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? (
                currentLeaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{employees[leave.docId]?.fullName || 'N/A'}</td>
                    <td>{employees[leave.docId]?.email || 'N/A'}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.fromDate}</td>
                    <td>{leave.toDate}</td>
                    <td>{leave.description}</td>
                    <td>{leave.status}</td>
                    <td   style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                      <select
                        value={leave.status}
                        onChange={(event) => handleStatusChange(event, leave.docId, index)}
                        className="form-select"
                        disabled={leave.disabled}
                      >
                        <option value="">Select</option>
                        <option value="Approved">Approved</option>
                        <option value="Not Approved">Not Approved</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No leaves found for matched employees.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Render pagination */}
        {leaves.length > 0 && renderPagination()}
      </div>
    </div>
  );
};

export default EmployeeLeaves;
