import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming Link might be useful for viewing project details

const PastProposals = () => {
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedProjects();
  }, []);

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
      const res = await axios.get('http://localhost:8000/api/projects/completed', config);
      setCompletedProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError('Failed to fetch completed projects. Please ensure you are logged in and have projects marked as completed.'); // More specific error
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading past proposals...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Past Proposals</h2>
      <p>This page displays projects that have been marked as completed.</p> {/* Explanatory text */}

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