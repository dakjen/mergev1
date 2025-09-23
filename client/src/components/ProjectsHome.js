import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './ProjectsHome.css';

const ProjectsHome = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectDescription, setEditingProjectDescription] = useState('');
  const [editingProjectDetails, setEditingProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
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
      const res = await axios.get('http://localhost:8000/api/projects', config);
      setProjects(res.data);
console.log(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch projects.');
      setLoading(false);
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
      };
      await axios.post(
        'http://localhost:8000/api/projects',
        { name: newProjectName, description: newProjectDescription },
        config
      );
      setNewProjectName('');
      setNewProjectDescription('');
      setShowAddProjectForm(false);
      fetchProjects();
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to add project.');
    }
  };

  const startEdit = (project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
    setEditingProjectDescription(project.description || '');
    setEditingProjectDetails(project.details && project.details.length > 0 ? project.details : [{ question: '', answer: '' }]);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
    setEditingProjectDescription('');
    setEditingProjectDetails([]);
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...editingProjectDetails];
    newDetails[index][field] = value;
    setEditingProjectDetails(newDetails);
  };

  const addDetailPair = () => {
    setEditingProjectDetails([...editingProjectDetails, { question: '', answer: '' }]);
  };

  const removeDetailPair = (index) => {
    const newDetails = editingProjectDetails.filter((_, i) => i !== index);
    setEditingProjectDetails(newDetails);
  };

  const updateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
      };
      await axios.put(
        `http://localhost:8000/api/projects/${editingProjectId}`,
        { name: editingProjectName, description: editingProjectDescription, details: editingProjectDetails },
        config
      );
      cancelEdit();
      fetchProjects();
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update project.');
    }
  };

  const deleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`http://localhost:8000/api/projects/${projectId}`, config);
        fetchProjects();
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to delete project.');
      }
    }
  };

  const archiveProject = async (projectId) => {
    if (window.confirm('Are you sure you want to archive this project?')) {
      alert(`Project ${projectId} archived! (Placeholder)`);
      fetchProjects();
    }
  };

  const getApproval = async (projectId) => {
    if (window.confirm('Request approval for this project?')) {
      alert(`Approval requested for project ${projectId}! (Placeholder)`);
    }
  };

  const markAsCompleted = async (projectId) => {
    if (window.confirm('Mark this project as completed?')) {
      alert(`Project ${projectId} marked as completed! (Placeholder)`);
      fetchProjects();
    }
  };

  if (loading) return <p className="loading-message">Loading projects...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="projects-home-container ProjectsHome">
      <div className="projects-home-header">
        <h2>My Projects</h2>
        <button onClick={() => {
          setEditingProjectId(null);
          setNewProjectName('');
          setNewProjectDescription('');
          setShowAddProjectForm(true);
        }} className="projects-home-add-button">Add Project</button>
      </div>

      {showAddProjectForm && (
        <div className="projects-home-add-form-container">
          <form onSubmit={addProject} className="projects-home-add-form">
            <h3>Create New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <textarea
              placeholder="Project Description (Optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows="3"
            ></textarea>
            <div className="projects-home-add-form-buttons">
              <button type="submit" className="create-button">Create Project</button>
              <button type="button" onClick={() => setShowAddProjectForm(false)} className="cancel-button">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <ul className="projects-home-list">
        {projects.length === 0 ? (
          <p>No projects found. Create one!</p>
        ) : (
          projects.map(project => (
            <li key={project.id} className="projects-home-list-item">
              {editingProjectId === project.id ? (
                <form onSubmit={updateProject} className="projects-home-edit-form">
                  <input
                    type="text"
                    value={editingProjectName}
                    onChange={(e) => setEditingProjectName(e.target.value)}
                    required
                  />
                  <textarea
                    value={editingProjectDescription}
                    onChange={(e) => setEditingProjectDescription(e.target.value)}
                    rows="3"
                    placeholder="Project Description"
                  ></textarea>

                  {editingProjectDetails.map((detail, index) => (
                    <div key={index} className="detail-pair">
                      <input
                        type="text"
                        placeholder="Question"
                        value={detail.question}
                        onChange={(e) => handleDetailChange(index, 'question', e.target.value)}
                      />
                      <textarea
                        placeholder="Answer (Use Markdown for bold/bullets)"
                        value={detail.answer}
                        onChange={(e) => handleDetailChange(index, 'answer', e.target.value)}
                        rows="4"
                      ></textarea>
                      <button type="button" onClick={() => removeDetailPair(index)} className="remove-detail-button">Remove</button>
                    </div>
                  ))}

                  <button type="button" onClick={addDetailPair} className="add-detail-button">Add another question/answer pair</button>

                  <div className="edit-buttons">
                    <button type="submit" className="save-button">Save</button>
                    <button type="button" onClick={cancelEdit} className="cancel-button">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="projects-home-project-header">
                    <h3>{project.name}</h3>
                    <Link to={`/projects/${project.id}/view`} className="projects-home-view-link">View</Link>
                  </div>
                  <p className="projects-home-project-description">{project.description}</p>
                  <p className="projects-home-project-owner">Owner: {project.owner.username} | Company: {project.companyName}</p>
                  <div className="projects-home-project-actions">
                    <div className="main-actions">
                      <button onClick={() => startEdit(project)} className="edit-button">Edit</button>
                      <button onClick={() => archiveProject(project.id)} className="archive-button">Archive</button>
                      <button onClick={() => getApproval(project.id)} className="approval-button">Get Approval</button>
                      <button onClick={() => markAsCompleted(project.id)} className="completed-button">Completed</button>
                    </div>
                    <button onClick={() => deleteProject(project.id)} className="delete-button">Delete</button>
                  </div>

                  {project.narratives && project.narratives.length > 0 && (
                    <ul className="narrative-list">
                      {project.narratives.map((narrative, narrativeIndex) => (
                        <li key={narrativeIndex} className="narrative-item">
                          <div className="narrative-content">
                            <p><strong>Narrative Title:</strong> {narrative.title}</p>
                            <p><strong>Narrative Description:</strong> {narrative.description}</p>
                            <p><strong>Narrative Status:</strong> {narrative.status}</p>
                            <p><strong>Narrative Created At:</strong> {new Date(narrative.createdAt).toLocaleDateString()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ProjectsHome;
