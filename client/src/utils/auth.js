import { setlogin } from '../../store/authSlice';
import { userlogout } from '../../store/userSlice';
import { emplogout } from '../../store/employee';

/**
 * Validates whether a JWT token string exists, is well-formed, and not expired.
 * @param {string|null} token
 * @returns {boolean}
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return false;

    // Decode base64 payload safely
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // If exp exists, check if token has expired (with a 5 second grace buffer)
    if (payload?.exp && typeof payload.exp === 'number') {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp <= nowInSeconds + 5) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Extracts payload safely from JWT token.
 * @param {string|null} token
 * @returns {object|null}
 */
export const getJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Extracts role from token payload.
 * @param {string|null} token
 * @returns {string|null}
 */
export const getRoleFromToken = (token) => {
  const payload = getJwtPayload(token || (typeof window !== 'undefined' ? localStorage.getItem('emstoken') : null));
  return payload?.role || null;
};

// Guard flag to prevent duplicate redirect cascades
let isRedirectingToLogin = false;

export const resetRedirectFlag = () => {
  isRedirectingToLogin = false;
};

/**
 * Completely purges all auth tokens, redux-persist storage, and triggers clean redirect to /login.
 * @param {function} [dispatch] optional redux dispatch
 * @param {boolean} [redirect=true]
 */
export const clearAuthSession = (dispatch, redirect = true) => {
  try {
    localStorage.removeItem('emstoken');
    localStorage.removeItem('persist:EMS');
    sessionStorage.clear();
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }

  if (dispatch) {
    try {
      dispatch(setlogin(false));
      dispatch(userlogout());
      dispatch(emplogout());
    } catch (e) {
      console.error('Failed to dispatch logout:', e);
    }
  }

  if (redirect && typeof window !== 'undefined') {
    if (window.location.pathname !== '/login' && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      window.location.replace('/login');
    }
  }
};
