import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Replace Redirect with Navigate
import "bootstrap/dist/css/bootstrap.min.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider } from "../src/Components/Context/AuthContext";
import Login from "./Components/Pages/Login/Login";
import AdminAttendence from "./Components/Pages/Admin/AdminAttendence/AdminAttendence";
import AdminLeaveManagement from "./Components/Pages/Admin/AdminLeaveManagement/AdminLeaveManagement";
import AdminPayrollManagement from "./Components/Pages/Admin/AdminPayrollManagement/AdminPayrollManagement";
import ManagerAttendence from "./Components/Pages/Manager/ManagerAttendence/ManagerAttendence";
import ManagerLeaveManagement from "./Components/Pages/Manager/ManagerLeaveManagement/ManagerLeaveManagement";
import ManagerPayrollManagement from "./Components/Pages/Manager/ManagerPayrollManagement/ManagerPayrollManagement";
import Attendence from "./Components/Pages/Employee/Attendence/Attendence";
import LeaveManagement from "./Components/Pages/Employee/LeaveManagement/LeaveManagement";
import PayrollManagement from "./Components/Pages/Employee/PayrollManagement/PayrollManagement";

import Dashboard from "./Components/Pages/Admin/Dashboard/Dashboard";
import ManagerDashboard from "./Components/Pages/Manager/Dashboard/Dashboard";
import EmployeeDashboard from "./Components/Pages/Employee/Dashboard/Dashboard";
import ManagersList from "./Components/Pages/Admin/Managers/ManagersList";
import EmployeesList from "./Components/Pages/Admin/Employees/EmployeesList"
import AttendanceTable from "./Components/Pages/Employee/ViewAttendence/ViewAttendence";
import ManagerAttendenceTable from "./Components/Pages/Manager/ViewAttendence/AttendenceTable";
import MonthlyAttendence from "./Components/Pages/Admin/AdminAttendence/MonthlyAttendence";
import EmployeeLeaves from "./Components/Pages/Manager/EmployeeLeaves/EmployeeLeaves";
import AddEmployee from "./Components/Pages/Admin/EmployeeRegistration/AddEmployee";
import EmployeesLists from "./Components/Pages/Admin/EmployeeRegistration/EmployeeList";
import EmployeeAttendance from "./Components/Pages/Manager/EmployeeAttendance/EmployeeAttendance";
import Monthlyattendances from "./Components/Pages/Manager/MonthlyEmployeeAttendance/Monthlyattendance";
import AddEmployeeOnboarding from "./Components/Pages/Admin/Onboarding/AddEmployee"
import ViewOnboard from "./Components/Pages/Admin/Onboarding/ViewOnboard";
import AddHoliday from "./Components/Pages/Admin/Calendar/Calendar";
import ManagerCalendar from "./Components/Pages/Manager/Calendar/ManagerCalendar";
import EmployeeCalendar from "./Components/Pages/Employee/Calendar/EmployeeCalendar";
import EmployeeMonthlyAttendence from "./Components/Pages/Employee/Attendence/MonthlyAttendence";
import Payslip from "./Components/Pages/Manager/Payslips/AddPayslip";
import AdminPayslip from "./Components/Pages/Admin/Adminpayslip/AdminPayslip";
import ViewAllpayslips from "./Components/Pages/Admin/Adminpayslip/ViewAllpayslips";
import ViewPayslips from "./Components/Pages/Manager/Payslips/ViewPayslips";
import EViewPayslips from "./Components/Pages/Employee/Payslips/ViewPayslips";
// import PayslipDetails from "./Components/Pages/Manager/Payslips/PayslipDetails";
import Profile from "./Components/Pages/Employee/EmployeeProfile/Profile"
import ManagerProfile from './Components/Pages/Manager/ManagerProfile/ManagerProfile';
import ViewEmployees from './Components/Pages/Manager/Employee/ViewEmployees';
import EmpOnboarding from './Components/Pages/Manager/EmpOnboarding/EmpOnboarding';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
             
            <Route path="a-dashboard" element={<Dashboard />} />
            <Route path="m-dashboard" element={<ManagerDashboard />} />
            <Route path="e-dashboard" element={<EmployeeDashboard />} />
            <Route path="e-attendence" element={<Attendence />} />
            <Route path="e-calendar" element={<EmployeeCalendar />} />
            <Route path="viewattendence" element={<AttendanceTable />} />
            <Route path="e-monthlyattendence" element={<EmployeeMonthlyAttendence/>} />
            <Route path="AdminAttendence-daily" element={<AdminAttendence />} />
            <Route path="AdminAttendence-monthly" element={<MonthlyAttendence />} />
            <Route path="AdminAdd-holiday" element={<AddHoliday />} />
            <Route path="manager" element={<ManagersList />} />
            <Route path="employee" element={<EmployeesList />} />
            <Route path="a-leave" element={<AdminLeaveManagement />} />
            <Route path="AdminPayrollManagement" element={<AdminPayrollManagement />} />

            <Route path="m-Attendence" element={<ManagerAttendence />} />
            <Route path="ManagerLeaveManagement" element={<ManagerLeaveManagement />} />

            <Route path="ManagerAttendence" element={<ManagerAttendence />} />
            <Route path="m-viewattendence" element={<ManagerAttendenceTable />} />
            <Route path="m-leave" element={<ManagerLeaveManagement />} />
            <Route path="m-calendar" element={<ManagerCalendar />} />
            <Route path="ManagerPayrollManagement" element={<ManagerPayrollManagement />} />
            <Route path="Attendence" element={<Attendence />} />
            <Route path="e-leave" element={<LeaveManagement />} />
            <Route path="PayrollManagement" element={<PayrollManagement />} />
            {/* <Route path="m-leave" element={<PayrollManagement />} /> */}
            <Route path="m-employeeleave" element={<EmployeeLeaves />} />
            <Route path="a-addemployee" element={<AddEmployee />} />

            <Route path="a-employeelist" element={<EmployeesLists />} />
            <Route path="e-profile" element={<Profile />} />
            <Route path="m-profile" element={<ManagerProfile />} />
            <Route path="m-employeeattendance" element={<EmployeeAttendance />} />
            <Route path="m-monthlyattendance" element={<Monthlyattendances />} />
            <Route path="a-onboarding" element={<AddEmployeeOnboarding />} />
            <Route path="a-viewonboard" element={<ViewOnboard />} />
            <Route path="m-addpayslip" element={<Payslip />} />
            <Route path="a-addpayslip" element={<AdminPayslip />} />
            <Route path="a-allpayslips" element={<ViewAllpayslips />} />
            <Route path="m-viewpayslip" element={<ViewPayslips />} />
            <Route path="e-viewpayslip" element={<EViewPayslips />} />
            <Route path="m-viewemployees" element={<ViewEmployees />} />
            <Route path="m-emponboarding" element={<EmpOnboarding />} />
            </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
