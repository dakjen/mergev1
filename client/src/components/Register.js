import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    birthdate: '',
    email: '',
    companyName: ''
  });

  const { username, password, name, birthdate, email, companyName } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/auth/register', formData);
      console.log(res.data);
      alert('Registration successful! Your account is awaiting admin approval.');
      // Optionally redirect or clear form
    } catch (err) {
      console.error(err.response.data);
      alert(err.response.data.msg || 'Registration failed');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Register</h1>
      <form onSubmit={e => onSubmit(e)} style={{ display: 'inline-block', textAlign: 'left' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username:</label>
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={username}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <input
            type="text"
            placeholder="Full Name"
            name="name"
            value={name}
            onChange={e => onChange(e)}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Birthdate:</label>
          <input
            type="date"
            name="birthdate"
            value={birthdate}
            onChange={e => onChange(e)}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Company:</label>
          <input
            type="text"
            placeholder="Company Name"
            name="companyName"
            value={companyName}
            onChange={e => onChange(e)}
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;