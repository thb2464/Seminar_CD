import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div data-testid="admin-loading" style={{ padding: 80, textAlign: 'center' }}>
        Loading admin panel…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div data-testid="admin-forbidden" style={{ padding: 80, textAlign: 'center' }}>
        <h2>403 — Admin only</h2>
        <p>This area requires an admin account.</p>
      </div>
    );
  }
  return children;
};

export default AdminRoute;
