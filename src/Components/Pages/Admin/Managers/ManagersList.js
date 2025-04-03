import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Pagination } from "react-bootstrap";
import { collection, query, where, deleteDoc, updateDoc, doc, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./../../../firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPen, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import ManagerRegistration from './ManagerRegistration';
import AdminDashboard from './../../../Shared/AdminSidebar/AdminSidebar';
import "./ManagersList.css";

const ManagersList = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [managers, setManagers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false); // Modal for editing manager
  const [updatedManager, setUpdatedManager] = useState({});
  const [showEmployeeRegistrationModal, setShowEmployeeRegistrationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const maxButtonsToShow = 5;

  const handleShowEmployeeRegistrationModal = () => setShowEmployeeRegistrationModal(true);
  const handleCloseEmployeeRegistrationModal = () => setShowEmployeeRegistrationModal(false);
  const handleCloseEditModal = () => setShowEditModal(false);

  useEffect(() => {
    console.log("Fetching managers from Firestore...");

    const q = query(
      collection(db, "users"),
      where("role", "==", "manager"),
      orderBy('timestamp', 'desc'),
      orderBy('__name__')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("Received snapshot from Firestore");
      const managersData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      }));
      console.log("Managers data:", managersData);
      setManagers(managersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching managers:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (manager) => {
    console.log('Edit clicked for:', manager);
    setUpdatedManager(manager);
    setShowEditModal(true);
  };

  const handleUpdateChange = (e) => {
    setUpdatedManager({ ...updatedManager, [e.target.name]: e.target.value });
  };

  const handleUpdateManager = async () => {
    try {
      const managerDoc = doc(db, "users", updatedManager.uid);
      await updateDoc(managerDoc, updatedManager);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating manager:", error);
    }
  };

  const handleDelete = async (managerId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this manager?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", managerId));
        setManagers(prevManagers => prevManagers.filter((manager) => manager.uid !== managerId));
      } catch (error) {
        console.error("Error deleting manager:", error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredManagers = managers.filter(manager => {
    const lowerCaseTerm = searchTerm.toLowerCase();
    return manager.fullName.toLowerCase().includes(lowerCaseTerm) ||
      manager.email.toLowerCase().includes(lowerCaseTerm) ||
      manager.mobile.toLowerCase().includes(lowerCaseTerm);
  });



  const indexOfLastManager = currentPage * recordsPerPage;
  const indexOfFirstManager = indexOfLastManager - recordsPerPage;
  const currentManagers = filteredManagers.slice(indexOfFirstManager, indexOfLastManager);
  const totalPages = Math.ceil(filteredManagers.length / recordsPerPage);



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
    <div className='managers-container'>
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`managers-content ${collapsed ? 'collapsed' : ''}`}>
        <Button variant="primary" onClick={handleShowEmployeeRegistrationModal}>
          <FontAwesomeIcon icon={faPlus} /> Add
        </Button>

        <Modal size="lg" show={showEmployeeRegistrationModal} onHide={handleCloseEmployeeRegistrationModal}>
          <Modal.Header closeButton>
            <Modal.Title>Manager Registration</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ManagerRegistration onManagerRegistrationSuccess={handleCloseEmployeeRegistrationModal} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEmployeeRegistrationModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal size="lg" show={showEditModal} onHide={handleCloseEditModal}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Manager</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formFullName">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={updatedManager.fullName || ''}
                  onChange={handleUpdateChange}
                />
              </Form.Group>
              <Form.Group controlId="formMobile">
                <Form.Label>Mobile</Form.Label>
                <Form.Control
                  type="text"
                  name="mobile"
                  value={updatedManager.mobile || ''}
                  onChange={handleUpdateChange}
                />
              </Form.Group>
              {/* <Form.Group controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={updatedManager.email || ''}
                  onChange={handleUpdateChange}
                />
              </Form.Group> */}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEditModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleUpdateManager}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <h1 className="text-center">Managers</h1>

        <div style={{ textAlign: "right", marginBottom: "10px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ padding: "5px", paddingRight: searchTerm ? "25px" : "5px" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: "absolute",
                right: "5px",
                top: "5px",
                border: "none",
                background: "transparent",
                cursor: "pointer"
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
{/* 
        {noResultsFound ? (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            No results found
          </div>
        ) : ( */}
          <table className="styled-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentManagers.map((manager, index) => (
                <tr key={manager.uid}>
                  <td>{indexOfFirstManager + index + 1}</td>
                  <td>{manager.fullName}</td>
                  <td>{manager.mobile}</td>
                  <td>{manager.email}</td>
                  <td>
                    <Button variant="primary" className="me-2" onClick={() => handleEditClick(manager)}>
                    <FaEdit />
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(manager.uid)}>
                    <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {/* )} */}

        {/* {noResultsFound && (
          <div className="no-results">
            <p>No results found for "{searchTerm}".</p>
          </div>
        )} */}

<div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
      </div>
    </div>
  );
};

export default ManagersList;
