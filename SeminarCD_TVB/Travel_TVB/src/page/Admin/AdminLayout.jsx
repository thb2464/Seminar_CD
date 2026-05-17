import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiMap, FiList, FiLogOut, FiHome } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-shell" data-testid="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Travel TVB Admin
          <small>Microservices Console</small>
        </div>
        <nav className="admin-nav" data-testid="admin-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FiBarChart2 className="admin-nav-icon" /> Dashboard
          </NavLink>
          <NavLink to="/admin/tours" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FiMap className="admin-nav-icon" /> Tours
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FiList className="admin-nav-icon" /> Bookings
          </NavLink>
          <NavLink to="/" end>
            <FiHome className="admin-nav-icon" /> Back to site
          </NavLink>
        </nav>
        <div className="admin-user-strip">
          <strong>{user?.username || 'admin'}</strong>
          {user?.email}
          <button
            onClick={handleLogout}
            className="admin-btn secondary"
            style={{ marginTop: 12, width: '100%', padding: '6px 10px' }}
            data-testid="admin-logout"
          >
            <FiLogOut style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
