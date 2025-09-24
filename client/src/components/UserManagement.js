import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserManagement = ({ allUsers, setAllUsers, companies, fetchData }) => {
  const navigate = useNavigate();

  const updateUser = async (userId, role, companyId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`http://localhost:8000/api/admin/users/${userId}/update`, { role, companyId: companyId || null }, config);
      alert('User updated successfully!');
      fetchData(); // Refresh all data
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update user.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '0 20px' }}>

        <h1>User Management</h1>
      </div>
      {allUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {allUsers.map(user => (
            <li key={user.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{user.username} ({user.email}) - {user.company?.name || 'No Company'}</span>
              <div>
                <select
                  value={user.selectedRole}
                  onChange={(e) => setAllUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, selectedRole: e.target.value } : u))}
                  style={{ marginRight: '10px' }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="approver">Approver</option>
                </select>
                <select
                  value={user.selectedCompanyId}
                  onChange={(e) => setAllUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, selectedCompanyId: e.target.value } : u))}
                  style={{ marginRight: '10px' }}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                <button onClick={() => updateUser(user.id, user.selectedRole, user.selectedCompanyId)}>Save Changes</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserManagement;
