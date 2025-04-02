import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// Make sure AuthContext itself is exported
export const AuthContext = createContext(null);

// AuthProvider component remains the same...
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('loanTrackerToken');
    const storedUser = localStorage.getItem('loanTrackerUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser({ username: storedUser });
    }
    setIsInitialized(true);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('loanTrackerToken', newToken);
    localStorage.setItem('loanTrackerUser', userData.username);
    setToken(newToken);
    setUser(userData);
    console.log('AuthContext: Logged in', userData.username);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('loanTrackerToken');
    localStorage.removeItem('loanTrackerUser');
    setToken(null);
    setUser(null);
    console.log('AuthContext: Logged out');
  }, []);

  const value = useMemo(() => ({
    token, user, isLoggedIn: !!token, isInitialized, login, logout
  }), [token, user, isInitialized, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};