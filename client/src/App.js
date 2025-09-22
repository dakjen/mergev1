import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Permissions from './components/Permissions';
import ChangePassword from './components/ChangePassword';
import Home from './components/Home';
import ProjectsHome from './components/ProjectsHome'; // New import
import merge1 from './merge1.png';
import './App.css';

// Placeholder components for now
const Tools = () => <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Tools Page</h2>;
const Settings = () => <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Settings Page</h2>;

function MainAppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd validate the token with the backend
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login after logout
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading application...</p>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={merge1} className="App-logo" alt="logo" />
        {isAuthenticated && (
          <button onClick={handleLogout} style={{ position: 'absolute', right: '20px', top: '20px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
        )}
      </header>

      {isAuthenticated ? (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}> {/* Adjust height based on header height */}
          <nav style={{ width: '200px', background: '#7fab61', padding: '20px 0', borderRight: '1px solid #ddd', textAlign: 'left' }}>
            <ul style={{ listStyle: 'none', padding: '0 20px' }}>
              <li style={{ marginBottom: '10px' }}><Link to="/projects" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Projects</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/tools" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Tools</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/settings" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Settings</Link></li>
              {/* Admin links, potentially conditional based on user role */}
              <li style={{ marginBottom: '10px' }}><Link to="/admin" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Admin Dashboard</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/admin/permissions" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Permissions</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/change-password" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Change Password</Link></li>
            </ul>
          </nav>
          <main style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            <Routes>
              <Route path="/projects" element={<ProjectsHome />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/permissions" element={<Permissions />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<ProjectsHome />} /> {/* Default authenticated route */}
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Home />} /> {/* Default unauthenticated route */}
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainAppContent />
    </Router>
  );
}

export default App;
