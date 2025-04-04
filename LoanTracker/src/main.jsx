// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // <<< Use the default import 'ReactDOM'
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx'; // Ensure correct path

// Use the imported ReactDOM object here
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)