import React, { createContext, useState, useEffect } from 'react';
import {
  authenticate,
  isTokenValid,
  registerUser,
} from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) {
      setUser({ token });
    } else if (token) {
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const token = await authenticate(email, password);
      localStorage.setItem('token', token);
      setUser({ token });
      return true;
    } catch (error) {
      console.error('Login error', error);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      await registerUser(name, email, password);
      return true;
    } catch (error) {
      console.error('Register error', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ authenticated: !!user, user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
