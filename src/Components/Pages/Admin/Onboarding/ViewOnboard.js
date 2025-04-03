import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Button, Alert, Pagination } from "react-bootstrap";
import AdminDashboard from "../../../Shared/AdminSidebar/AdminSidebar";
import { db, storage } from "./../../../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPen, faPlus, faEye } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import EmployeeDetailsModal from "./viewOnboardingModal";
import EditEmployeeModal from "./EditOnboardingModal";
import SkillsModal from "./viewSkillsModal";
import "./ViewOnboard.css";
import CommentsModal from './Comment';

const EmployeeDetails = () => {

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentEmployee, setCommentEmployee] = useState(null);

  const [collapsed, setCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editEmployeeData, setEditEmployeeData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(5);
  const maxButtonsToShow = 5;
  // const [editEmployeeData, setEditEmployeeData] = useState(null);
  const navigate = useNavigate();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const handleOpenCommentsModal = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setShowCommentsModal(true);
  };

  const handleCloseCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedEmployeeId(null);
  };



  const handleFileChange = (e, field) => {
    // Implement your file change logic here
    const file = e.target.files[0];
    // Update file field in editEmployeeData
    setEditEmployeeData(prevData => ({
      ...prevData,
      [field]: file
    }));
  };
  useEffect(() => {
    const fetchEmployeesAndManagers = async () => {
      try {
        const employeeQuery = query(collection(db, "employees"), orderBy("createdAt", "desc"));
        const employeeSnapshot = await getDocs(employeeQuery);
        const employeeData = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const managerQuery = query(collection(db, "users"), where("role", "==", "Manager"));
        const managerSnapshot = await getDocs(managerQuery);
        const managerData = managerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmployees(employeeData);
        setManagers(managerData);
      } catch (err) {
        setError("Failed to load employee or manager data.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesAndManagers();
  }, []);


  const handleManagerChange = async (event, employeeId) => {
    const selectedManagerName = event.target.value;

    // Find the selected manager object from the managers list
    const selectedManager = managers.find(
      (manager) => manager.fullName === selectedManagerName
    );

    if (!selectedManager || !selectedManager.employeeUid) {
      console.error("Manager or Manager UID not found");
      return;
    }

    const employeeRef = doc(db, "employees", employeeId);

    try {
      // Update the employee document with the manager name and UID
      await updateDoc(employeeRef, {
        departmentManager: selectedManager.fullName,
        employeeUid: selectedManager.employeeUid,
      });

      // Update the employee list in the UI
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.id === employeeId
            ? {
              ...emp,
              departmentManager: selectedManager.fullName,
              employeeUid: selectedManager.uid,
            }
            : emp
        )
      );
    } catch (error) {
      console.error("Error updating manager approval status:", error);
    }
  };

  const getMatchingManagers = (department) => {
    return managers.filter(
      (manager) => manager.department && department.includes(manager.department)
    );
  };

  const handleViewClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => setShowDetailsModal(false);

  const handleAddOnboard = () => {
    navigate("/a-onboarding");
  };

  const updateEmployeeStatus = async (employeeId, newStatus) => {
    try {
      const employeeDocRef = doc(db, "employees", employeeId);
      await updateDoc(employeeDocRef, { status: newStatus });
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.id === employeeId ? { ...employee, status: newStatus } : employee
        )
      );
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  };

  const handleStatusChange = (event, employeeId) => {
    const newStatus = event.target.value;
    updateEmployeeStatus(employeeId, newStatus);
  };

  const handleEditClick = (employee) => {
    setEditEmployeeData({ ...employee });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => setShowEditModal(false);

  const handleShowSkillsModal = (skills) => {
    setSelectedSkill(skills);
    setShowSkillsModal(true);
  };
  const handleSaveChanges = async () => {
    // Code to save the updated employee data (e.g., save to Firestore)
    console.log("Updated data:", editEmployeeData);

    // Close the modal after saving
    setShowEditModal(false);
  };

  const handleCloseSkillsModal = () => setShowSkillsModal(false);

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const employeeDocRef = doc(db, "employees", employeeId);
        await deleteDoc(employeeDocRef);
        setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employeeId));
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const indexOfLastEmployee = currentPage * recordsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - recordsPerPage;
  const currentUsers = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);
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
    <div className="admin-viewonboard-container">
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`admin-viewonboard-content ${collapsed ? "collapsed" : ""}`}>
        <h2 className="text-center">Onboarding Details</h2>
        <Button variant="primary" onClick={handleAddOnboard}>
          <FontAwesomeIcon icon={faPlus} /> Add
        </Button>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Name</th>
                  <th>Contact No</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Skills</th>
                  <th>Manager Approval</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                    <td>{employee.name}</td>
                    <td>{employee.contactNo}</td>
                    <td>{employee.email}</td>
                    <td>{employee.location}</td>
                    <td>
                      {employee.skills.length > 20 ? (
                        <>
                          {employee.skills.substring(0, 20)}...
                          <a href="#!" onClick={() => handleShowSkillsModal(employee.skills)}>
                            View More
                          </a>
                        </>
                      ) : (
                        employee.skills
                      )}
                    </td>
                    <td style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                      <div className="d-flex align-items-center">
                        <select
                          className="form-select"
                          value={employee.departmentManager || ""}
                          onChange={(event) => handleManagerChange(event, employee.id)}
                          disabled={!!employee.departmentManager} // Disable if already selected
                        >
                          <option value="">Select Manager</option>
                          {getMatchingManagers(employee.department).map((manager) => (
                            <option key={manager.id} value={manager.fullName}>
                              {manager.fullName}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="link"
                          className="p-0 ms-2"
                          onClick={() => handleOpenCommentsModal(employee.id)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </div>
                      {employee.approvalStatus && (
                        <span>{employee.approvalStatus}</span>
                        // Display approval status
                      )}
                    </td>

                    <td style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                      <select
                        value={employee.status || ""}
                        onChange={(event) => handleStatusChange(event, employee.id)}
                        className="form-select"
                        disabled={employee.status === "Selected" || employee.status === "Not Selected"}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Selected">Selected</option>
                        <option value="Not Selected">Not Selected</option>
                        <option value="Review">Review</option>
                      </select>


                    </td>
                    <td>
                      <div className="d-flex justify-content-start">
                        <Button variant="primary" onClick={() => handleViewClick(employee)} className="me-2">
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button variant="warning" onClick={() => handleEditClick(employee)} className="mx-2">
                          <FontAwesomeIcon icon={faPen} />
                        </Button>
                        <Button variant="danger" onClick={() => handleDeleteEmployee(employee.id)} className="ms-2">
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
          </div>
        )}
        {/* Modals */} {selectedEmployee && (
          <EmployeeDetailsModal
            show={showDetailsModal}
            selectedEmployee={selectedEmployee}
            onHide={handleCloseDetailsModal}

          />
        )}
        <EditEmployeeModal
          show={showEditModal}
          onHide={handleCloseEditModal}
          editEmployeeData={editEmployeeData}
          setEditEmployeeData={setEditEmployeeData}
          handleFileChange={handleFileChange}
          handleSaveChanges={handleSaveChanges}
          setEmployees={setEmployees}  // Pass setEmployees here
          setShowEditModal={setShowEditModal}  // Pass setShowEditModal here
        />

        <SkillsModal show={showSkillsModal} onHide={handleCloseSkillsModal} skill={selectedSkill} />
        {selectedEmployeeId && (
          <CommentsModal
            show={showCommentsModal}
            onHide={handleCloseCommentsModal}
            employeeId={selectedEmployeeId}
          />
        )}

      </div>
    </div>
  );
};

export default EmployeeDetails;
