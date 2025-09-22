import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Permissions = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editingCompanyName, setEditingCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
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
      const res = await axios.get('http://localhost:8000/api/companies', config);
      setCompanies(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch companies.');
      setLoading(false);
    }
  };

  const addCompany = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.post('http://localhost:8000/api/companies', { name: newCompanyName }, config);
      setNewCompanyName('');
      fetchCompanies();
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to add company.');
    }
  };

  const startEdit = (company) => {
    setEditingCompanyId(company.id);
    setEditingCompanyName(company.name);
  };

  const cancelEdit = () => {
    setEditingCompanyId(null);
    setEditingCompanyName('');
  };

  const updateCompany = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`http://localhost:8000/api/companies/${editingCompanyId}`, { name: editingCompanyName }, config);
      cancelEdit();
      fetchCompanies();
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update company.');
    }
  };

  const deleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        await axios.delete(`http://localhost:8000/api/companies/${companyId}`, config);
        fetchCompanies();
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to delete company.');
      }
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading companies...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Permissions Management</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>Company Management</h2>
        <form onSubmit={addCompany} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="New Company Name"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            required
            style={{ padding: '8px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add Company</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {companies.map(company => (
            <li key={company.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingCompanyId === company.id ? (
                <form onSubmit={updateCompany} style={{ display: 'inline' }}>
                  <input
                    type="text"
                    value={editingCompanyName}
                    onChange={(e) => setEditingCompanyName(e.target.value)}
                    required
                    style={{ padding: '5px', marginRight: '10px', borderRadius: '3px', border: '1px solid #ddd' }}
                  />
                  <button type="submit" style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Save</button>
                  <button type="button" onClick={cancelEdit} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                </form>
              ) : (
                <>
                  <span>{company.name}</span>
                  <div>
                    <button onClick={() => startEdit(company)} style={{ padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                    <button onClick={() => deleteCompany(company.id)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Permissions;
