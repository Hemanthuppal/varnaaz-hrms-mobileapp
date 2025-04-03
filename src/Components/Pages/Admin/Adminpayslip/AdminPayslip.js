import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../Shared/AdminSidebar/AdminSidebar';
import './AdminPayslip.css';
import { getFirestore, collection, getDocs, addDoc, getDoc, setDoc, doc, query, where } from "firebase/firestore";
import { useAuth } from '../../../Context/AuthContext';
import PayslipTable from './AdminPayslipDetails';
import AdminPayslip from "./AdminPayslipdf";
import { storage } from './../../../firebase/firebase';
import { pdf } from '@react-pdf/renderer';
import jsPDF from "jspdf";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const Payslip = () => {
    const [employees, setEmployees] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const [month, setMonth] = useState('');
    const [presentDays, setPresentDays] = useState(0);
    const [lopAmount, setLopAmount] = useState(0);

    const [formData, setFormData] = useState({
        date: '',
        employeeId: '',
        fullName: '',
        role: '',
        basicsalary: '',
        travellingDays: 0,
        travellingAllowance: 0,
        epf: 0,
        professionalTax: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        netSalary: 0
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]: value,
        }));

        if (id === "employeeId") {
            const selectedEmployee = employees.find(emp => emp.employeeId === value);
            if (selectedEmployee) {
                setFormData(prevState => ({
                    ...prevState,
                    fullName: selectedEmployee.fullName,
                    role: selectedEmployee.role,
                }));
            }
        }

        if (id === "basicsalary" || id === "travellingDays") {
            const basicsalary = parseFloat(id === "basicsalary" ? value : formData.basicsalary) || 0;
            const travellingDays = parseInt(id === "travellingDays" ? value : formData.travellingDays, 10) || 0;
            const travellingAllowance = travellingDays * 500;
            const epf = 1800;
            const professionalTax = basicsalary > 21000 ? 200 : 0;
            const totalEarnings = basicsalary + travellingAllowance;
            const totalDeductions = epf + professionalTax;
            const netSalary = totalEarnings - totalDeductions;
            setFormData(prevState => ({
                ...prevState,
                travellingAllowance,
                epf,
                professionalTax,
                totalEarnings,
                totalDeductions,
                netSalary
            }));
        }
    };

    const handleMonthChange = async (e) => {
        const selectedMonth = e.target.value;
        setMonth(selectedMonth);

        // Only proceed if employeeId and selectedMonth are set
        if (!formData.employeeId || !selectedMonth) return;

        const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
        const employeeUid = selectedEmployee ? selectedEmployee.employeeUid : '';

        if (!employeeUid) {
            console.error("Employee UID not found!");
            return;
        }

        const db = getFirestore();
        const payslipDocRef = doc(db, "payslip", employeeUid);
        const payslipDocSnap = await getDoc(payslipDocRef);

        // Check if the document for the selected month already exists
        if (payslipDocSnap.exists() && payslipDocSnap.data()[selectedMonth]) {
            alert(`Payslip for the month ${selectedMonth} has already been generated.`);

            // Close the modal
            setIsModalOpen(false);

            // Clear form fields
            setFormData({
                date: '',
                employeeId: '',
                fullName: '',
                role: '',
                basicsalary: '',
                travellingDays: 0,
                travellingAllowance: 0,
                epf: 0,
                professionalTax: 0,
                totalEarnings: 0,
                totalDeductions: 0,
                netSalary: 0,
                selectedMonth: '',
            });

            // Reset the month field
            setMonth('');
            setPresentDays('');
            // Clear other related states
            setPresentDays(0);
            setLopAmount(0);

            return; // Stop further execution
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const db = getFirestore();
        const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
        const employeeUid = selectedEmployee ? selectedEmployee.employeeUid : '';

        if (!employeeUid) {
            console.error("Employee UID not found!");
            return;
        }

        const payslipMonth = month;  // Assuming 'month' is already in 'YYYY-MM' format


        try {
            const payslipDocRef = doc(db, "payslip", employeeUid);
            const payslipDocSnap = await getDoc(payslipDocRef);

            // Step 1: Check if the document for the selected month already exists
            if (payslipDocSnap.exists() && payslipDocSnap.data()[payslipMonth]) {
                alert(`Payslip for the month ${payslipMonth} has already been generated.`);
                return; // Stop the process if the payslip already exists for the selected month
            }

            // Step 2: Generate PDF with employee details
            const blob = await pdf(
                <AdminPayslip
                    selectedEmployeeId={formData.employeeId}
                    fullName={formData.fullName}
                    basicsalary={parseFloat(formData.basicsalary) || 0}
                    travellingAllowance={formData.travellingAllowance}
                    epf={formData.epf}
                    professionalTax={formData.professionalTax}
                    totalEarnings={formData.totalEarnings}
                    totalDeductions={formData.totalDeductions}
                    netSalary={formData.netSalary}
                    lopDays={formData.lopDays}
                    lopAmount={formData.lopAmount}
                />
            ).toBlob();

            // Step 3: Upload the PDF to Firebase Storage
            const storageRef = ref(storage, `payslips/${formData.employeeId}_${payslipMonth}.pdf`);
            await uploadBytes(storageRef, blob);

            // Step 4: Get the download URL of the uploaded PDF
            const downloadURL = await getDownloadURL(storageRef);

            // Step 5: Store data in Firestore with the required format
            await setDoc(payslipDocRef, {
                [payslipMonth]: {
                    createdAt: new Date(), // Storing the current timestamp

                    employeeId: formData.employeeId,
                    fullName: formData.fullName,
                    role: formData.role,
                    selectedMonth: payslipMonth,
                    travellingDays: formData.travellingDays,
                    basicsalary: parseFloat(formData.basicsalary) || 0,
                    travellingAllowance: formData.travellingAllowance,
                    epf: formData.epf,
                    professionalTax: formData.professionalTax,
                    lopDays: formData.lopDays, // Store LOP Days
                    lopAmount: parseFloat(lopAmount), // Store LOP Amount
                    totalEarnings: formData.totalEarnings,
                    totalDeductions: formData.totalDeductions,
                    netSalary: formData.netSalary,
                    pdfUrl: downloadURL // PDF URL
                }
            }, { merge: true }); // Use merge to update existing document without overwriting

            alert("Payslip added successfully!");
            setFormData({
                date: '',
                employeeId: '',
                fullName: '',
                role: '',
                basicsalary: '',
                travellingDays: 0,
                travellingAllowance: 0,
                epf: 0,
                professionalTax: 0,
                totalEarnings: 0,
                totalDeductions: 0,
                netSalary: 0,
                selectedMonth: "",
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding payslip: ", error);
        }
    };

    const getCurrentMonth = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 since months are 0-indexed
        return `${year}-${month}`;
    };

    // Set the maxMonth to restrict input selection
    const maxMonth = getCurrentMonth();
    const fetchAttendance = async (employeeUid, selectedMonth) => {
        const db = getFirestore();

        // Reference to the document using employeeUid as docId
        const attendanceDocRef = doc(db, "attendance", employeeUid);
        const attendanceDoc = await getDoc(attendanceDocRef);

        if (attendanceDoc.exists()) {
            const attendanceData = attendanceDoc.data();

            let count = 0;
            Object.keys(attendanceData).forEach(docDate => {
                const docMonth = docDate.split("-")[1]; // Extract the month from the date format "DD-MM-YYYY"

                if (docMonth === selectedMonth) {
                    const attendanceDetails = attendanceData[docDate];
                    if (attendanceDetails.statuses === "Present") {
                        count++;
                    }
                }
            });
            return count;
        } else {
            console.log("No attendance record found for the employee.");
            return 0;
        }
    };

    const calculateLop = (totalDays, presentDays, basicSalary) => {
        const lopDays = totalDays - presentDays;
        const lopAmount = ((basicSalary / totalDays) * lopDays).toFixed(2); // Ensure 2 decimal places
        return { lopDays, lopAmount };
    };


    useEffect(() => {
        const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
        const employeeUid = selectedEmployee ? selectedEmployee.employeeUid : '';

        if (employeeUid && month) {
            const selectedMonth = month.split("-")[1]; // Extract month (MM) from YYYY-MM input
            fetchAttendance(employeeUid, selectedMonth).then(presentCount => {
                const totalDays = new Date(month.split("-")[0], selectedMonth, 0).getDate(); // Total days in the month
                setPresentDays(presentCount);
                const { lopDays, lopAmount } = calculateLop(totalDays, presentCount, parseFloat(formData.basicsalary) || 0);

                setLopAmount(lopAmount); // Update local state for displaying
                const totalDeductions = parseFloat(formData.epf) + parseFloat(formData.professionalTax) + parseFloat(lopAmount);

                // Update formData with LOP details and deductions
                setFormData(prevState => ({
                    ...prevState,
                    lopDays,
                    lopAmount, // Set lopAmount in formData to pass correctly
                    totalDeductions,
                    netSalary: prevState.totalEarnings - totalDeductions
                }));
            });
        }
    }, [month, formData.employeeId, formData.basicsalary, employees]);


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

    const exportPDF = (formData) => {
        const doc = new jsPDF();

        // Adding title
        doc.text("Payslip Details", 10, 10);

        // Adding form data to PDF
        doc.text(`Date: ${formData.date}`, 10, 20);
        doc.text(`Employee ID: ${formData.employeeId}`, 10, 30);
        doc.text(`Employee Name: ${formData.fullName}`, 10, 40);
        doc.text(`Role: ${formData.role}`, 10, 50);
        doc.text(`Month: ${formData.month}`, 10, 60);
        doc.text(`Present Days: ${formData.presentDays}`, 10, 70);
        doc.text(`Basic Salary: ${formData.basicsalary}`, 10, 80);
        doc.text(`Travelling Days: ${formData.travellingDays}`, 10, 90);
        doc.text(`Travelling Allowance: ${formData.travellingAllowance}`, 10, 100);
        doc.text(`LOP Amount: ${formData.lopAmount}`, 10, 110);
        doc.text(`EPF: ${formData.epf}`, 10, 120);
        doc.text(`Professional Tax: ${formData.professionalTax}`, 10, 130);
        doc.text(`Total Earnings: ${formData.totalEarnings}`, 10, 140);
        doc.text(`Total Deductions: ${formData.totalDeductions}`, 10, 150);
        doc.text(`Net Salary: ${formData.netSalary}`, 10, 160);

        // Save the PDF
        doc.save("Payslip_Details.pdf");
    };

    return (
        <div >
            <AdminSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-payslip-content ${collapsed ? 'collapsed' : ''}`}>
                <h1 className='mpayslipheading'>Payslip Details</h1>

                {/* <button className="btn btn-secondary" onClick={() => exportPDF(formData)}>
                    Export as PDF
                </button> */}


                <div className="text-center">
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
                            <div className="addpaymodal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Payslip</h5>
                                    <button
                                        type="button"
                                        className="close close-button"
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
                                                <label htmlFor="fullName">Employee Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="fullName"
                                                    value={formData.fullName}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="role">Role</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="role"
                                                    value={formData.role}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="col-6">
                                                <label htmlFor="month">Month:</label>
                                                <input
                                                    type="month"
                                                    id="month"
                                                    className="form-control"
                                                    value={month}
                                                    onChange={handleMonthChange}
                                                    max={maxMonth}
                                                    required
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="presentDays">Present Days:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="presentDays"
                                                    value={presentDays}
                                                    readOnly
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
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="travellingDays">Travelling Days:</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="travellingDays"
                                                    value={formData.travellingDays}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="travellingAllowance">Travelling Allowance:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="travellingAllowance"
                                                    value={formData.travellingAllowance}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="lopAmount">LOP Amount:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lopAmount"
                                                    value={lopAmount}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="epf">EPF:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="epf"
                                                    value={formData.epf}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="professionalTax">Professional Tax:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="professionalTax"
                                                    value={formData.professionalTax}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="totalEarnings">Total Earnings:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="totalEarnings"
                                                    value={formData.totalEarnings}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="totalDeductions">Total Deductions:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="totalDeductions"
                                                    value={formData.totalDeductions}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="netSalary">Net Salary:</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="netSalary"
                                                    value={formData.netSalary}
                                                    readOnly
                                                />
                                            </div>
                                        </div>


                                        <button style={{width:'100px',marginLeft:'260px'}} type="submit" className="btn btn-primary mt-3">
                                            Submit
                                        </button>
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
};

export default Payslip;
