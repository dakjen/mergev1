import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AddPastProject from './AddPastProject';
import Modal from './Modal';

const CompletedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  const fetchCompletedProjects = useCallback(async () => {
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/completed`, config);
      setProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch completed projects.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedProjects();
  }, [fetchCompletedProjects]);

  const handleProjectAdded = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowAddProjectModal(false);
  };

  if (loading) return <p className="loading-message">Loading completed projects...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="projects-home-container">
      <div className="projects-home-header">
        <h2>Completed Projects</h2>
        <button onClick={() => setShowAddProjectModal(true)} className="add-project-button">Add Past Project</button>
      </div>
      <Link to="/projects" className="projects-home-view-link">Back to Projects</Link>

      <Modal isOpen={showAddProjectModal} onClose={() => setShowAddProjectModal(false)} title="Add a Finished Project">
        <AddPastProject onProjectAdded={handleProjectAdded} />
      </Modal>

      <ul className="projects-home-list">
        {projects.length === 0 ? (
          <p>No completed projects found.</p>
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

export default CompletedProjects;
