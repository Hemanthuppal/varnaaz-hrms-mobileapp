import React, { useState, useEffect } from 'react';
import ManagerSidebar from './../../../Shared/ManagerSidebar/ManagerSidebar';
import { db } from '../../../firebase/firebase';
import { faEye } from "@fortawesome/free-solid-svg-icons";
import './EmpOnboarding.css';
import { useAuth } from './../../../Context/AuthContext';
import EmployeeDetailsModal from "./.././../Admin/Onboarding/viewOnboardingModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import CommentModal from './CommentModal'; // Import the new CommentModal
import SkillsModal from "./viewSkillsModal";

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
                    comment: doc.data().comment || '', // Load comment from Firestore
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

    const handleAddCommentClick = (employee) => {
        setSelectedEmployee(employee);
        setShowCommentModal(true);
    };

    const handleSaveComment = async (id, comment) => {
        setEmployees((prevEmployees) =>
            prevEmployees.map((employee) =>
                employee.id === id ? { ...employee, comment } : employee
            )
        );

        try {
            await db.collection('employees').doc(id).update({
                comment,
            });
        } catch (err) {
            console.error('Error saving comment: ', err);
        }
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
                <h1>EmpOnboarding</h1>

                <div>
                    {employees.length > 0 ? (
                        <div className="table-responsive">
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
                                {employees.map((employee, index) => (
                                    <tr key={employee.id}>
                                        <td>{index + 1}</td>
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
                                        <td>
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
    {employee.comment ? (
        <Button variant="info" onClick={() => handleAddCommentClick(employee)}>
            <FontAwesomeIcon icon={faEye} /> View 
        </Button>
    ) : (
        <Button variant="secondary" onClick={() => handleAddCommentClick(employee)}>
            Add 
        </Button>
    )}
</td>

                                        <td>
                                            <Button variant="primary" onClick={() => handleViewClick(employee)} className="me-2">
                                                <FontAwesomeIcon icon={faEye} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <p>No employees found</p>
                    )}
                </div>
             

                {selectedEmployee && (
                    <EmployeeDetailsModal
                        show={showDetailsModal}
                        selectedEmployee={selectedEmployee}
                        onHide={handleCloseDetailsModal}
                    />
                )}

                {selectedEmployee && (
                    <CommentModal
                        show={showCommentModal}
                        onHide={() => setShowCommentModal(false)}
                        employee={selectedEmployee}
                        onSaveComment={handleSaveComment}
                    />
                )}
                 <SkillsModal show={showSkillsModal} onHide={handleCloseSkillsModal} skill={selectedSkill} />
            </div>
        </div>
    );
};

export default EmpOnboarding;
