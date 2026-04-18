import React, { createContext, useState, useContext, useEffect } from 'react';
import config from '../config/strapi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.USERS_ME}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('jwt_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        localStorage.removeItem('jwt_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = async (identifier, password) => {
    const response = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.AUTH_LOCAL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }
    localStorage.setItem('jwt_token', data.jwt);
    setToken(data.jwt);
    setUser(data.user);
    return data;
  };

  const register = async ({ username, email, password, full_name, phone }) => {
    const response = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.AUTH_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name, phone }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed');
    }
    localStorage.setItem('jwt_token', data.jwt);
    setToken(data.jwt);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
