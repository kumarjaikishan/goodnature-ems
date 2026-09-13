import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import { useState, Suspense, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import ContentLoader from '../components/ContentLoader';

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);

  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem('emstoken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch {
      return null;
    }
  };

  const tokenRole = getRoleFromToken();
  const role = user?.profile?.role || user?.role || tokenRole;
  const tokenExists = Boolean(localStorage.getItem('emstoken'));
  const isAuthenticated = islogin || tokenExists;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ❌ Not logged in → go to login
  if (!isAuthenticated) {
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

  // ❌ Logged in but not in allowed roles → go to login (clears loop)
  const isAuthorized = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
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