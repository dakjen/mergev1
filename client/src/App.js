import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode
import Register from './components/Register';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CompanyManagement from './components/CompanyManagement'; // Updated import
import UserManagement from './components/UserManagement'; // New import
import ChangePassword from './components/ChangePassword';
import Home from './components/Home';
import ProjectsHome from './components/ProjectsHome'; // New import
import ProjectView from './components/ProjectView'; // New import
import PastProposals from './components/PastProposals';
import FileStorer from './components/FileStorer';
import AIReviewerTool from './components/AIReviewerTool';
import ComplianceChecker from './components/ComplianceChecker';
import GrantCalendar from './components/GrantCalendar';
import ApprovalHistory from './components/ApprovalHistory'; // New import for ApprovalHistory
import PastAIReviews from './components/PastAIReviews'; // New import for PastAIReviews
import ToBeApproved from './components/ToBeApproved'; // New import for ToBeApproved
import PendingCorrection from './components/PendingCorrection'; // New import for PendingCorrection
import ArchivedProjects from './components/ArchivedProjects';

import Merge from './components/Merge';
import AIReviewDetail from './components/AIReviewDetail';
import ArchivedAIReviews from './components/ArchivedAIReviews';
import merge1 from './merge1.png';
import './App.css';
import './DarkMode.css';



function MainAppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // State to store user info
  const [darkMode, setDarkMode] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // State for all users
  const [companies, setCompanies] = useState([]); // State for companies
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0); // New state for pending approval count
  const [dataLoading, setDataLoading] = useState(false); // Loading state for data fetching
  const [dataError, setDataError] = useState(null); // Error state for data fetching
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDataError('No token found. Please log in.');
        setDataLoading(false);
        return;
      }
      const config = {
        headers: {
          'x-auth-token': token
        },
        withCredentials: true
      };

      if (user && user.user.role === 'admin') {
        const allUsersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`, config);
        setAllUsers(allUsersRes.data.map(u => ({ ...u, selectedRole: u.role, selectedCompanyId: u.company?.id || '' })));
      }

      const companiesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies`, config);
      setCompanies(companiesRes.data);

      if (user && user.user.role === 'approver') {
        const pendingCountRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/pending-approval-count`, config);
        console.log("Pending approval count response:", pendingCountRes.data);
        setPendingApprovalCount(pendingCountRes.data.count);
      }
      setDataLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setDataError(err.response ? err.response.data.msg : 'Failed to fetch data.');
      setDataLoading(false);
    }
  }, [user]);

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
    console.log('useEffect called');
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
    setLoading(false);
  }, [isAuthenticated]); // Re-run when isAuthenticated changes

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null); // Clear user info on logout
    navigate('/login'); // Redirect to login after logout
  };

  if (loading || dataLoading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading application...</p>;
  }

  if (dataError) {
    return <p style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error: {dataError}</p>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={merge1} className="App-logo" alt="logo" />
        {isAuthenticated && (
          <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'absolute', left: '20px', top: '20px', padding: '10px 20px' }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
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
              <li style={{ marginBottom: '20px' }}><Link to="/merge" className="sidebar-link">Merge</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/api/projects" className="sidebar-link">Projects</Link>
                {user && user.user.role === 'approver' && ( // Only show to approvers
                  <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px' }}>
                    <li style={{ marginBottom: '10px' }}><Link to="/projects/to-be-approved" className="sidebar-link">
                      To Be Approved {pendingApprovalCount > 0 && <span className="notification-bubble">{pendingApprovalCount}</span>}
                    </Link></li>
                  </ul>
                )}
                {/* New sub-category for Pending Correction */}
                <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px' }}>
                  <li style={{ marginBottom: '10px' }}><Link to="/projects/pending-correction" className="sidebar-link">Pending Correction</Link></li>

                </ul>
              </li>
              <li style={{ marginBottom: '20px' }}><span style={{ color: '#3e51b5', fontWeight: 'bold', cursor: 'default' }}>Tools</span>
                <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px' }}>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/past-proposals" className="sidebar-link">Past Proposals</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/file-storer" className="sidebar-link">File Cabinet</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/ai-reviewer" className="sidebar-link">AI Reviewer Tool</Link>
                    <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px' }}>
                      <li style={{ marginBottom: '10px' }}><Link to="/tools/ai-reviewer/past-reviews" className="sidebar-link">Past Reviews</Link></li>
                    </ul>
                  </li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/compliance-checker" className="sidebar-link">Compliance Checker</Link></li>
                  <li style={{ marginBottom: '10px' }}><Link to="/tools/grant-calendar" className="sidebar-link">Grant Calendar</Link></li>
                </ul>
              </li>
              <li style={{ marginTop: 'auto', marginBottom: '10px' }}><span style={{ color: '#3e51b5', fontWeight: 'bold', cursor: 'default' }}>Settings</span>
                <ul style={{ listStyle: 'none', paddingLeft: '15px', marginTop: '5px'}}>
                  {user && user.user.role === 'admin' && (
                    <li style={{ marginBottom: '10px' }}><Link to="/admin" className="sidebar-settings-link">Admin Dashboard</Link></li>
                  )}
                  {user && user.user.role === 'admin' && (
                    <li style={{ marginBottom: '10px' }}><Link to="/admin/user-management" className="sidebar-settings-link">Permissions</Link></li>
                  )}
                  <li style={{ marginBottom: '10px' }}><Link to="/change-password" className="sidebar-settings-link">Change Password</Link></li>
                </ul>
              </li>
            </ul>
          </nav>
          <main className={darkMode ? 'dark-mode' : ''} style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            <Routes>
              <Route path="/merge" element={<Merge />} />
              <Route path="/api/projects" element={<ProjectsHome user={user} />} />
              <Route path="/api/projects/:id/view" element={<ProjectView darkMode={darkMode} />} />
              <Route path="/projects/to-be-approved" element={<ToBeApproved user={user} />} /> {/* New route */}
              <Route path="/projects/pending-correction" element={<PendingCorrection />} /> {/* New route */}

              <Route path="/projects/archived" element={<ArchivedProjects />} />
              <Route path="/tools/past-proposals" element={<PastProposals />} />
              <Route path="/tools/file-storer" element={<FileStorer />} />
              <Route path="/tools/ai-reviewer" element={<AIReviewerTool />} />
              <Route path="/tools/ai-reviewer/past-reviews" element={<PastAIReviews user={user} />} /> {/* New route */}
              <Route path="/tools/ai-reviewer/past-reviews/:id" element={<AIReviewDetail user={user} />} />
              <Route path="/tools/ai-reviewer/archived-reviews" element={<ArchivedAIReviews user={user} />} />
              <Route path="/tools/compliance-checker" element={<ComplianceChecker />} />
              <Route path="/tools/grant-calendar" element={<GrantCalendar />} />

              {user && user.user.role === 'admin' ? (
                <Route path="/admin" element={<AdminDashboard />} />
              ) : (
                <Route path="/admin" element={<ProjectsHome />} />
              )}
              {user && user.user.role === 'admin' ? (
                <Route path="/admin/company-management" element={<CompanyManagement fetchData={fetchData} />} />
              ) : (
                <Route path="/admin/company-management" element={<ProjectsHome />} />
              )}
              {user && user.user.role === 'admin' ? (
                <Route path="/admin/user-management" element={<UserManagement allUsers={allUsers} setAllUsers={setAllUsers} companies={companies} fetchData={fetchData} navigate={navigate} />} />
              ) : (
                <Route path="/admin/user-management" element={<ProjectsHome />} />
              )}
              {user && user.user.role === 'admin' ? (
                <Route path="/admin/approval-history" element={<ApprovalHistory />} />
              ) : (
                <Route path="/admin/approval-history" element={<ProjectsHome />} />
              )}
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
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Router>
      <MainAppContent darkMode={darkMode} setDarkMode={setDarkMode} />
    </Router>
  );
}

export default App;