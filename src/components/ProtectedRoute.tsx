import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingPage from '../pages/pages/loading';
import { useAuthContext } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuthContext();
  
  if (loading) {
    return (
      <LoadingPage />
    )
  }

  return user ? <Outlet /> : <Navigate to="/authentication/sign-in" replace />;
};

export default ProtectedRoute;
