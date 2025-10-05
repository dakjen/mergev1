import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PendingCorrection = () => {
  const [rejectedProjects, setRejectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRejectedProjects();
  }, []);

  const fetchRejectedProjects = async () => {
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/rejected`, config); // New API endpoint
      setRejectedProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch projects pending correction.'); // More specific error
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading projects pending correction...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Projects Pending Correction</h2>
      <p>This page displays projects that have been rejected by an approver and require correction.</p> {/* Explanatory text */}

      {rejectedProjects.length === 0 ? (
        <p>No projects yet!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rejectedProjects.map(project => (
            <li key={project.id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'left', backgroundColor: '#ffe6e6' }}>
              <h3>{project.name}</h3>
              <p><strong>Description:</strong> {project.description}</p>
              <p><strong>Owner:</strong> {project.owner.username}</p>
              {project.deadlineDate && <p><strong>Due Date:</strong> {new Date(project.deadlineDate).toLocaleDateString()}</p>}
              <p style={{ color: 'red', fontWeight: 'bold' }}>Status: Rejected</p>
              {project.approvalRequests && project.approvalRequests.length > 0 && project.approvalRequests[0].comments && (
                <p><strong>Approver Comments:</strong> {project.approvalRequests[0].comments}</p>
              )}
              <Link to={`/api/projects/${project.id}/view`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>View Details</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingCorrection;
