import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// Optional: set API base URL for production deployments
// If REACT_APP_API_BASE_URL is defined, axios will use it; otherwise CRA proxy handles /api in dev
const apiBase = process.env.REACT_APP_API_BASE_URL;
if (apiBase) {
  axios.defaults.baseURL = apiBase;
  axios.defaults.withCredentials = true;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
