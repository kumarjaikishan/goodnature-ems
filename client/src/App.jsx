import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, Suspense, lazy } from 'react';
import { FirstFetch } from '../store/userSlice';
import { empFirstFetch } from '../store/employee';
import { setlogin } from '../store/authSlice';
import { connectSSE, closeSSE } from "./utils/sse";
import { notificationSound } from "./utils/sound";
import dayjs from 'dayjs';

import ScrollToTop from './components/ScrollToTop';
import { swal } from './utils/confirmDialog';
import { isTokenValid, clearAuthSession, getRoleFromToken } from './utils/auth';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/common/PageLoader';

// 🔹 Public Lazy Routes
const Login = lazy(() => import('./pages/Login'));
const Logout = lazy(() => import('./pages/logout'));
const Errorpage = lazy(() => import('./pages/error/Errorpage'));
const PasswordReset = lazy(() => import('./utils/PasswordReset'));

// 🚀 Role-Scoped Lazy Route Trees (True Code Splitting & Security Isolation)
const ManagementRoutes = lazy(() => import('./routes/ManagementRoutes'));
const SponsorRoutes = lazy(() => import('./routes/SponsorRoutes'));
const EmployeeRoutes = lazy(() => import('./routes/EmployeeRoutes'));
const DeveloperRoutes = lazy(() => import('./routes/DeveloperRoutes'));

const MANAGEMENT_ROLES = [
  'superadmin',
  'admin',
  'manager',
  'accountant',
  'cashier',
  'hr',
  'sales',
  'operator',
  'auditor',
  'staff',
  'other',
  'demo'
];

function App() {
  const dispatch = useDispatch();
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const primaryColor = useSelector((state) => state.user.primaryColor) || "#115e59";

  const effectiveRole = user?.profile?.role || getRoleFromToken();

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (token) {
      if (isTokenValid(token)) {
        if (!islogin) {
          dispatch(setlogin(true));
        }
      } else {
        // Token exists but is expired or invalid — purge immediately
        clearAuthSession(dispatch, false);
      }
    } else if (islogin) {
      // Redux thought we're logged in, but token is missing — purge immediately
      clearAuthSession(dispatch, false);
    }
  }, [islogin, dispatch]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (!islogin || !isTokenValid(token)) return;

    const role = effectiveRole;
    if (role === 'employee') {
      dispatch(empFirstFetch());
    } else if (role) {
      dispatch(FirstFetch());
    }
  }, [islogin, effectiveRole, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (islogin && isTokenValid(token)) {
      jwtcheck();
    }
  }, [islogin]);

  const tokenErrors = {
    "jwt expired": ['Session Expired', 'Your session has expired. Please log in again.'],
    "Invalid Token": ['Invalid Token', 'You need to log in again.']
  };

  const jwtcheck = async () => {
    try {
      const token = localStorage.getItem('emstoken');
      if (!token || !isTokenValid(token)) {
        clearAuthSession(dispatch, false);
        return;
      }
      const responsee = await fetch(`${import.meta.env.VITE_API_ADDRESS}jwtcheck`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (responsee.status === 401) {
        clearAuthSession(dispatch, false);
        navigate('/login', { replace: true });
        return;
      }

      const data = await responsee.json();

      if (tokenErrors[data.message]) {
        const title = tokenErrors[data.message][0];
        const text = tokenErrors[data.message][1];
        clearAuthSession(dispatch, false);
        swal({
          title, text, icon: 'warning',
          button: {
            text: 'OK',
          },
        }).then(() => {
          navigate('/login', { replace: true });
        });
      }
    } catch (error) {
      console.log("Token check:", error);
    }
  };

  const hasValidAuth = islogin && isTokenValid(typeof window !== 'undefined' ? localStorage.getItem('emstoken') : null);

  useEffect(() => {
    if (hasValidAuth && user?.liveAttandence && ["superadmin", "admin", "manager", "demo"].includes(user?.profile?.role)) {
      const es = connectSSE((data) => {
        if (data.type === 'attendance_update') {
          if (data.payload.type === 'punchIn') {
            if (user?.notificationSoundEnabled) {
              notificationSound();
            }
            toast.success(
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>
                  <span className="font-bold text-teal-800">
                    {data.payload.data.name}
                  </span>{" "}
                  has Punched In at{" "}
                  <span className="text-teal-700">
                    {dayjs(data.payload.data.punchIn).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { duration: 20000 }
            );
            window.dispatchEvent(new CustomEvent('attendance_updated', { detail: data.payload }));
          } else if (data.payload.type === 'punchOut') {
            if (user?.notificationSoundEnabled) {
              notificationSound();
            }
            toast.warning(
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>
                  <span className="font-bold text-amber-800">
                    {data.payload.data.name}
                  </span>{" "}
                  has Punched Out at{" "}
                  <span className="text-amber-700">
                    {dayjs(data.payload.data.punchOut).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { duration: 20000 }
            );
            window.dispatchEvent(new CustomEvent('attendance_updated', { detail: data.payload }));
          }
        }
      });

      return () => {
        closeSSE();
      };
    }
  }, [user?.liveAttandence, user?.notificationSoundEnabled]);

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={true}
        visibleToasts={6}
        gap={10}
        duration={5000}
        toastOptions={{
          style: {
            fontSize: '13px',
            padding: '12px 16px',
            borderRadius: '12px',
          },
        }}
      />
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader fullScreen={true} />}>
          {hasValidAuth && !effectiveRole ? (
            <PageLoader fullScreen={true} />
          ) : (
            <Routes>
              {/* Public routes */}
              <Route path="/resetpassword/:token" element={<PasswordReset />} />

              <Route
                path="/login"
                element={hasValidAuth ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route
                path="/"
                element={!hasValidAuth ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="/logout" element={<Logout />} />

              {/* Scoped Dashboard Sub-Router (Only downloads the chunk for the logged in role) */}
              <Route
                path="/dashboard/*"
                element={
                  !hasValidAuth ? (
                    <Navigate to="/login" replace />
                  ) : effectiveRole === 'sponsor' ? (
                    <SponsorRoutes />
                  ) : effectiveRole === 'employee' ? (
                    <EmployeeRoutes />
                  ) : effectiveRole === 'developer' ? (
                    <DeveloperRoutes />
                  ) : MANAGEMENT_ROLES.includes(effectiveRole) ? (
                    <ManagementRoutes />
                  ) : (
                    <Errorpage />
                  )
                }
              />

              {/* Fallback */}
              <Route
                path="*"
                element={!hasValidAuth ? <Navigate to="/login" replace /> : <Errorpage />}
              />
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
