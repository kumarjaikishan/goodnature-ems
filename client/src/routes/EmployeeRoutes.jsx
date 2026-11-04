import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoutes from '../utils/protectedRoute';

// 🔹 Lazy imports scoped exclusively to Employees
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard'));
const EmpAttenPerformance = lazy(() => import('../pages/employee/attandencee/empAttandence'));
const EmployeeProfile = lazy(() => import('../pages/profile/profile'));
const EmpLeave = lazy(() => import('../pages/employee/leave/Leave'));
const MyLeaveLedger = lazy(() => import('../pages/employee/leave/MyLeaveLedger'));
const EmployeeFinancialLedger = lazy(() => import('../pages/employee/ledger/EmployeeFinancialLedger'));
const Setting = lazy(() => import('../pages/settingPage'));
const Errorpage = lazy(() => import('../pages/error/Errorpage'));

const EmployeeRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoutes allowedRoles={['employee']} />}>
      <Route index element={<EmployeeDashboard />} />
      <Route path="empattandence" element={<EmpAttenPerformance />} />
      <Route path="profile" element={<EmployeeProfile />} />
      <Route path="leave-request" element={<EmpLeave />} />
      <Route path="my-leave-ledger" element={<MyLeaveLedger />} />
      <Route path="my-ledger" element={<EmployeeFinancialLedger />} />
      <Route path="setting" element={<Setting />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  </Routes>
);

export default EmployeeRoutes;
