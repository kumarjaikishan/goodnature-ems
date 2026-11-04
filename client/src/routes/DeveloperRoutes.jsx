import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoutes from '../utils/protectedRoute';

// 🔹 Lazy imports scoped exclusively to Developers
const DeveloperDashboard = lazy(() => import('../pages/developer/Dashboard'));
const Permission = lazy(() => import('../pages/developer/Permission'));
const ApiMonitor = lazy(() => import('../pages/developer/ApiMonitor'));
const ErrorLogs = lazy(() => import('../pages/developer/ErrorLogs'));
const ActivityLogs = lazy(() => import('../pages/admin/activityLogs/ActivityLogs'));
const Errorpage = lazy(() => import('../pages/error/Errorpage'));

const DeveloperRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoutes allowedRoles={['developer']} />}>
      <Route index element={<DeveloperDashboard />} />
      <Route path="permission" element={<Permission />} />
      <Route path="api-monitor" element={<ApiMonitor />} />
      <Route path="error-logs" element={<ErrorLogs />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  </Routes>
);

export default DeveloperRoutes;
