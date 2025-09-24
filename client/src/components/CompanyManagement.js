import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Permissions = ({ fetchData }) => {
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
        },
        params: { includeArchived: true } // Fetch all companies, including archived
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
      if (fetchData) fetchData(); // Refresh global data in App.js
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
      if (fetchData) fetchData(); // Refresh global data in App.js
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update company.');
    }
  };

  const archiveCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to archive this company?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        await axios.delete(`http://localhost:8000/api/companies/${companyId}`, config); // DELETE now archives
        fetchCompanies();
        if (fetchData) fetchData(); // Refresh global data in App.js
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to archive company.');
      }
    }
  };

  const unarchiveCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to unarchive this company?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        await axios.put(`http://localhost:8000/api/companies/${companyId}/unarchive`, {}, config);
        fetchCompanies();
        if (fetchData) fetchData(); // Refresh global data in App.js
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to unarchive company.');
      }
    }
  };

  const navigate = useNavigate(); // Initialize useNavigate

  if (loading) return <p style={{ textAlign: 'center' }}>Loading companies...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '0 20px' }}>
        <button onClick={() => navigate('/admin')} style={{ marginRight: '20px', padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back</button>
        <h1>Company Management</h1>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Add New Company</h2>
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

        <h2 style={{ marginTop: '30px' }}>Existing Companies</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {companies.map(company => (
            <li key={company.id} style={{ background: company.isArchived ? '#f0f0f0' : '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: company.isArchived ? '#888' : '#000' }}>
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
                  <span>{company.name} {company.isArchived && '(Archived)'}</span>
                  <div>
                    <button onClick={() => startEdit(company)} style={{ padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                    {company.isArchived ? (
                      <button onClick={() => unarchiveCompany(company.id)} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Unarchive</button>
                    ) : (
                      <button onClick={() => archiveCompany(company.id)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Archive</button>
                    )}
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
