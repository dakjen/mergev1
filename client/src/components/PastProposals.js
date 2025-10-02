import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming Link might be useful for viewing project details

const PastProposals = () => {
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false); // New state for form visibility
  const [selectedFile, setSelectedFile] = useState(null); // New state for selected file

  const fetchCompletedProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }
      const config = {
        headers: { 'x-auth-token': token },
        withCredentials: true
      };
      // Assuming a new API endpoint for fetching completed projects
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/completed`, config);
      setCompletedProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError('Failed to fetch completed projects. Please ensure you are logged in and have projects marked as completed.'); // More specific error
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedProjects(); // Call inside useEffect
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      };
      // Assuming a new API endpoint for document upload and parsing
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/projects/upload-document`, formData, config);
      alert('Document uploaded and parsed successfully!');
      console.log('Parsed Data:', res.data);
      // Here you would typically process res.data to populate project/question states
      // For now, we'll just log it.
      setSelectedFile(null);
      setShowAddProjectForm(false);
      fetchCompletedProjects(); // Refresh the list of completed projects
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to upload and parse document.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading past proposals...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Past Proposals</h2>
      <p>This page displays projects that have been marked as completed.</p>

      <button onClick={() => {
        setSelectedFile(null);
        setShowAddProjectForm(true);
      }} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
        Upload Past Project Document
      </button>

      {showAddProjectForm && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
          <h3>Upload Document for Past Project</h3>
          <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="file"
              onChange={handleFileChange}
              required
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Upload and Parse</button>
              <button type="button" onClick={() => setShowAddProjectForm(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {completedProjects.length === 0 ? (
        <p>No completed proposals found for your company. Projects will appear here once they are marked as completed.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {completedProjects.map(project => (
            <li key={project.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '15px', borderRadius: '5px', maxWidth: '800px', textAlign: 'left', backgroundColor: '#98abff' }}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <p><strong>Owner:</strong> {project.owner.username}</p>
              {project.deadlineDate && <p><strong>Due Date:</strong> {new Date(project.deadlineDate).toLocaleDateString()}</p>}
              <Link to={`/api/projects/${project.id}/view`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>View Details</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PastProposals;