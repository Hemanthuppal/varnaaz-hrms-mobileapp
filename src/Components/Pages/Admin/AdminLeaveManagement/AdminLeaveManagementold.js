import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase'; // Your Firestore instance
import { collection, getDocs, updateDoc, doc,getDoc } from 'firebase/firestore'; // Firestore functions
import AdminSidebar from '../../../Shared/AdminSidebar/AdminSidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For generating tables in PDF
import "./AdminLeaveManagement.css" // Import Bootstrap CSS

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [collapsed, setCollapsed] = useState(false); // State for sidebar collapse
  const [selectedRole, setSelectedRole] = useState('All'); // State for the selected role filter
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

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
  const handleStatusChange = async (leaveDocId, leaveIndex, newStatus) => {
    try {
      const leaveRef = doc(db, 'leaves', leaveDocId); // Reference to the specific leave document
      const leaveDoc = await getDoc(leaveRef); // Get the document
      
      if (leaveDoc.exists()) {
        const leaveData = leaveDoc.data();
        const updatedLeaves = [...leaveData.leaves]; // Clone the current leaves array
  
        // Update the status of the specific leave
        updatedLeaves[leaveIndex].status = newStatus;
  
        // Update the document in Firestore with the modified leaves array
        await updateDoc(leaveRef, {
          leaves: updatedLeaves,
        });
  
        // Refresh leaves data after update
        fetchLeaves();
      }
    } catch (error) {
      console.error('Error updating status: ', error);
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
            {filteredLeaves.map((leave, index) => {
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
                      <select
                        className="form-select"
                        value={leave.status}
                        onChange={(e) => handleStatusChange(leave.docId, index, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Not Approved">Not Approved</option>
                      </select>
                    ) : (
                      leave.status
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
    </div>
  </div>
</div>

  );
};

export default EmployeeLeaves;
