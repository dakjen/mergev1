import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProjectsHome = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectDescription, setEditingProjectDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false); // New state for form visibility

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
        headers: {
          'x-auth-token': token
        }
      };
      const res = await axios.get('http://localhost:8000/api/projects', config);
      setProjects(res.data);
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
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.post('http://localhost:8000/api/projects', { name: newProjectName, description: newProjectDescription }, config);
      setNewProjectName('');
      setNewProjectDescription('');
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
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
    setEditingProjectDescription('');
  };

  const updateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`http://localhost:8000/api/projects/${editingProjectId}`, { name: editingProjectName, description: editingProjectDescription }, config);
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
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
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
      console.log(`Archiving project with ID: ${projectId}`);
      // Implement archive logic here (e.g., API call to update project status)
      alert(`Project ${projectId} archived! (Placeholder)`);
      fetchProjects(); // Refresh the list after action
    }
  };

  const getApproval = async (projectId) => {
    if (window.confirm('Request approval for this project?')) {
      console.log(`Requesting approval for project with ID: ${projectId}`);
      // Implement get approval logic here
      alert(`Approval requested for project ${projectId}! (Placeholder)`);
      // fetchProjects(); // Refresh if status changes
    }
  };

  const markAsCompleted = async (projectId) => {
    if (window.confirm('Mark this project as completed?')) {
      console.log(`Marking project with ID: ${projectId} as completed`);
      // Implement mark as completed logic here
      alert(`Project ${projectId} marked as completed! (Placeholder)`);
      fetchProjects(); // Refresh the list after action
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading projects...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0' }}>My Projects</h2>
        <button onClick={() => {
          setEditingProjectId(null);
          setNewProjectName('');
          setNewProjectDescription('');
          setShowAddProjectForm(true); // Show the form
        }} style={{ padding: '10px 20px', backgroundColor: '#7fab61', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add Project</button>
      </div>

      {showAddProjectForm && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <form onSubmit={addProject} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Create New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              style={{ padding: '10px', margin: '5px', borderRadius: '5px', border: '1px solid #ddd', width: '300px' }}
            />
            <textarea
              placeholder="Project Description (Optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows="3"
              style={{ padding: '10px', margin: '5px', borderRadius: '5px', border: '1px solid #ddd', width: '300px' }}
            ></textarea>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Create Project</button>
            <button type="button" onClick={() => setShowAddProjectForm(false)} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', marginLeft: '10px' }}>Cancel</button>
          </form>
        </div>
      )}

        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {projects.length === 0 ? (
            <p>No projects found. Create one!</p>
          ) : (
            projects.map(project => (
              <li key={project.id} style={{ background: '#f4f4f4', margin: '10px 0', padding: '15px', borderRadius: '5px', maxWidth: '600px', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {editingProjectId === project.id ? (
                  <form onSubmit={updateProject} style={{ width: '100%' }}>
                    <input
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      required
                      style={{ padding: '8px', marginBottom: '5px', borderRadius: '3px', border: '1px solid #ddd', width: 'calc(100% - 16px)' }}
                    />
                    <textarea
                      value={editingProjectDescription}
                      onChange={(e) => setEditingProjectDescription(e.target.value)}
                      rows="2"
                      style={{ padding: '8px', marginBottom: '10px', borderRadius: '3px', border: '1px solid #ddd', width: 'calc(100% - 16px)' }}
                    ></textarea>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Save</button>
                      <button type="button" onClick={cancelEdit} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <> 
                    <h3 style={{ margin: '0 0 5px 0' }}>{project.name}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#555' }}>{project.description}</p>
                    <p style={{ margin: '0', fontSize: '0.8em', color: '#777' }}>Owner: {project.owner.username} | Company: {project.companyName}</p>
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <button onClick={() => startEdit(project)} style={{ padding: '8px 15px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                        <button onClick={() => archiveProject(project.id)} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Archive</button>
                        <button onClick={() => getApproval(project.id)} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Get Approval</button>
                        <button onClick={() => markAsCompleted(project.id)} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Completed</button>
                      </div>
                      <button onClick={() => deleteProject(project.id)} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
    </>
  );
};

export default ProjectsHome;