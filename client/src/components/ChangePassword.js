import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { oldPassword, newPassword, confirmNewPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const res = await axios.put('http://localhost:8000/api/auth/change-password', formData, config);
      setMessage(res.data.msg);
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to change password.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Change Password</h1>
      <form onSubmit={e => onSubmit(e)} style={{ display: 'inline-block', textAlign: 'left' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Old Password:</label>
          <input
            type="password"
            placeholder="Old Password"
            name="oldPassword"
            value={oldPassword}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>New Password:</label>
          <input
            type="password"
            placeholder="New Password"
            name="newPassword"
            value={newPassword}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Confirm New Password:</label>
          <input
            type="password"
            placeholder="Confirm New Password"
            name="confirmNewPassword"
            value={confirmNewPassword}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <button type="submit">Change Password</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ChangePassword;
