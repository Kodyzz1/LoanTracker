import { createContext, useState, useEffect, useMemo, useCallback } from 'react'; // No useContext needed here anymore
import PropTypes from 'prop-types';

// 1. Create and Export the Context itself
export const AuthContext = createContext(null);

// 2. Define and Export the Provider Component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to check localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('loanTrackerToken');
    const storedUser = localStorage.getItem('loanTrackerUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser({ username: storedUser });
      // NOTE: Add token verification against backend here for production apps
    }
    setIsInitialized(true); // Mark initialization complete
  }, []); // Runs only once on mount

  // Memoized login function
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('loanTrackerToken', newToken);
    localStorage.setItem('loanTrackerUser', userData.username);
    setToken(newToken);
    setUser(userData);
    console.log('AuthContext: Logged in', userData.username);
  }, []); // Empty dependency array

  // Memoized logout function
  const logout = useCallback(() => {
    localStorage.removeItem('loanTrackerToken');
    localStorage.removeItem('loanTrackerUser');
    setToken(null);
    setUser(null);
    console.log('AuthContext: Logged out');
  }, []); // Empty dependency array

  // Memoize the context value object passed to consumers
  const value = useMemo(() => ({
    token,
    user,
    isLoggedIn: !!token,
    isInitialized,
    login,
    logout
  }), [token, user, isInitialized, login, logout]);

  // Render the provider, conditionally rendering children after initialization
  return (
    <AuthContext.Provider value={value}>
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
};

// 3. Define PropTypes for the Provider component
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// NOTE: The useAuth hook is NOT defined or exported from this file anymore.
// It lives in src/hooks/useAuth.js