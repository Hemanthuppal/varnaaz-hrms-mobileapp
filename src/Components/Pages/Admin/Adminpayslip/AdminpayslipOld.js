import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../Shared/AdminSidebar/AdminSidebar';
import './AdminPayslip.css';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, query, where  } from "firebase/firestore";
import { useAuth } from '../../../Context/AuthContext';
import PayslipTable from './AdminPayslipDetails'

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
    };

    useEffect(() => {
        // Automatically populate fullName and role when employeeId changes
        if (formData.employeeId) {
            const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
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
    }, [formData.employeeId, employees]);

    // const handleSalaryChange = (e) => {
    //     const salary = parseFloat(e.target.value) || 0; // Convert salary to a number
    //     const travellingAllowance = 15000; // Fixed value
    //     const epf = 1800; // Fixed value
    //     const professionalTax = salary >= 21000 ? 200 : 0; // Conditional deduction

    //     // Calculate the basic salary
    //     const calculatedBasicSalary = salary - travellingAllowance - epf - professionalTax;
    //     setFormData(prevData => ({
    //         ...prevData,
    //         salary: e.target.value,
    //         basicsalary: calculatedBasicSalary < 0 ? 0 : calculatedBasicSalary, // Prevent negative basic salary
    //     }));
    // };

    const handleSalaryChange = (e) => {
        const salary = parseFloat(e.target.value) || 0; // Convert salary to a number
        const travellingAllowance = 15000; // Fixed value
    
        // Calculate the basic salary by deducting only the travelling allowance
        const calculatedBasicSalary = salary - travellingAllowance;
        
        setFormData(prevData => ({
            ...prevData,
            salary: e.target.value,
            basicsalary: calculatedBasicSalary < 0 ? 0 : calculatedBasicSalary, // Prevent negative basic salary
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const db = getFirestore(); // Get Firestore instance
    
        const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
        const employeeUid = selectedEmployee ? selectedEmployee.employeeUid : ''; 
    
        if (!employeeUid) {
            console.error("Employee UID not found!"); 
            return;
        }
    
        try {
            const payslipDocRef = doc(db, "payslip", employeeUid);
    
            await setDoc(payslipDocRef, {
                date: formData.date,
                employeeId: formData.employeeId,
                fullName: formData.fullName,
                role: formData.role,
                salary: parseFloat(formData.salary) || 0,
                basicsalary: parseFloat(formData.basicsalary) || 0,
                travellingAllowance: TRAVELLING_ALLOWANCE,
                epf: EPF,
                professionalTax: PROFESSIONAL_TAX,
            });
    
            alert("Payslip added successfully!");
    
            setFormData({
                date: '',
                employeeId: '',
                fullName: '',
                role: '',
                salary: '',
                basicsalary: ''
            });
    
            setIsModalOpen(false); 
        } catch (error) {
            console.error("Error adding payslip: ", error); 
        }
    };
   
    const fetchEmployees = async () => {
        const db = getFirestore();
        const usersCollection = collection(db, "users");
    
        const q = query(usersCollection, where("role", "==", "Manager"));
        const usersSnapshot = await getDocs(q);
    
        const managersList = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            employeeId: doc.data().employeeId,
            fullName: doc.data().fullName, // Add fullName
            role: doc.data().role, // Add role
            employeeUid: doc.id, // Assume 'id' is used as uid
        }));
    
        setEmployees(managersList);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    return (
        <div>
            <AdminSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h1 className='mpayslipheading'>Payslip Details</h1>

                <div className="text-center mb-3">
                    <button
                        className="btn btn-primary addpayslipbutton"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Add Payslip
                    </button>
                </div>

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
                                                    onChange={handleSalaryChange}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="basicsalary">Basic Salary:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="basicsalary"
                                                    value={formData.basicsalary}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="travellingAllowance">Travelling Allowance:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="travellingAllowance"
                                                    value={TRAVELLING_ALLOWANCE}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="epf">EPF:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="epf"
                                                    value={EPF}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="professionalTax">Professional Tax:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="professionalTax"
                                                    value={PROFESSIONAL_TAX}
                                                    readOnly
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
                <PayslipTable />
            </div>
        </div>
    );
}

export default Payslip;
