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
import { Table, Button, Card, Alert, Modal, Pagination } from "react-bootstrap";
import AdminDashboard from "../../../Shared/AdminSidebar/AdminSidebar";
import { db, storage } from "./../../../firebase/firebase"; // Import your Firebase config
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPen,
  faPlus,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./ViewOnboard.css";

const EmployeeDetails = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editEmployeeData, setEditEmployeeData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  const maxButtonsToShow = 5;

  // const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  // const [error, setError] = useState(null);
  // const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchEmployeesAndManagers = async () => {
      try {
        // Fetch employees
        const employeeQuery = query(collection(db, "employees"), orderBy("createdAt", "desc"));
        const employeeSnapshot = await getDocs(employeeQuery);
        const employeeData = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch managers
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


  // const handleShow = (skills) => {
  //   // Display full skills info in a modal or alert
  // };

  const getMatchingManagers = (department) => {
    return managers.filter((manager) => manager.department && department.includes(manager.department));
  };

  const handleViewClick = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const handleAddOnboard = () => {
    navigate("/a-onboarding"); // Navigate to the /a-addemployee page
  };

  const updateEmployeeStatus = async (employeeId, newStatus) => {
    try {
      const employeeDocRef = doc(db, "employees", employeeId);
      await updateDoc(employeeDocRef, { status: newStatus });

      const updatedEmployees = employees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, status: newStatus }
          : employee
      );
      setEmployees(updatedEmployees);
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

  const handleClose = () => setOpenModal(false);
  const handleShow = (skill) => {
    setSelectedSkill(skill);
    setOpenModal(true);
  };


  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditEmployeeData(null);
  };

  const handleUpdateEmployee = async () => {
    try {
      const employeeDocRef = doc(db, "employees", editEmployeeData.id);
      await updateDoc(employeeDocRef, editEmployeeData);

      const updatedEmployees = employees.map((employee) =>
        employee.id === editEmployeeData.id ? editEmployeeData : employee
      );
      setEmployees(updatedEmployees);
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating employee data:", error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const employeeDocRef = doc(db, "employees", employeeId);
        await deleteDoc(employeeDocRef);
        setEmployees(employees.filter((employee) => employee.id !== employeeId));
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const handleFileChange = async (event, fieldName) => {
    const file = event.target.files[0];
    if (file && editEmployeeData) {
      const storageRef = ref(
        storage,
        `employees/${editEmployeeData.id}/${fieldName}`
      );
      try {
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);
        setEditEmployeeData({ ...editEmployeeData, [fieldName]: fileURL });
      } catch (error) {
        console.error(`Error uploading ${fieldName}:`, error);
      }
    }
  };


  const indexOfLastEmployee = currentPage * recordsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - recordsPerPage;
  const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);
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

  // Function to handle manager selection change
  // const handleManagerChange = async (event, employeeId) => {
  //   const selectedManager = event.target.value;

  //   // Update the selected manager in the Firestore database
  //   const employeeDocRef = doc(db, 'employees', employeeId); // assumes 'employees' is your collection name
  //   await updateDoc(employeeDocRef, {
  //     departmentManager: selectedManager,
  //   });

  //   // Optionally, update local state if needed to reflect change in UI
  //   setEmployees((prevEmployees) =>
  //     prevEmployees.map((emp) =>
  //       emp.id === employeeId ? { ...emp, departmentManager: selectedManager } : emp
  //     )
  //   );
  // };

  const handleManagerChange = async (event, employeeId) => {
    const selectedManager = event.target.value;
    const employeeRef = doc(db, "employees", employeeId);
  
    try {
      // Update the manager and approval status
      await updateDoc(employeeRef, {
        departmentManager: selectedManager,
      
      });
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.id === employeeId
            ? { ...emp, departmentManager: selectedManager, }
            : emp
        )
      );
    } catch (error) {
      console.error("Error updating manager approval status:", error);
    }
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
                {currentEmployees.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{indexOfFirstEmployee + index + 1}</td>
                    <td>{employee.name}</td>
                    <td>{employee.contactNo}</td>
                    <td>{employee.email}</td>
                    <td>{employee.location}</td>
                    <td>
                      {employee.skills.length > 20 ? (
                        <>
                          {employee.skills.substring(0, 20)}...
                          <a href="#!" onClick={() => handleShow(employee.skills)}>
                            View More
                          </a>
                        </>
                      ) : (
                        employee.skills
                      )}
                    </td>
                    <td>
                      {employee.status === "Review" ? (
                        <select
                          className="form-select"
                          value={employee.departmentManager || ""}
                          onChange={(event) => handleManagerChange(event, employee.id)}
                          disabled={!!employee.departmentManager} // Disable if a manager is already selected
                        >
                          <option value="">Select Manager</option>
                          {getMatchingManagers(employee.department).map((manager) => (
                            <option key={manager.id} value={manager.fullName}>
                              {manager.fullName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select className="form-select" disabled>
                          <option value="">Select</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      )}
                      {
                        employee.approvalStatus
                      }
                    </td>
                    <td>
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

        {/* Modal to display employee details */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Employee Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEmployee && (
              <div className="container">
                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Name:</strong> {selectedEmployee.name}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Father's Name:</strong> {selectedEmployee.fathername}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Date of Birth:</strong> {selectedEmployee.dob}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Gender:</strong> {selectedEmployee.gender}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Contact No:</strong> {selectedEmployee.contactNo}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Alternate Contact No:</strong> {selectedEmployee.alternateContactNo}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Email:</strong> {selectedEmployee.email}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Location:</strong> {selectedEmployee.location}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Education Qualification:</strong>{" "}
                      {selectedEmployee.educationQualification}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Experience:</strong> {selectedEmployee.experience}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>UAN Number:</strong> {selectedEmployee.uanNumber}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Skills:</strong> {selectedEmployee.skills}
                    </p>
                  </div>
                </div>

                {selectedEmployee.resume && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Resume:</strong>{" "}
                        <a
                          href={selectedEmployee.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resume
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Aadhaar Card */}
                {selectedEmployee.aadhaarCard && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Aadhaar Card:</strong>{" "}
                        <a
                          href={selectedEmployee.aadhaarCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Aadhaar Card
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* PAN Card */}
                {selectedEmployee.panCard && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>PAN Card:</strong>{" "}
                        <a
                          href={selectedEmployee.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View PAN Card
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Profile Image */}
                {selectedEmployee.image && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Profile Image:</strong>
                      </p>
                      <img
                        src={selectedEmployee.image}
                        alt="Profile"
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="col-md-6 col-sm-12">
                  <p>
                    <strong>Aadhaar Card Number:</strong> {selectedEmployee.aadhaarCardNumber}
                  </p>
                </div>

                <div className="col-md-6 col-sm-12">
                  <p>
                    <strong>Pan Card Number:</strong> {selectedEmployee.panCardNumber}
                  </p>
                </div>

                {/* Driving License */}
                {selectedEmployee.drivingLicense && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Driving License:</strong>{" "}
                        <a
                          href={selectedEmployee.drivingLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Driving License
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal for editing employee details */}
        <Modal
          className="edit-modal-main"
          show={showEditModal}
          onHide={handleCloseEditModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Employee</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editEmployeeData && (
              <form>
                {/* Name and Father's Name */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.name}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Father's Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.fathername}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          fathername: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Date of Birth and Contact No */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editEmployeeData.dob}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          dob: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <label>Aadhaar Card Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.aadhaarCardNumber || ''} // ensure value is not undefined
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          aadhaarCardNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-md-6 col-sm-12">
                    <label>Pan Card Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.panCardNumber || ''} // ensure value is not undefined
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          panCardNumber: e.target.value,
                        })
                      }
                    />
                  </div>


                  <div className="col-md-6">
                    <label>Contact No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.contactNo}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          contactNo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <label>Alternate Contact No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.alternateContactNo || ''} // ensure value is not undefined
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          alternateContactNo: e.target.value,
                        })
                      }
                    />
                  </div>

                </div>

                {/* Email and Gender */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmployeeData.email}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Gender</label>
                    <select
                      className="form-control"
                      value={editEmployeeData.gender}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Education Qualification and Location */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Education Qualification:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.educationQualification}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          educationQualification: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.location}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Skills and Resume */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Skills</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.skills}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          skills: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Resume</label>
                    {editEmployeeData.resume && (
                      <p>
                        <strong>Current Resume:</strong>{" "}
                        <a
                          href={editEmployeeData.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Current Resume
                        </a>
                      </p>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, "resume")}
                    />
                  </div>
                </div>

                {/* Aadhaar Card and PAN Card */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Aadhaar Card</label>
                    {editEmployeeData.aadhaarCard && (
                      <p>
                        <strong>Current Aadhaar Card:</strong>{" "}
                        <a
                          href={editEmployeeData.aadhaarCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Current Aadhaar Card
                        </a>
                      </p>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, "aadhaarCard")}
                    />
                  </div>
                  <div className="col-md-6">
                    <label>PAN Card</label>
                    {editEmployeeData.panCard && (
                      <p>
                        <strong>Current PAN Card:</strong>{" "}
                        <a
                          href={editEmployeeData.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Current PAN Card
                        </a>
                      </p>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, "panCard")}
                    />
                  </div>
                </div>

                {/* Profile Image and Driving License */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Profile Image</label>
                    {editEmployeeData.image && (
                      <p>
                        <strong>Current Profile Image:</strong>
                        <br />
                        <img
                          src={editEmployeeData.image}
                          alt="Profile"
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                          }}
                        />
                      </p>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, "image")}
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Driving License</label>
                    {editEmployeeData.drivingLicense && (
                      <p>
                        <strong>Current Driving License:</strong>{" "}
                        <a
                          href={editEmployeeData.drivingLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Current Driving License
                        </a>
                      </p>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, "drivingLicense")}
                    />
                  </div>
                </div>

                {/* UAN Number */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>UAN Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.uanNumber}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          uanNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter experience in years"
                      value={editEmployeeData.experience}
                      onChange={(e) => setEditEmployeeData({ ...editEmployeeData, experience: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEditModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleUpdateEmployee}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openModal} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Full Skills Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>{selectedSkill}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default EmployeeDetails;
