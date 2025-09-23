import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode
import Register from './components/Register';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Permissions from './components/Permissions';
import ChangePassword from './components/ChangePassword';
import Home from './components/Home';
import ProjectsHome from './components/ProjectsHome'; // New import
import ProjectView from './components/ProjectView'; // New import
import PastProposals from './components/PastProposals';
import FileStorer from './components/FileStorer';
import AIReviewerTool from './components/AIReviewerTool';
import ComplianceChecker from './components/ComplianceChecker';
import GrantCalendar from './components/GrantCalendar';
import merge1 from './merge1.png';
import './App.css';
import './DarkMode.css';

// Placeholder components for now
const Settings = () => <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Settings Page</h2>;

function MainAppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // State to store user info
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const onLoginSuccess = (token) => {
    setIsAuthenticated(true);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded); // Set user info from decoded token
      } catch (error) {
        console.error("Failed to decode token in onLoginSuccess:", error);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(true);
          setUser(decoded); // Set user info from decoded token
        }
      } catch (error) {
        console.error("Failed to decode token in useEffect:", error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
  if (isAuthenticated && !loading) {
    // Only navigate if current path is "/"
    if (window.location.pathname === '/') {
      navigate('/projects');
    }
  }
}, [isAuthenticated, loading, navigate]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null); // Clear user info on logout
    navigate('/login'); // Redirect to login after logout
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading application...</p>;
  }

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header className="App-header">
        <img src={merge1} className="App-logo" alt="logo" />
        <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'absolute', left: '20px', top: '20px', padding: '10px 20px' }}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        {isAuthenticated && (
          <div style={{ position: 'absolute', right: '20px', top: '20px', textAlign: 'right' }}>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
            {user && (
              <div style={{ marginTop: '10px', color: '#3e51b6', fontSize: '0.9em' }}>
                <p style={{ margin: '0', fontSize: '0.45em', fontWeight: 'bold' }}>User: {user.user.username}</p>
                <p style={{ margin: '0', fontSize: '0.45em', fontWeight: 'bold' }}>Company: {user.user.companyName}</p>
              </div>
            )}
          </div>
        )}
      </header>

      {isAuthenticated ? (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}> {/* Adjust height based on header height */}
          <nav style={{ width: '200px', background: '#7fab61', padding: '20px 0', borderRight: '1px solid #ddd', textAlign: 'left' }}>
            <ul style={{ listStyle: 'none', padding: '0 20px' }}>
              <li style={{ marginBottom: '20px' }}><Link to="/projects" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Projects</Link></li>
              <li style={{ marginBottom: '20px' }}><span style={{ color: '#fffcf0', fontWeight: 'bold', cursor: 'default' }}>Tools</span>
                <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px' }}>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/past-proposals" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Past Proposals</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/file-storer" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>File Storer</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/ai-reviewer" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>AI Reviewer Tool</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/compliance-checker" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Compliance Checker</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/grant-calendar" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Grant Calendar</Link></li>
                </ul>
              </li>
              <li style={{ marginTop: 'auto', marginBottom: '10px' }}><span style={{ color: '#debf84', fontWeight: 'bold', cursor: 'default' }}>Settings</span>
                <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px'}}>
                  <li style={{ marginBottom: '10px' }}><Link to="/admin" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Admin Dashboard</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/admin/permissions" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Permissions</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/change-password" style={{ textDecoration: 'none', color: '#fffcf0', fontWeight: 'bold' }}>Change Password</Link></li>
                </ul>
              </li>
            </ul>
          </nav>
          <main style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            <Routes>
              <Route path="/projects" element={<ProjectsHome />} />
              <Route path="/projects/:id/view" element={<ProjectView />} />
              <Route path="/tools/past-proposals" element={<PastProposals />} />
              <Route path="/tools/file-storer" element={<FileStorer />} />
              <Route path="/tools/ai-reviewer" element={<AIReviewerTool />} />
              <Route path="/tools/compliance-checker" element={<ComplianceChecker />} />
              <Route path="/tools/grant-calendar" element={<GrantCalendar />} />
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
          <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
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
