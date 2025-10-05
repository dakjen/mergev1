import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ArchivedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchivedProjects = async () => {
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
    };

    fetchArchivedProjects();
  }, []);

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
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ArchivedProjects;