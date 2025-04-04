import React, { useState } from 'react';
import './RegisterForm.css';
import PropTypes from 'prop-types';

// Define API URL (can be moved to a central config later)
const API_URL = 'http://localhost:3001/api';

// We'll add a prop later to allow switching back to the login view
// function RegisterForm({ onSwitchToLogin }) {
function RegisterForm({ onSwitchToLogin }) {
  // State for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for feedback
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous feedback
    setSuccessMessage(null);
    setIsLoading(true);

    // --- Frontend Validation ---
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    // This check is also done on the backend, but good for immediate user feedback
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      // Call the backend registration endpoint
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // Send username and plain password
      });

      const data = await response.json(); // Always try to parse response body

      if (!response.ok) {
        // Use message from server response (like "Username already taken")
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // --- Registration Successful ---
      setSuccessMessage(data.message || 'Registration successful! You can now try logging in.');
      // Clear the form on success
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
      // Maybe automatically switch to login after a short delay?

    } catch (err) {
      console.error("Registration failed:", err);
      // Display the error message (from server or generic fetch error)
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false); // Ensure loading indicator stops
    }
  };

  return (
    // Add a container class for potential specific styling
    <div className="register-form-container">
      <h2>Register New Account</h2>
      <form onSubmit={handleSubmit}>
        {/* Username Input */}
        <div className="form-control"> {/* Use generic class for styling */}
          <label htmlFor="reg-username">Username</label>
          <input
            type="text" id="reg-username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading} required
          />
        </div>
        {/* Password Input */}
        <div className="form-control">
          <label htmlFor="reg-password">Password (min 6 chars)</label>
          <input
            type="password" id="reg-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading} required
          />
        </div>
        {/* Confirm Password Input */}
        <div className="form-control">
          <label htmlFor="reg-confirmPassword">Confirm Password</label>
          <input
            type="password" id="reg-confirmPassword" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading} required
          />
        </div>

        {/* Display Error or Success Messages */}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message" style={{color: 'lightgreen', textAlign:'center', marginBottom:'1rem'}}>{successMessage}</p>} {/* Basic success style */}

        {/* Form Actions */}
        <div className="form-actions"> {/* Use generic class for styling */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          {/* We'll add a button/link here later to switch back to login view */}
          {/* <button type="button" onClick={onSwitchToLogin}>Have an account? Login</button> */}
        </div>
      </form>
    </div>
  );
}
RegisterForm.propTypes = {
    onSwitchToLogin: PropTypes.func.isRequired
};

export default RegisterForm;