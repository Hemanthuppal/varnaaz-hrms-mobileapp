import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase'; // Your Firestore instance
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import AdminSidebar from '../../../Shared/AdminSidebar/AdminSidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For generating tables in PDF
import "./AdminLeaveManagement.css" // Import Bootstrap CSS
import Pagination from 'react-bootstrap/Pagination';

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [collapsed, setCollapsed] = useState(false); // State for sidebar collapse
  const [selectedRole, setSelectedRole] = useState('All'); // State for the selected role filter
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const [leavesPerPage] = useState(5); // Number of leaves per page
  
  // Function to fetch leaves from Firestore
  const fetchLeaves = async () => {
    try {
      const leavesCollection = collection(db, 'leaves'); // Reference to the 'leaves' collection
      const leavesSnapshot = await getDocs(leavesCollection); // Get all documents

      const allLeaves = [];
      // Map over each document and extract nested leaves
      leavesSnapshot.docs.forEach(doc => {
        const leaveDoc = doc.data();
        const nestedLeaves = leaveDoc.leaves || []; // Array of leaves in the document
        // Map each nested leave to add the document ID
        nestedLeaves.forEach(leave => {
          allLeaves.push({
            docId: doc.id, // This will be used to match with users' docId
            ...leave,
          });
        });
      });

      // Store the flattened leaves data in state
      setLeaves(allLeaves);
    } catch (error) {
      console.error('Error fetching leaves: ', error);
    }
  };

  // Function to fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users'); // Reference to the 'users' collection
      const usersSnapshot = await getDocs(usersCollection); // Get all documents
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id, // The docId of the user
        ...doc.data(),
      })); // Map over the documents to get the data
      setUsers(usersList); // Store users data in state
    } catch (error) {
      console.error('Error fetching users: ', error);
    }
  };

  // Combine users and leaves by matching docId
  const getUserInfo = (leaveDocId) => {
    return users.find(user => user.id === leaveDocId) || {}; // Match leave docId with user docId
  };

  // Fetch the leaves and users when the component mounts
  useEffect(() => {
    fetchLeaves();
    fetchUsers();
  }, []);

  // Function to handle the role filter
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value); // Set the selected role
  };

  // Function to handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase()); // Convert search term to lowercase for case-insensitive search
  };

  // Function to handle status change
  const handleStatusChange = async (leaveDocId, leaveId, newStatus) => {
    try {
      const leaveRef = doc(db, 'leaves', leaveDocId); // Reference to the specific leave document
      const leaveDoc = await getDoc(leaveRef); // Fetch the document from Firestore
  
      if (leaveDoc.exists()) {
        const leaveData = leaveDoc.data();
        const updatedLeaves = leaveData.leaves.map((leave) => {
          // Find the leave by a unique identifier (e.g., `id` or another unique field)
          if (leave.id === leaveId) {
            return { ...leave, status: newStatus }; // Update the status for the matched leave
          }
          return leave;
        });
  
        // Update the Firestore document with the modified leaves array
        await updateDoc(leaveRef, { leaves: updatedLeaves });
  
        // Refresh leaves data after the update
        fetchLeaves();
  
        // Show success alert
        alert(`Status updated successfully to "${newStatus}"`);
      } else {
        console.error('Leave document does not exist for ID:', leaveDocId);
      }
    } catch (error) {
      console.error('Error updating status: ', error);
      alert('Error updating status. Please try again.');
    }
  };
  
  
  


  // Filtered leaves based on selected role and search term
  const filteredLeaves = leaves.filter(leave => {
    const userInfo = getUserInfo(leave.docId); // Get user info for each leave
    const fullName = userInfo.fullName?.toLowerCase() || ''; // Make name lowercase for comparison
    const matchesSearch = fullName.includes(searchTerm); // Check if fullName matches search term

    // Filter by role and search term
    if (selectedRole === 'All') {
      return matchesSearch; // Show all leaves matching search
    }
    return userInfo.role === selectedRole && matchesSearch; // Filter by role and search term
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLeaves.length / leavesPerPage); // Total pages
  const indexOfLastLeave = currentPage * leavesPerPage; // Index of the last leave
  const indexOfFirstLeave = indexOfLastLeave - leavesPerPage; // Index of the first leave
  const currentLeaves = filteredLeaves.slice(indexOfFirstLeave, indexOfLastLeave); // Current leaves for the page

  // Function to render pagination
  const renderPagination = () => {
    const maxButtonsToShow = 5; // Maximum pagination buttons to show
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
      <Pagination style={{ marginLeft: '535px' }}>
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

  // Function to export leaves as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Employee Leaves Report', 14, 10);
    const tableColumn = ['Full Name', 'Email', 'Role', 'Leave Type', 'From Date', 'To Date', 'Status'];
    const tableRows = [];

    // Loop through filtered leaves and add rows
    filteredLeaves.forEach((leave) => {
      const userInfo = getUserInfo(leave.docId); // Match leave docId with user docId
      const leaveData = [
        userInfo.fullName || 'N/A',
        userInfo.email || 'N/A',
        userInfo.role || 'N/A',
        leave.leaveType,
        leave.fromDate,
        leave.toDate,
        leave.status
      ];
      tableRows.push(leaveData);
    });

    // Add rows to the table in PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    // Save the PDF
    doc.save(`Employee_Leaves_${selectedRole}.pdf`);
  };

  return (
    <div className='Admin-leave-container'>
      <AdminSidebar onToggleSidebar={setCollapsed} />
      <div className={`Admin-leave-content ${collapsed ? 'collapsed' : ''}`}>
        <h2 className="text-center">Employee Leaves</h2>
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <select
                  className=" leavfilter"
                  id="roleSelect"
                  value={selectedRole}
                  onChange={handleRoleChange}
                >
                  <option value="All">All</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>
            <div className="col-md-6 col-lg-8">
              <div className="input-group">
                <input
                  type="text"
                  className=" searchaleave"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
          {/* <button className="btn btn-primary mb-3" onClick={exportPDF}>Export to PDF</button> */}
        </div>
        <div className="table-responsive">
          {filteredLeaves.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Leave Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentLeaves.map((leave, index) => {
                  const userInfo = getUserInfo(leave.docId); // Match leave docId with user docId
                  return (
                    <tr key={index}>
                      <td>{userInfo.fullName || 'N/A'}</td>
                      <td>{userInfo.email || 'N/A'}</td>
                      <td>{userInfo.role || 'N/A'}</td>
                      <td>{leave.leaveType}</td>
                      <td>{leave.fromDate}</td>
                      <td>{leave.toDate}</td>
                      <td>{leave.description}</td>
                      <td>
          {userInfo.role === 'Manager' ? (
            leave.status === 'Pending' ? ( // Show dropdown only if status is "Pending"
              <select
                className="form-select"
                value={leave.status}
                onChange={(e) => handleStatusChange(leave.docId, leave.id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Not Approved">Not Approved</option>
              </select>
            ) : (
              <span >
                {leave.status}
              </span> // Display status as a badge for finalized statuses
            )
          ) : (
            leave.status // Non-manager roles will just see the status text
          )}
        </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No leaves found.</p>
          )}
          {renderPagination()}
        </div>
      </div>
    </div>

  );
};

export default EmployeeLeaves;
