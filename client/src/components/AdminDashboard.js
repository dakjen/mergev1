import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in as an admin.');
        setLoading(false);
        return;
      }
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      const res = await axios.get('http://localhost:8000/api/admin/users/pending', config);
      setPendingUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch pending users.');
      setLoading(false);
    }
  };

  const approveUser = async (userId, role) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      await axios.put(`http://localhost:8000/api/admin/users/${userId}/approve`, { role }, config);
      alert('User approved successfully!');
      fetchPendingUsers(); // Refresh the list
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to approve user.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading pending users...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Admin Dashboard</h1>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ margin: '0 10px', textDecoration: 'none', color: '#3e51b5' }}>User Approvals</Link>
        <Link to="/admin/permissions" style={{ margin: '0 10px', textDecoration: 'none', color: '#3e51b5' }}>Permissions</Link>
        <Link to="/change-password" style={{ margin: '0 10px', textDecoration: 'none', color: '#3e51b5' }}>Change Password</Link>
      </nav>
      <h2>Pending User Approvals</h2>
      {pendingUsers.length === 0 ? (
        <p>No pending users.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingUsers.map(user => (
            <li key={user.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{user.username} ({user.role})</span>
              <div>
                <select
                  value={user.role} // Display current role, though it should be 'viewer' for pending
                  onChange={(e) => approveUser(user.id, e.target.value)}
                  style={{ marginRight: '10px' }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => approveUser(user.id, user.role)}>Approve</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;
