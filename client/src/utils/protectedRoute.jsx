import { Outlet, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import { useState, Suspense, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import ContentLoader from '../components/ContentLoader';
import { isTokenValid, getRoleFromToken, clearAuthSession } from './auth';

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const dispatch = useDispatch();
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);

  const token = typeof window !== 'undefined' ? localStorage.getItem('emstoken') : null;
  const tokenValid = isTokenValid(token);
  const tokenRole = getRoleFromToken(token);
  const role = user?.profile?.role || user?.role || tokenRole;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ❌ If token is missing, expired, or invalid → purge everything immediately and send to login
  if (!token || !tokenValid) {
    if (islogin || token) {
      clearAuthSession(dispatch, false);
    }
    return <Navigate to="/login" replace />;
  }

  // ⏳ Logged in but role is still resolving
  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <ContentLoader />
      </div>
    );
  }

  // ❌ Logged in but not in allowed roles → show access denied instead of endless /login bounce
  const isAuthorized = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center select-none">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-rose-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Your account ({role}) is not authorized to access this module.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.replace('/login')}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Back to Login
            </button>
            <button
              type="button"
              onClick={() => {
                clearAuthSession(dispatch, true);
              }}
              className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold hover:bg-teal-900 transition cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar logic
  const sidebarOpen = Boolean(user?.sidebar);
  const extended = Boolean(user?.extendedonMobile);

  const sidebarWidth = isMobile
    ? sidebarOpen
      ? extended ? 'w-[180px]' : "w-[60px]"
      : "w-0"
    : sidebarOpen
      ? "w-[220px]"
      : "w-[70px]";

  // ✅ Allowed
  return (
    <div className="h-screen w-full flex bg-slate-100 print:h-auto print:bg-white print:block">
      <div className={`${sidebarWidth} no-print bg-white shadow-xl transition-all duration-300 overflow-hidden`}>
        <Sidebar />
      </div>

      <div className="flex-1 min-w-0 bg-gray-100 overflow-auto overflow-x-hidden print:overflow-visible print:h-auto print:bg-white print:p-0">
        <Navbar />
        <div className="p-1 md:p-2 print:p-0">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoutes;