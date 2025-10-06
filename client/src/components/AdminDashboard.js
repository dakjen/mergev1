import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // New state for companies
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      const [pendingRes, companiesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users/pending`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/companies`, config) // Fetch all companies
      ]);

      setPendingUsers(pendingRes.data.map(user => ({ ...user, selectedRole: user.role, selectedCompanyId: user.company?.id || '' })));
      setCompanies(companiesRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch data.');
      setLoading(false);
    }
  };

  const approveUser = async (userId, role, companyId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}/approve`, { role, companyId: companyId || null }, config);
      alert('User approved successfully!');
      fetchData(); // Refresh all data
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to approve user.');
    }
  };

  const handlePendingRoleChange = (userId, newRole) => {
    setPendingUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, selectedRole: newRole } : user
      )
    );
  };

  const handlePendingCompanyChange = (userId, newCompanyId) => {
    setPendingUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, selectedCompanyId: newCompanyId } : user
      )
    );
  };

  const navigate = useNavigate(); // Initialize useNavigate

  if (loading) return <p style={{ textAlign: 'center' }}>Loading data...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Admin Dashboard</h2>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/admin/approval-history')} style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#3e51b5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Approval History</button>
        <button onClick={() => navigate('/admin/company-management')} style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#3e51b5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Company Management</button>

      </div>

      <h3>Pending User Approvals</h3>
      {pendingUsers.length === 0 ? (
        <p>No pending users.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingUsers.map(user => (
            <li key={user.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{user.username} ({user.email})</span>
              <div>
                <select
                  value={user.selectedRole}
                  onChange={(e) => handlePendingRoleChange(user.id, e.target.value)}
                  style={{ marginRight: '10px' }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="approver">Approver</option>
                </select>
                <select
                  value={user.selectedCompanyId}
                  onChange={(e) => handlePendingCompanyChange(user.id, e.target.value)}
                  style={{ marginRight: '10px' }}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                <button onClick={() => approveUser(user.id, user.selectedRole, user.selectedCompanyId)}>Approve</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: '50px' }}>
        <button onClick={() => navigate('/change-password')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Change Password</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
