// src/hooks/useAuth.js
import { useContext } from 'react';
// Import the actual context from its new location
import { AuthContext } from '../context/AuthContext.jsx'; // Adjust path if your context file is elsewhere

// Define and export the custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    // This error means useAuth is being called outside of AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};