import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingPage from "../pages/pages/loading";
import { useAuthContext } from "../context/AuthContext";

/**
 * Route guard for admin / staff-only pages.
 *
 * Mobile / WebView improvement:
 * When an unauthenticated user tries to access a protected route, we encode
 * the current path + query string as a `returnTo` parameter on the sign-in
 * URL. After a successful login, `sign-in.tsx` reads that param and sends
 * the user back to exactly where they were trying to go — instead of always
 * landing on the home page.
 */
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    // Encode the full current path + search so the sign-in page can redirect
    // back after a successful login.
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate to={`/authentication/sign-in?returnTo=${returnTo}`} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
