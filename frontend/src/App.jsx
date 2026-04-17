import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, Suspense, lazy } from 'react';
import { FirstFetch } from '../store/userSlice';
import { empFirstFetch } from '../store/employee';
import ProtectedRoutes from './utils/protectedRoute';
import { GoGear } from 'react-icons/go';
import { connectSSE, closeSSE } from "./utils/sse";
import { Avatar } from '@mui/material';
import dayjs from 'dayjs';
import { FaRegUser } from 'react-icons/fa';

import ScrollToTop from './components/ScrollToTop';
import Transactions from './pages/developer/Membership';
// import  Errorpage  from './pages/error/Errorpage';


// ✅ Lazy imports
const Login = lazy(() => import('./pages/Login'));
const Logout = lazy(() => import('./pages/logout'));
const Errorpage = lazy(() => import('./pages/error/Errorpage'));

const Membership = lazy(() => import('./pages/membership/membership'));
const LeaveBalancePage = lazy(() => import('./pages/leaveledger/leaveledger'));

// Admin/Manager
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Employe = lazy(() => import('./pages/admin/employee/Employe'));
const OrganizationSettings = lazy(() => import('./pages/admin/organization/organization'));
const CompanyInfoPage = lazy(() => import('./pages/admin/organization/pages/CompanyInfoPage'));
const BranchManagerPage = lazy(() => import('./pages/admin/organization/pages/BranchManagerPage'));
const DepartmentPage = lazy(() => import('./pages/admin/organization/pages/DepartmentPage'));
const DeviceManagementPage = lazy(() => import('./pages/admin/organization/pages/DeviceManagementPage'));
const TelegramIntegrationPage = lazy(() => import('./pages/admin/organization/pages/TelegramIntegrationPage'));
const AdminManagerPage = lazy(() => import('./pages/admin/organization/pages/AdminManagerPage'));
const AttendanceRulesPage = lazy(() => import('./pages/admin/organization/pages/AttendanceRulesPage'));
const PayrollPoliciesPage = lazy(() => import('./pages/admin/organization/pages/PayrollPoliciesPage'));
const LeavePoliciesPage = lazy(() => import('./pages/admin/organization/pages/LeavePoliciesPage'));
const Attandence = lazy(() => import('./pages/admin/attandence/Attandence'));
const AttenPerformance = lazy(() => import('./pages/admin/attandence/AttenPerformance'));
const Adminleave = lazy(() => import('./pages/admin/leave/Adminleave'));
const HolidayForm = lazy(() => import('./pages/holidays/Holiday'));
const Setting = lazy(() => import('./pages/settingPage'));
const AttendanceReport = lazy(() => import('./pages/report/attandenceReport'));
const PayrollPage = lazy(() => import('./pages/common/payroll/payroll'));
const PayrollCreatePage = lazy(() => import('./pages/common/payroll/payrollCreating'));
const PayrollEdit = lazy(() => import('./pages/common/payroll/payrollEdit'));
const PayslipPrintPage = lazy(() => import('./pages/common/payroll/payrollprint'));
const EmployeeAdvancePage = lazy(() => import('./pages/advance/advance'));
const LedgerListPage = lazy(() => import('./pages/admin/ledger/ledgerpagelist'));
const LedgerDetailPage = lazy(() => import('./pages/admin/ledger/ledgerdetailpage'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const VoucherList = lazy(() => import('./pages/vouchers/VoucherList'));
const VoucherDetails = lazy(() => import('./pages/vouchers/VoucherDetails'));
const LeavePolicyManager = lazy(() => import('./pages/admin/leave/LeavePolicyManager'));
const AttendanceExcelImport = lazy(() => import('./pages/admin/attandence/AttendanceExcelImport'));
const PasswordReset = lazy(() => import('./utils/PasswordReset'));

// Employee
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmpAttenPerformance = lazy(() => import('./pages/employee/attandencee/empAttandence'));
const EmpLeave = lazy(() => import('./pages/employee/leave/Leave'));
const MyLeaveLedger = lazy(() => import('./pages/employee/leave/MyLeaveLedger'));
const EmployeeFinancialLedger = lazy(() => import('./pages/employee/ledger/EmployeeFinancialLedger'));

// Developer
const DeveloperDashboard = lazy(() => import('./pages/developer/Dashboard'));
const Permission = lazy(() => import('./pages/developer/Permission'));

// Profile
const EmployeeProfile = lazy(() => import('./pages/profile/profile'));
const AdminManagerProfile = lazy(() => import('./pages/profile/adminManagerProfile'));

// 🔹 Role-based route definitions
const routesByRole = {
  admin: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['admin']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  demo: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['demo']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),

  superadmin: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['superadmin']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  manager: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['manager']} />}>
      <Route index element={<ManagerDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="setting" element={<Setting />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  employee: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['employee']} />}>
      <Route index element={<EmployeeDashboard />} />
      <Route path="empattandence" element={<EmpAttenPerformance />} />
      <Route path="profile" element={<EmployeeProfile />} />
      <Route path="leave-request" element={<EmpLeave />} />
      <Route path="my-leave-ledger" element={<MyLeaveLedger />} />
      <Route path="my-ledger" element={<EmployeeFinancialLedger />} />
      <Route path="setting" element={<Setting />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  developer: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['developer']} />}>
      <Route index element={<DeveloperDashboard />} />
      <Route path="membership" element={<Transactions />} />
      <Route path="permission" element={<Permission />} />
    </Route>
  ),
};

function App() {
  const dispatch = useDispatch();
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const primaryColor = useSelector((state) => state.user.primaryColor) || "#115e59";

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", primaryColor);
  }, [primaryColor]);

  useEffect(() => {

    const role = user?.profile?.role;

    if (['superadmin', 'admin', 'manager', 'demo'].includes(role)) {
      dispatch(FirstFetch());
    } else if (role === 'employee') {
      dispatch(empFirstFetch());
    }
  }, [islogin, user?.profile?.role, dispatch]);

  useEffect(() => {
    islogin && jwtcheck();
    console.log("islogin", islogin)
  }, [islogin]);

  const tokenErrors = {
    "jwt expired": ['Session Expired', 'Your session has expired. Please log in again.'],
    "Invalid Token": ['Invalid Token', 'You need to log in again.']
  }

  const jwtcheck = async () => {
    try {
      const token = localStorage.getItem('emstoken');
      const responsee = await fetch(`${import.meta.env.VITE_API_ADDRESS}jwtcheck`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(responsee)
      const data = await responsee.json();
      console.log("jwt check", data);

      if (tokenErrors[data.message]) {
        const title = tokenErrors[data.message][0];
        const text = tokenErrors[data.message][1];
        swal({
          title, text, icon: 'warning',
          button: {
            text: 'OK',
          },
        }).then(() => {
          return navigate('/logout');
        });
      }
    } catch (error) {
      console.log("Token check:", error);
    }
  }

  const roleRoute = islogin ? routesByRole[user?.profile?.role] || [] : [];

  useEffect(() => {
    if (islogin && user?.liveAttandence && ["superadmin", "admin", "manager", "demo"].includes(user?.profile?.role)) {
      const es = connectSSE((data) => {
        // console.log("sse se event ayaa")
        if (data.type === "attendance_update") {
          const emp = data.payload.data.employeeId;

          if (data.payload.action === "checkin") {
            toast.info(
              <div className="flex items-center gap-2 pr-1">
                <Avatar src={emp.profileimage} alt={emp.employeename}>
                  {!emp.profileimage && <FaRegUser />}
                </Avatar>
                <span className="text-[14px] ">
                  <span className="text-green-700 capitalize font-semibold">
                    {emp.userid.name}
                  </span>{" "}
                  has Punched In at{" "}
                  <span className="text-green-700">
                    {dayjs(data.payload.data.punchIn).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { autoClose: 20000 }
            );
            dispatch(FirstFetch());
          }

          if (data.payload.action === "checkOut") {
            toast.info(
              <div className="flex items-center gap-2 pr-1">
                <Avatar src={emp.profileimage} alt={emp.employeename}>
                  {!emp.profileimage && <FaRegUser />}
                </Avatar>
                <span className="text-[14px] ">
                  <span className="text-amber-700 capitalize font-semibold">
                    {emp.userid.name}
                  </span>{" "}
                  has Punched Out at{" "}
                  <span className="text-amber-700">
                    {dayjs(data.payload.data.punchOut).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { autoClose: 20000 }
            );
            dispatch(FirstFetch());
          }
        }
      });

      return () => {
        closeSSE();
      };
    }
  }, [user?.liveAttandence]);

  return (
    <>
      <ToastContainer closeOnClick />
      <ScrollToTop />
      <Suspense
        fallback={<div className="flex items-center justify-center h-screen w-screen bg-white">
          <div className="relative">
            <GoGear
              className="animate-spin"
              style={{ animationDuration: "2.5s" }}
              size={60}
              color="teal"
            />
            <GoGear
              className="absolute -bottom-4 left-0 animate-spin"
              style={{ animationDuration: "3s" }}
              size={25}
              color="teal"
            />
          </div>
        </div>}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/resetpassword/:token" element={<PasswordReset />} />


          <Route
            path="/login"
            element={islogin ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/dashboard"
            element={!islogin && <Navigate to="/login" replace />}
          />
          <Route
            path="/"
            element={!islogin ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/logout" element={<Logout />} />

          {/* Role based routes */}
          {roleRoute}

          {/* Fallback */}
          <Route path="*" element={<Errorpage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
