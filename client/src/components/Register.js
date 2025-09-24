import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    birthdate: '',
    email: '',
  });
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { username, password, name, birthdate, email } = formData;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const config = {
          withCredentials: true
        };
        const res = await axios.get('http://localhost:8000/api/companies', config);
        setCompanies(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.msg : 'Failed to fetch companies.');
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCompanyChange = (e) => {
    setSelectedCompanyId(e.target.value);
  };

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { ...formData, companyId: selectedCompanyId };
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
      // No need to convert birthdate to ISO string here, send as YYYY-MM-DD
      const res = await axios.post('http://localhost:8000/api/auth/register', payload, config);
      console.log(res.data);
      alert('Registration successful! Your account is awaiting admin approval.');
      // Optionally redirect or clear form
    } catch (err) {
      console.error(err.response.data);
      alert(err.response.data.msg || 'Registration failed');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading companies...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

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
          <select value={selectedCompanyId} onChange={handleCompanyChange} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}>
            <option value="">Select a company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;