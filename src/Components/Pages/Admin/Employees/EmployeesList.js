import React, { useState, useEffect } from "react";
import { Modal, Button, Form ,Pagination} from "react-bootstrap";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
} from "firebase/firestore";
import { db } from "./../../../firebase/firebase";
import "./EmployeesList.css";
import AdminDashboard from './../../../Shared/AdminSidebar/AdminSidebar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import EmployeesRegistration from "./EmployeesRegistration";

const EmployeesList = () => {
    const [salesExecutives, setSalesExecutives] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [showEmployeeRegistrationModal, setShowEmployeeRegistrationModal] = useState(false);
    const [showEmployeeEditModal, setShowEmployeeEditModal] = useState(false);
    const [editExecutive, setEditExecutive] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const maxButtonsToShow = 5;
    const [managers, setManagers] = useState([]);
    

    useEffect(() => {
        const fetchManagers = async () => {
            // Fetch managers
            const managersQuery = query(
                collection(db, "users"),
                where("role", "==", "manager")
            );
            const querySnapshot = await getDocs(managersQuery);
            const managersData = querySnapshot.docs.map((doc) => ({
                name: doc.data().fullName,
                uid: doc.id,
            }));
            setManagers(managersData);
        };

        fetchManagers();
    }, []);

    useEffect(() => {
        fetchSalesExecutives();
    }, []);

    const fetchSalesExecutives = async () => {
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", "sales-executive"),
                orderBy('timestamp', 'desc'),
                orderBy('__name__')
            );
            const querySnapshot = await getDocs(q);
            const executivesData = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            }));
            setSalesExecutives(executivesData);
        } catch (error) {
            console.error("Error fetching sales executives: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowEmployeeRegistrationModal = () => setShowEmployeeRegistrationModal(true);

    const handleCloseEmployeeRegistrationModal = () => setShowEmployeeRegistrationModal(false);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleEditClick = (executive) => {
        setEditExecutive(executive);
        setShowEmployeeEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEmployeeEditModal(false);
        setEditExecutive(null);
    };

    const handleEdit = async (updatedExecutive) => {
        const executiveRef = doc(db, "users", updatedExecutive.uid);
        await updateDoc(executiveRef, { ...updatedExecutive });
        handleCloseEditModal();
        fetchSalesExecutives();
    };

    const handleDelete = async (executiveId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete the Executive?");
        if (confirmDelete) {
            await deleteDoc(doc(db, "users", executiveId));
            alert("Deleted successfully!");
            fetchSalesExecutives();
        }
    };

    const filteredExecutives = salesExecutives.filter(executive => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        return executive.fullName.toLowerCase().includes(lowerCaseTerm) ||
            executive.email.toLowerCase().includes(lowerCaseTerm) ||
            executive.mobile.toLowerCase().includes(lowerCaseTerm) ||
            executive.assignedmanager.toLowerCase().includes(lowerCaseTerm);
    });

    const indexOfLastExecutive = currentPage * recordsPerPage;
    const indexOfFirstExecutive = indexOfLastExecutive - recordsPerPage;
    const currentExecutives = filteredExecutives.slice(indexOfFirstExecutive, indexOfLastExecutive);
    const totalPages = Math.ceil(filteredExecutives.length / recordsPerPage);

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
        <div className='employees-container'>
            <AdminDashboard onToggleSidebar={setCollapsed} />
            <div className={`employees-content ${collapsed ? 'collapsed' : ''}`}>
                <h3 className="text-center">Employees</h3>
                <Button variant="primary" onClick={handleShowEmployeeRegistrationModal}>
                    {" "}
                    <FontAwesomeIcon icon={faPlus} /> Add
                </Button>
                <Modal
                    size="lg"
                    show={showEmployeeRegistrationModal}
                    onHide={handleCloseEmployeeRegistrationModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Employee Registration</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <EmployeesRegistration onRegistrationSuccess={handleCloseEmployeeRegistrationModal} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={handleCloseEmployeeRegistrationModal}
                        >
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Mobile</th>
                                <th>Assigned Manager</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentExecutives.map((executive, index) => (
                                <tr key={executive.uid}>
                                    <td>{indexOfFirstExecutive + index + 1}</td>
                                    <td>{executive.fullName}</td>
                                    <td>{executive.email}</td>
                                    <td>{executive.mobile}</td>
                                    <td>{executive.assignedmanager}</td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            className="me-2"
                                            onClick={() => handleEditClick(executive)}>
                                           <FaEdit />
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="me-2"
                                            onClick={() => handleDelete(executive.uid)}>
                                           <FaTrashAlt />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-center">
                    {renderPagination()}
                </div>
                <Modal
                    size="lg"
                    show={showEmployeeEditModal}
                    onHide={handleCloseEditModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Employee</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {editExecutive && (
                            <Form>
                                <Form.Group controlId="formName">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editExecutive.fullName}
                                        onChange={(e) => setEditExecutive({ ...editExecutive, fullName: e.target.value })}
                                    />
                                </Form.Group>
                                {/* <Form.Group controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editExecutive.email}
                                        onChange={(e) => setEditExecutive({ ...editExecutive, email: e.target.value })}
                                    />
                                </Form.Group> */}
                                <Form.Group controlId="formMobile">
                                    <Form.Label>Mobile</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editExecutive.mobile}
                                        onChange={(e) => setEditExecutive({ ...editExecutive, mobile: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group controlId="formAssignedManager">
                                    <Form.Label>Assigned Manager</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={editExecutive.assignedmanager}
                                        onChange={(e) => setEditExecutive({ ...editExecutive, assignedmanager: e.target.value })}
                                    >
                                        {managers.map((manager) => (
                                            <option key={manager.uid} value={manager.name}>
                                                {manager.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Form>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditModal}>
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleEdit(editExecutive)}
                        >
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default EmployeesList;
