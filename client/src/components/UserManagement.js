import React, { useState } from 'react'; // Add useState
import axios from 'axios';

const UserManagement = ({ allUsers, setAllUsers, companies, fetchData }) => {

  const [showAddUserForm, setShowAddUserForm] = useState(false); // State to toggle add user form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer'); // Default role
  const [newUserCompanyId, setNewUserCompanyId] = useState(''); // Default no company

  const updateUser = async (userId, role, companyId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}/update`, { role, companyId: companyId || null }, config);
      alert('User updated successfully!');
      fetchData(); // Refresh all data
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update user.');
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/users`, // New API endpoint for adding users
        {
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newUserRole,
          companyId: newUserCompanyId || null,
        },
        config
      );
      alert('User added successfully!');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewUserRole('viewer');
      setNewUserCompanyId('');
      setShowAddUserForm(false);
      fetchData(); // Refresh all data
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      const errorMessage = err.response && err.response.data && err.response.data.msg
                           ? err.response.data.msg
                           : 'Failed to add user.';
      alert(errorMessage);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '0 20px' }}>
        <h1>User Management</h1>
        <button onClick={() => setShowAddUserForm(!showAddUserForm)} style={{ marginLeft: '20px', padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showAddUserForm ? 'Cancel Add User' : 'Add New User'}
        </button>
      </div>

      {showAddUserForm && (
        <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
          <h2>Add New User</h2>
          <form onSubmit={addUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="approver">Approver</option>
            </select>
            <select
              value={newUserCompanyId}
              onChange={(e) => setNewUserCompanyId(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="">Select Company (Optional)</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add User</button>
          </form>
        </div>
      )}

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
