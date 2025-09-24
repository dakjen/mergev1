import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { username, password } = formData;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const config = {
          withCredentials: true
        };
        const res = await axios.get('/api/companies', config);
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
    setSelectedCompany(e.target.value);
  };

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
      const res = await axios.post('/api/auth/login', { username, password, companyId: selectedCompany }, config);
      localStorage.setItem('token', res.data.token);
      onLoginSuccess(res.data.token);
      navigate('/api/projects');
    } catch (err) {
      console.error(err.response.data);
      alert(err.response.data.msg || 'Login failed');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading companies...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Login</h1>
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
        <div style={{ marginBottom: '20px' }}>
          <label>Company:</label>
          <select value={selectedCompany} onChange={handleCompanyChange} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}>
            <option value="">Select a company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
