import React, { useState, useEffect } from 'react';
import ManagerSidebar from './../../../Shared/ManagerSidebar/ManagerSidebar';
import { db } from '../../../firebase/firebase';
import { faEye } from "@fortawesome/free-solid-svg-icons";
import './EmpOnboarding.css';
import { useAuth } from './../../../Context/AuthContext';
import EmployeeDetailsModal from "./.././../Admin/Onboarding/viewOnboardingModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal, Form, Pagination } from "react-bootstrap";
import CommentsModal from './CommentModal';
import SkillsModal from "./viewSkillsModal";
import ManagerHeader from '../Managerheader/ManagerHeader';

const EmpOnboarding = () => {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(5); // Fixed per-page records
    const maxButtonsToShow = 5;

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const querySnapshot = await db.collection('employees')
                    .where('employeeUid', '==', user.employeeUid)
                    .where('department', '==', user.department)
                    .get();

                const employeeData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    approvalStatus: doc.data().approvalStatus || 'Select',
                }));

                setEmployees(employeeData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching employees: ', err);
                setError('Failed to fetch employees');
                setLoading(false);
            }
        };

        if (user) {
            fetchEmployees();
        }
    }, [user]);

    const handleViewClick = (employee) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => setShowDetailsModal(false);

    const handleShowSkillsModal = (skills) => {
        setSelectedSkill(skills);
        setShowSkillsModal(true);
    };

    const handleCloseSkillsModal = () => setShowSkillsModal(false);

    const handleApprovalChange = async (id, newStatus) => {
        setEmployees((prevEmployees) =>
            prevEmployees.map((employee) =>
                employee.id === id ? { ...employee, approvalStatus: newStatus } : employee
            )
        );

        try {
            await db.collection('employees').doc(id).update({
                approvalStatus: newStatus,
            });
        } catch (err) {
            console.error('Error updating approval status: ', err);
        }
    };

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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='manager-emponboarding-container'>
            <ManagerSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-emponboarding-content ${collapsed ? 'collapsed' : ''}`}>
                <ManagerHeader />
                <h1>Employee Onboarding</h1>
                <div className="table-responsive">
                    {employees.length > 0 ? (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Skills</th>
                                    <th>Contact No</th>
                                    <th>Location</th>
                                    <th>Department Manager</th>
                                    <th>Approval Status</th>
                                    <th>Comment</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEmployees.map((employee, index) => (
                                    <tr key={employee.id}>
                                        <td>{index + 1 }</td>
                                        <td>{employee.name}</td>
                                        <td>{employee.email}</td>
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
                                        <td>{employee.contactNo || 'N/A'}</td>
                                        <td>{employee.location || 'N/A'}</td>
                                        <td>{employee.departmentManager || 'N/A'}</td>
                                        {/* <td style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                                            <select
                                                value={employee.approvalStatus}
                                                onChange={(e) => handleApprovalChange(employee.id, e.target.value)}
                                            >
                                                <option value="Select">Select</option>
                                                <option value="Selected">Selected</option>
                                                <option value="Not Selected">Not Selected</option>
                                            </select>
                                        </td> */}
                                        <td  style={{
      width: "auto",
      minWidth: "150px",
      whiteSpace: "nowrap"
    }}>
                                            <select
                                                value={employee.approvalStatus}
                                                onChange={(e) => handleApprovalChange(employee.id, e.target.value)}
                                                disabled={employee.approvalStatus !== 'Select'}
                                            >
                                                <option value="Select">Select</option>
                                                <option value="Selected">Selected</option>
                                                <option value="Not Selected">Not Selected</option>
                                            </select>
                                        </td>
                                        <td>
                                            <Button variant="info" onClick={() => handleOpenCommentsModal(employee.id)}>
                                                <FontAwesomeIcon icon={faEye} />
                                            </Button>
                                        </td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleViewClick(employee)}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No employees found</p>
                    )}
                </div>
                <div className="d-flex justify-content-center">{renderPagination()}</div>
                {selectedEmployee && (
                    <EmployeeDetailsModal
                        show={showDetailsModal}
                        selectedEmployee={selectedEmployee}
                        onHide={handleCloseDetailsModal}
                    />
                )}
               {selectedEmployeeId && (
                    <CommentsModal
                        show={showCommentsModal}
                        onHide={handleCloseCommentsModal}
                        employeeId={selectedEmployeeId}
                    />
                )}
                {showSkillsModal && (
                    <SkillsModal
                        show={showSkillsModal}
                        onHide={handleCloseSkillsModal}
                        skill={selectedSkill}
                    />
                )}
            </div>
        </div>
    );
};

export default EmpOnboarding;
