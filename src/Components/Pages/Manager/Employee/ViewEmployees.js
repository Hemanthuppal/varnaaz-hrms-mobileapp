import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebase'; // Your Firestore instance
import { collection, getDocs, query, where } from 'firebase/firestore'; // Firestore functions
import { useAuth } from '../../../Context/AuthContext';
import ManagerSidebar from '../../../Shared/ManagerSidebar/ManagerSidebar';
import "./ViewEmployees.css";
import ManagerHeader from '../Managerheader/ManagerHeader';
import { Button, Modal, Form, Pagination } from "react-bootstrap";

const EmployeeList = () => {
  const { user } = useAuth(); // Assuming this provides the authenticated user

  const [collapsed, setCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]); // State to hold employee data
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(5); // Fixed per-page records
  const maxButtonsToShow = 5;

  // Function to fetch matched employees
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('assignedManagerUid', '==', user.employeeUid));
      const usersSnapshot = await getDocs(q);
      const userList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(userList); // Set the employees state with the fetched data
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // UseEffect to fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [user.employeeUid]); // Run when the employeeUid changes

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentEmployees = employees.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(employees.length / recordsPerPage);

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
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
              />
              {startPage > 1 && <Pagination.Ellipsis />}
              {pages}
              {endPage < totalPages && <Pagination.Ellipsis />}
              <Pagination.Next
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
              />
          </Pagination>
      );
  };

  return (
    <div className='manager-employee-container'>
      <ManagerSidebar onToggleSidebar={setCollapsed} />
      <div className={`manager-employee-content ${collapsed ? 'collapsed' : ''}`}>
      <ManagerHeader/>
        <h1 className='empemployeeheading'>Employees</h1>
        <div className="table-responsive">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Mobile</th>
           
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{employee.fullName || 'N/A'}</td>
                    <td>{employee.email || 'N/A'}</td>
                    <td>{employee.role || 'N/A'}</td>
                    <td>{employee.mobile || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-center">{renderPagination()}</div>
      </div>
    </div>
  );
  
};

export default EmployeeList;
