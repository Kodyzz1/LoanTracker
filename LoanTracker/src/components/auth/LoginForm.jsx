import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth'; // Correct path from src/components/Auth/
// import './LoginForm.css'; // Assuming CSS exists at src/components/Auth/LoginForm.css

const API_URL = 'http://localhost:3001/api';

// Ensure prop is destructured here
function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(null); setIsLoading(true);
    if (!username || !password) { setError('Please enter both username and password.'); setIsLoading(false); return; }
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
      login(data.token, { username: data.username });
    } catch (err) { console.error("Login failed:", err); setError(err.message || 'Login failed. Please try again.'); setIsLoading(false); }
    // No finally here as component unmounts on successful login via context state change
  };

  return (
    <div className="login-form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="username">Username</label>
          <input
            type="text" id="username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading} required
          />
        </div>
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input
            type="password" id="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading} required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {/* --- Ensure this button exists and uses the prop --- */}
          <button
             type="button"
             onClick={onSwitchToRegister} // Calls the function passed from App
             style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }} // Basic link-like style
            >
            Don't have an account? Register
          </button>
          {/* --- End Switch Button --- */}
        </div>
      </form>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToRegister: PropTypes.func.isRequired // Prop validation
};

export default LoginForm;