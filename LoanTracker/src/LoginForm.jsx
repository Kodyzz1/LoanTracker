import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth'; // Import the useAuth hook

// Optional: Create LoginForm.css for styling
// import './LoginForm.css';

const API_URL = 'http://localhost:3001/api'; // Backend API URL

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Get the login function from our context

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true); // Set loading state

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json(); // Attempt to parse JSON regardless of status

      if (!response.ok) {
        // Use message from server response if available, otherwise generic error
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // --- Login Successful ---
      // Call the login function from AuthContext with token and user data
      login(data.token, { username: data.username });
      // No need to setLoading(false) here, as the component will likely unmount/re-render

    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false); // Set loading false only on error
    }
  };

  return (
    <div className="login-form-container"> {/* Add a container class */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-control"> {/* Simple form control styling class */}
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>} {/* Display errors */}
        <div className="form-actions"> {/* Simple actions styling class */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {/* TODO: Add link/button to switch to Registration form later */}
        </div>
      </form>
    </div>
  );
}

export default LoginForm;