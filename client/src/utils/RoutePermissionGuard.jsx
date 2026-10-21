import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { hasPermission } from './CheckPermission';
import ContentLoader from '../components/ContentLoader';

/**
 * RoutePermissionGuard
 * Ensures a route can ONLY be rendered if the logged-in user possesses
 * the required permission action (1: Read, 2: Create, 3: Update, 4: Delete)
 * on the specified resource.
 *
 * Superadmin, developer, and grant roles always pass.
 * If permission is missing, renders a security banner ("Access Restricted")
 * or redirects cleanly.
 */
export default function RoutePermissionGuard({
  resource,
  action = 1,
  children,
  fallback = null,
}) {
  const user = useSelector((state) => state.user);
  const location = useLocation();

  const profile = user?.profile;
  const role = profile?.role || user?.role;

  // If user profile is still loading, show content loader
  if (!role) {
    return (
      <div className="min-h-[300px] w-full flex items-center justify-center">
        <ContentLoader />
      </div>
    );
  }

  // Superadmin / Developer / Grant bypass
  if (['superadmin', 'developer', 'grant'].includes(role)) {
    return children;
  }

  // Check specific resource permission (supports string or array of alternate resources)
  const allowed = resource
    ? (Array.isArray(resource)
        ? resource.some((r) => hasPermission(profile, r, action))
        : hasPermission(profile, resource, action))
    : true;

  if (!allowed) {
    if (fallback) return fallback;

    return (
      <div className="w-full max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-black border border-rose-100">
          !
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your account ({profile?.name || role}) does not have permission to view or manage this module.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}
