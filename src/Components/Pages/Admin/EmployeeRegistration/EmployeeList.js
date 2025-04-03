import React, { useEffect, useState, useCallback } from 'react';
import {
    query,
    where,
    collection,
    getDocs,
    updateDoc,
    doc,
    deleteDoc,
    orderBy // Added orderBy
} from 'firebase/firestore';

import * as XLSX from "xlsx";
import { Modal, Button, Form, Alert, Row, Col, Pagination } from 'react-bootstrap';
import AdminDashboard from '../../../Shared/AdminSidebar/AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPen, faPlus, faEye } from "@fortawesome/free-solid-svg-icons";
import { db, storage } from "./../../../firebase/firebase"; // Adjust the path as needed
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './EmployeeList.css';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 28.6139, // Default latitude (e.g., New Delhi)
    lng: 77.2090, // Default longitude
};



const UsersTable = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // For the modal data
    const [showModal, setShowModal] = useState(false); // Modal control
    const [isEditing, setIsEditing] = useState(false); // To toggle edit mode
    const [formData, setFormData] = useState({}); // For storing user data in edit mode
    const [uploadError, setUploadError] = useState(null); // For handling upload errors
    const navigate = useNavigate();

    // States for Location Picker Modal
    const [showMapModal, setShowMapModal] = useState(false);
    const [markerPosition, setMarkerPosition] = useState(null);
    const [coordinates, setCoordinates] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(5);
    const maxButtonsToShow = 5;
    
    // Fetch users from Firestore
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchDepartments = async () => {
            const querySnapshot = await getDocs(collection(db, "departments"));
            const fetchedDepartments = querySnapshot.docs.map(
                (doc) => doc.data().name
            );
            setDepartments(fetchedDepartments);
        };
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users'); // Replace 'users' with your Firestore collection name
            const q = query(usersCollection, orderBy('timestamp', 'desc')); // Order by timestamp descending
            const userSnapshot = await getDocs(q);
            const userList = userSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const exportToExcel = (data) => {
        // Create a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "UsersData");
        // Trigger the download
        XLSX.writeFile(workbook, "UsersData.xlsx");
    };
    // Handle opening the modal with selected user data
    const handleViewClick = (user) => {
        setSelectedUser(user);
        setFormData(user); // Initialize formData with selected user data
        setShowModal(true);
        setIsEditing(false); // Set to view mode
        setUploadError(null);
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setFormData({
            ...user,
            locationName: '', // Initialize locationName
        });
        setShowModal(true);
        setIsEditing(true); // Set to edit mode
        setUploadError(null);
    };

    // Handle closing the modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({});
        setUploadError(null);
        setMarkerPosition(null); // Reset marker position
    };

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Upload file to Firebase Storage and return the download URL
    const uploadFile = async (file, folder, existingUrl) => {
        if (!file) return existingUrl; // Return existing URL if no new file is selected
        const storageRef = ref(storage, `${folder}/${selectedUser.id}_${Date.now()}_${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error(`Error uploading ${folder}:`, error);
            throw error;
        }
    };

    // Function to fetch employees with 'Selected' status
    const fetchEmployees = async () => {
        try {
            const q = query(
                collection(db, "employees"),
                where("status", "==", "Selected")
            );
            const querySnapshot = await getDocs(q);
            const employeesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(employeesData);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    useEffect(() => {
        fetchEmployees(); // Fetch employee data on component mount
    }, []);

    // Save changes to Firestore
    const handleSaveChanges = async () => {
        setUploadError(null); // Reset upload error
        try {
            // Upload Photo file if a new file is selected
            const photoURL = formData.photoFile
                ? await uploadFile(formData.photoFile, 'photos', selectedUser.photo)
                : selectedUser.photo;

            // Upload Resume file if a new file is selected
            const resumeURL = formData.resumeFile
                ? await uploadFile(formData.resumeFile, 'resumes', selectedUser.resume)
                : selectedUser.resume;

            // Prepare the data to update
            const updatedData = {
                ...formData,
                photo: photoURL, // Update with new URL if uploaded
                resume: resumeURL, // Update with new URL if uploaded
            };

            // Ensure location is properly formatted
            if (formData.location) {
                updatedData.Coordinates = {
                    lat: formData.location.lat,
                    lng: formData.location.lng
                };
            }

            // Remove the file objects from updatedData before updating Firestore
            delete updatedData.photoFile;
            delete updatedData.resumeFile;

            const userRef = doc(db, 'users', selectedUser.id); // Get the document reference
            await updateDoc(userRef, updatedData); // Update the document with formData

            // Close the modal
            handleCloseModal();

            // Refresh user list
            fetchUsers();
        } catch (error) {
            console.error("Error saving changes:", error);
            setUploadError("Failed to upload files or save changes. Please try again.");
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        try {
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef); // Delete the document
            // Refresh user list
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete the user. Please try again.");
        }
    };

    // Handle Add Employee button click
    const handleAddLeaveClick = () => {
        navigate('/a-addemployee'); // Navigate to the /a-addemployee page
    };

    // Handle opening the Map Modal
    const handleOpenMapModal = () => {
        if (formData.location) {
            setMarkerPosition(formData.location);
        } else if (selectedUser && selectedUser.location) {
            setMarkerPosition(selectedUser.location);
        } else {
            setMarkerPosition(defaultCenter);
        }
        setShowMapModal(true);
    };

    // Handle selecting a location on the map
    const handleMapClick = useCallback((event) => {
        setMarkerPosition({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
        });
    }, []);

    // 1. Hardcode the Google Maps API Key
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU', // Hardcoded API Key
    });

    const handleSearchLocation = async () => {
        const locationName = formData.locationName;
        if (!locationName) {
            alert("Please enter a location name.");
            return;
        }

        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU`);
            const data = await response.json();
            if (data.status === "OK") {
                const { lat, lng } = data.results[0].geometry.location;
                setMarkerPosition({ lat, lng });
                setFormData(prev => ({
                    ...prev,
                    location: { lat, lng }
                }));
                setCoordinates({ lat, lng }); // Set the coordinates state
            } else {
                alert("Location not found. Please try another search.");
                setCoordinates(null); // Reset coordinates if location not found
            }
        } catch (error) {
            console.error("Error fetching location coordinates:", error);
            alert("Error fetching location coordinates. Please try again.");
        }
    };

    // Handle confirming the selected location
    const handleConfirmLocation = () => {
        if (markerPosition) {
            setFormData(prevData => ({
                ...prevData,
                location: markerPosition
            }));
            setShowMapModal(false);
        } else {
            alert("Please select a location on the map.");
        }
    };

    const indexOfLastEmployee = currentPage * recordsPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - recordsPerPage;
    const currentUsers = users.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(users.length / recordsPerPage);
  
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

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className='admin-employees-container'>
            <AdminDashboard onToggleSidebar={setCollapsed} />
            <div className={`admin-employees-content ${collapsed ? 'collapsed' : ''}`}>
                <h2 className="text-center">User Details</h2>
                <div className='d-flex justify-content-between'>
                <Button variant="primary" onClick={handleAddLeaveClick} className="mb-3">
                    <FontAwesomeIcon icon={faPlus} /> Add
                </Button>
                {/* <Button variant="primary" onClick={() => exportToExcel(users)}>Download Excel  </Button> */}
                </div>
                <div className="table-responsive">
                <table className="styled-table">
    <thead>
        <tr>
            <th>S No.</th> {/* Add S No. column */}
            <th>Employee ID</th>
            <th>Full Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th> {/* Action column */}
        </tr>
    </thead>
    <tbody>
        {currentUsers.length > 0 ? (
            currentUsers.map((user, index) => (
                <tr key={user.id}>
                    <td>{indexOfFirstEmployee+index + 1}</td> {/* Serial number based on index */}
                    <td>{user.employeeId}</td>
                    <td>{user.fullName}</td>
                    <td>{user.mobile}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>

                    <td>
                        <Button onClick={() => handleViewClick(user)} variant="primary" className="me-2">
                            <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button
                            onClick={() => handleEditClick(user)}
                            variant="primary"
                            className="mx-2"
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </Button>
                        <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="danger"
                            className="ms-2"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    </td>
                </tr>
            ))
        ) : (
            <tr>
                <td colSpan="6" className="text-center">No users found.</td>
            </tr>
        )}
    </tbody>
</table>
<div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
                </div>

                {/* Modal to display all user details */}
                {selectedUser && (
                    <Modal style={{ maxHeight: "700px", overflowY: "scroll" }} show={showModal} onHide={handleCloseModal} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {isEditing ? `Edit User: ${selectedUser.fullName}` : `User Details: ${selectedUser.fullName}`}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {uploadError && <Alert variant="danger">{uploadError}</Alert>}
                            {isEditing ? (
                                <Form style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly" }}>
                                    <div className='col-md-6' style={{ marginRight: "10px" }}>
                                        <Form.Group className="mb-3" controlId="formEmployeeId">
                                            <Form.Label>Employee ID</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="employeeId"
                                                value={formData.employeeId || ''}
                                                onChange={handleInputChange}
                                                readOnly // Make Employee ID read-only
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formRole">
                                            <Form.Label>Role</Form.Label>
                                            <Form.Control
                                                as="select"  // Use 'select' instead of 'text'
                                                name="role"
                                                value={formData.role || ''}  // Binds the selected value to formData.role
                                                onChange={handleInputChange}  // Handles role change
                                                required
                                            >
                                                <option value="">Select Role</option>
                                                <option value="Employee">Employee</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Admin">Admin</option>
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formFullName">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        {/* Email Field - Set to Read-Only */}
                                        <Form.Group className="mb-3" controlId="formEmail">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={formData.email || ''}
                                                readOnly // Make email read-only
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formGender">
                                            <Form.Label>Gender</Form.Label>
                                            <Form.Control
                                                as="select"  // This specifies the form control as a select dropdown
                                                name="gender"
                                                value={formData.gender || ''}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formMobile">
                                            <Form.Label>Mobile</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="mobile"
                                                value={formData.mobile || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formAadhaarNumber">
                                            <Form.Label>Aadhaar Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="aadhaarNumber"
                                                value={formData.aadhaarNumber || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formAddress">
                                            <Form.Label>Address</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="address"
                                                value={formData.address || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group style={{marginTop:'40px'}} className="mb-3" controlId="formResume">
                                            <Form.Label>Resume</Form.Label>
                                            <Form.Control
                                                type="file"
                                                name="resumeFile"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            resumeFile: e.target.files[0]
                                                        }));
                                                    }
                                                }}
                                                accept=".pdf,.doc,.docx"
                                            />
                                            {selectedUser.resume && (
                                                <Form.Text>
                                                    Current Resume: <a href={selectedUser.resume} target="_blank" rel="noopener noreferrer">View Resume</a>
                                                </Form.Text>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formAccountNumber">
                                            <Form.Label>Account Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="accountNumber"
                                                value={formData.accountNumber || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        {/* <Form.Group className="mb-3" controlId="formProject">
                                            <Form.Label>Project</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="project"
                                                value={formData.project || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group> */}
                                    </div>
                                    <div className='col-md-6'>
                                        <Form.Group className="mb-3" controlId="formBranch">
                                            <Form.Label>Branch</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="branch"
                                                value={formData.branch || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formIfsc">
                                            <Form.Label>IFSC</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ifsc"
                                                value={formData.ifsc || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formDepartment">
                                            <Form.Label>Department</Form.Label>
                                            <Form.Control
                                                as="select"  // This makes the Form.Control a select element
                                                name="department"
                                                value={formData.department || ''}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map((dept, index) => (
                                                    <option key={index} value={dept}>
                                                        {dept}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formDob">
                                            <Form.Label>DOB</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="dob"
                                                value={formData.dob ? formData.dob.split("T")[0] : ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formFatherName">
                                            <Form.Label>Father's Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="fatherName"
                                                value={formData.fatherName || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formSpecialisation">
                                            <Form.Label>Specialisation</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="specialisation"
                                                value={formData.specialisation || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formEducation">
                                            <Form.Label>Education</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="education"
                                                value={formData.education || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        {/* <Form.Group className="mb-3" controlId="formAssignedManager">
                                            <Form.Label>Assigned Manager</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="assignedManager"
                                                value={formData.assignedManager || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group> */}

                                        <Form.Group className="mb-3" controlId="formPhoto">
                                            <Form.Label>Photo</Form.Label>
                                            <Form.Control
                                                type="file"
                                                name="photoFile"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            photoFile: e.target.files[0]
                                                        }));
                                                    }
                                                }}
                                            />
                                            {selectedUser.photo && (
                                                <Form.Text>
                                                    Current Photo: <a href={selectedUser.photo} target="_blank" rel="noopener noreferrer">View Photo</a>
                                                </Form.Text>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="formBank">
                                            <Form.Label>Bank</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="bank"
                                                value={formData.bank || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>

                                        {/* <Form.Group style={{marginTop:'40px'}} className="mb-3" controlId="formLocation">
                                            <Form.Label>Location</Form.Label>
                                            <div className="d-flex align-items-center mb-2">

                                                <Button variant="secondary" onClick={handleOpenMapModal}>
                                                    Select on Map
                                                </Button>
                                            </div>
                                            {formData.location && (
                                                <div>
                                                    <p className="mb-0"><strong>Lat:</strong> {formData.location.lat}</p>
                                                    <p className="mb-0"><strong>Lng:</strong> {formData.location.lng}</p>
                                                </div>
                                            )}
                                        </Form.Group> */}
                                    </div>
                                </Form>
                            ) : (
                                <>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Employee ID:</strong> {selectedUser.employeeId}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Email:</strong> {selectedUser.email}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Role:</strong> {selectedUser.role}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Full Name:</strong> {selectedUser.fullName}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Gender:</strong> {selectedUser.gender}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Mobile:</strong> {selectedUser.mobile}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Aadhaar Number:</strong> {selectedUser.aadhaarNumber}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Address:</strong> {selectedUser.address}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Bank:</strong> {selectedUser.bank}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Account Number:</strong> {selectedUser.accountNumber}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Branch:</strong> {selectedUser.branch}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>IFSC:</strong> {selectedUser.ifsc}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Department:</strong> {selectedUser.department}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>DOB:</strong> {selectedUser.dob}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Father's Name:</strong> {selectedUser.fatherName}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Specialisation:</strong> {selectedUser.specialisation}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Education:</strong> {selectedUser.education}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Photo:</strong> {selectedUser.photo ? <a href={selectedUser.photo} target="_blank" rel="noopener noreferrer">View Photo</a> : "N/A"}</p>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Resume:</strong> {selectedUser.resume ? <a href={selectedUser.resume} target="_blank" rel="noopener noreferrer">View Resume</a> : "N/A"}</p>
                                        </Col>
                                        {/* <Col md={6}>
                                            <p><strong>Assigned Manager:</strong> {selectedUser.assignedManager}</p>
                                        </Col> */}
                                        {/* <Col md={6}>
                                            <p><strong>Project:</strong> {selectedUser.project}</p>
                                        </Col> */}
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <p><strong>OfferLetter:</strong> {selectedUser.offerletter ? <a href={selectedUser.offerletter} target="_blank" rel="noopener noreferrer">View OfferLeter</a> : "N/A"}</p>
                                        </Col>

                                        {/* <Col md={6}>
                                            <p><strong>Location:</strong></p>
                                            {selectedUser.location ? (
                                                <>
                                                    <p><strong>Latitude:</strong> {selectedUser.location.lat}</p>
                                                    <p><strong>Longitude:</strong> {selectedUser.location.lng}</p>
                                                </>
                                            ) : (
                                                <p>N/A</p>
                                            )}
                                        </Col> */}
                                    </Row>
                                </>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            {isEditing ? (
                                <>
                                    <Button variant="secondary" onClick={handleCloseModal}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleSaveChanges}>
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* <Button variant="primary" onClick={() => setIsEditing(true)}>
                                        <FontAwesomeIcon icon={faPen} /> Edit
                                    </Button> */}
                                    <Button variant="secondary" onClick={handleCloseModal}>
                                        Close
                                    </Button>
                                </>
                            )}
                        </Modal.Footer>
                    </Modal>
                )}

                {/* Map Modal for Location Picker */}
                <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <div className='d-flex align-items-center mb-2'>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter location name"
                                    value={formData.locationName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
                                    className="me-2"
                                    style={{ width: "43vw" }}
                                />
                                <Button variant="secondary" onClick={handleSearchLocation} className="me-2">
                                    Search
                                </Button>
                            </div>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={markerPosition ? 12 : 4} // Zoom in if marker position is set
                            center={markerPosition || defaultCenter} // Center the map on the marker or default center
                            onClick={handleMapClick} // Allow users to click on the map to set a marker
                        >
                            {markerPosition && <Marker position={markerPosition} />} {/* Ensure marker is rendered if markerPosition exists */}
                        </GoogleMap>
                        <p className="mt-3">Click on the map to select a location.</p>
                        {coordinates && (
                            <div className="mt-3">
                                <strong>Coordinates:</strong> Latitude: {coordinates.lat}, Longitude: {coordinates.lng}
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowMapModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmLocation}
                            disabled={!coordinates || !coordinates.lat || !coordinates.lng} // Disable if no coordinates
                        >
                            Confirm Location
                        </Button>
                    </Modal.Footer>
                </Modal>


            </div>
        </div>
    );
};

export default UsersTable;
