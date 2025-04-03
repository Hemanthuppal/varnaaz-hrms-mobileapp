import React, { useEffect, useState } from 'react';
import ManagerSidebar from '../../../Shared/ManagerSidebar/ManagerSidebar';
import './AddPayslip.css';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc } from "firebase/firestore";
import { useAuth } from '../../../Context/AuthContext';
import PayslipTable from './PayslipTable'

const Payslip = () => {
    const [employees, setEmployees] = useState([]); // Store full employee details
    const [collapsed, setCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
    const { user } = useAuth();
   

    const [formData, setFormData] = useState({
        date: '',
        employeeId: '',
        fullName: '',
        role: '',
        salary: '',
        basicsalary: '',
    });

    const TRAVELLING_ALLOWANCE = 15000; // Fixed value
    const EPF = 1800; // Fixed value
    const PROFESSIONAL_TAX = 200; // Fixed value

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]: value,
        }));

        // Automatically populate fullName and role when employeeId is selected
        if (id === "employeeId") {
            const selectedEmployee = employees.find(emp => emp.employeeId === value);
            if (selectedEmployee) {
                setFormData(prevState => ({
                    ...prevState,
                    fullName: selectedEmployee.fullName,
                    role: selectedEmployee.role,
                }));
            } else {
                // Clear fullName and role if no employee is found
                setFormData(prevState => ({
                    ...prevState,
                    fullName: '',
                    role: '',
                }));
            }
        }

        // Calculate basic salary when salary is entered
        // if (id === "salary") {
        //     const salary = parseFloat(value) || 0; // Convert salary to a number
        //     const travellingAllowance = 15000; // Fixed value
        //     const epf = 1800; // Fixed value
        //     const professionalTax = salary >= 21000 ? 200 : 0; // Conditional deduction
            
        //     // Calculate the basic salary
        //     const calculatedBasicSalary = salary - travellingAllowance - epf - professionalTax;
        //     setFormData(prevData => ({
        //         ...prevData,
        //         basicsalary: calculatedBasicSalary < 0 ? 0 : calculatedBasicSalary, // Prevent negative basic salary
        //     }));
        // }
        if (id === "salary") {
            const salary = parseFloat(value) || 0; // Convert salary to a number
            const travellingAllowance = 15000; // Fixed value
            
            // Calculate the basic salary by only deducting travelling allowance
            const calculatedBasicSalary = salary - travellingAllowance;
            
            setFormData(prevData => ({
                ...prevData,
                basicsalary: calculatedBasicSalary < 0 ? 0 : calculatedBasicSalary, // Prevent negative basic salary
            }));
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const db = getFirestore(); // Get Firestore instance
    
        // Find the selected employee to get the employeeUid
        const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
        const employeeUid = selectedEmployee ? selectedEmployee.employeeUid : ''; // Assuming 'uid' is the correct field for employeeUid
    
        if (!employeeUid) {
            console.error("Employee UID not found!"); // Handle the case where employee UID is not found
            return;
        }
    
        try {
            // Use employeeUid as the document ID
            const payslipDocRef = doc(db, "payslip", employeeUid); // Create a reference with employeeUid as UID
    
            // Set form data in the payslip document
            await setDoc(payslipDocRef, {
                date: formData.date,
                employeeId: formData.employeeId,
                fullName: formData.fullName,
                role: formData.role,
                salary: parseFloat(formData.salary) || 0, // Ensure salary is stored as a number
                basicsalary: parseFloat(formData.basicsalary) || 0, // Ensure basic salary is stored as a number
                travellingAllowance: TRAVELLING_ALLOWANCE,
                epf: EPF,
                professionalTax: PROFESSIONAL_TAX,
            });
    
            console.log("Payslip added successfully!"); // Optional: log success message
            alert("Payslip added successfully!"); // Show alert
    
            // Reset form fields to default values
            setFormData({
                date: '',
                employeeId: '',
                fullName: '',
                role: '',
                salary: '',
                basicsalary: ''
            });
    
            setIsModalOpen(false); // Close the modal after submission
        } catch (error) {
            console.error("Error adding payslip: ", error); // Log any errors
        }
    };
    
    
    
    const fetchEmployees = async () => {
        const db = getFirestore();
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter employees based on the current manager's employeeUid
        const assignedEmployees = usersList.filter(emp => emp.assignedManagerUid === user.employeeUid);
        
        console.log("Current manager UID:", user.employeeUid);
        // Assuming 'employeeId', 'fullName', and 'role' fields exist in the users collection
        setEmployees(assignedEmployees);
    };


    useEffect(() => {
        fetchEmployees();
    }, []);

    return (
        <div>
            <ManagerSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h1 className='mpayslipheading'>Payslip Details</h1>

                {/* Button to open the modal */}
                <div className="text-center mb-3">
                    <button
                        className="btn btn-primary addpayslipbutton"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Add Payslip
                    </button>
                </div>

                {/* Modal for the form */}
                {isModalOpen && (
                    <div className="modal show" style={{ display: 'block' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Payslip</h5>
                                    <button
                                        type="button"
                                        className="close"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-6">
                                                <label htmlFor="date">Date:</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    id="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="employeeId">Employee ID:</label>
                                                <select
                                                    className="form-control"
                                                    id="employeeId"
                                                    value={formData.employeeId}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select Employee</option>
                                                    {employees.map((employee) => (
                                                        <option key={employee.id} value={employee.employeeId}>
                                                            {employee.employeeId}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="fullName">Full Name:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="role">Role:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="salary">Salary:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="salary"
                                                    value={formData.salary}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="basicsalary">Basic Salary:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="basicsalary"
                                                    value={formData.basicsalary}
                                                    onChange={handleInputChange}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="travellingAllowance">Travelling Allowance:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="travellingAllowance"
                                                    value={TRAVELLING_ALLOWANCE} // Set the fixed value directly
                                                    readOnly // Optional: makes the field non-editable
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="epf">EPF:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="epf"
                                                    value={EPF} // Set the fixed value directly
                                                    readOnly // Optional: makes the field non-editable
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="professionalTax">Professional Tax:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="professionalTax"
                                                    value={PROFESSIONAL_TAX} // Set the fixed value directly
                                                    readOnly // Optional: makes the field non-editable
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center mt-2">
                                            <button type="submit" className="btn btn-primary">
                                                Submit
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Background overlay for modal */}
                {isModalOpen && <div className="modal-backdrop fade show"></div>}

                  {/* Include the PayslipTable component to display the payslips */}
                  <PayslipTable />
            </div>
        </div>
    );
};

export default Payslip;
