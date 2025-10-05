import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ArchivedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArchivedProjects = useCallback(async () => {
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
        headers: { 'x-auth-token': token }
      };
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/archived`, config);
      setProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch archived projects.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedProjects();
  }, [fetchArchivedProjects]);

  const unarchiveProject = async (projectId) => {
    if (window.confirm('Are you sure you want to unarchive this project?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token }
        };
        await axios.put(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/unarchive`, {}, config);
        fetchArchivedProjects(); // Refresh the list after unarchiving
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to unarchive project.');
      }
    }
  };

  if (loading) return <p className="loading-message">Loading archived projects...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="projects-home-container">
      <div className="projects-home-header">
        <h2>Archived Projects</h2>
      </div>
      <Link to="/projects" className="projects-home-view-link">Back to Projects</Link>
      <ul className="projects-home-list">
        {projects.length === 0 ? (
          <p>No archived projects found.</p>
        ) : (
          projects.map(project => (
            <li key={project.id} className="projects-home-list-item">
              <h3>{project.name}</h3>
              <p className="projects-home-project-description">{project.description}</p>
              <p className="projects-home-project-owner">Owner: {project.owner.username} | Company: {project.company.name}</p>
              <button onClick={() => unarchiveProject(project.id)} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Unarchive</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ArchivedProjects;