import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectsHome.css';
import ProjectView from './ProjectView'; // Import ProjectView
import ConfirmModal from './ConfirmModal'; // Import ConfirmModal

const ProjectsHome = ({ user }) => { // Accept user prop
  const [projects, setProjects] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectDescription, setEditingProjectDescription] = useState('');
  const [editingProjectDetails, setEditingProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproverModal, setShowApproverModal] = useState(false); // State for approver modal
  const [approvers, setApprovers] = useState([]); // State for list of approvers
  const [selectedApproverId, setSelectedApproverId] = useState(''); // State for selected approver
  const [projectToApproveId, setProjectToApproveId] = useState(null); // Project ID for current approval request
  const [companyUsers, setCompanyUsers] = useState([]); // New state for users in the company
  const [selectedProject, setSelectedProject] = useState(null); // New state for selected project
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    fetchProjects();
    fetchCompanyUsers(); // Fetch company users when component mounts
  }, []);

  const fetchCompanyUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = {
        headers: { 'x-auth-token': token }
      };
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, config);
      setCompanyUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch company users:', err.response ? err.response.data : err.message);
    }
  };

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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects`, config);
      setProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch projects.');
      setLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const startEdit = (project) => {
    handleViewProject(project);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
    setEditingProjectDescription('');
    setEditingProjectDetails([]);
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...editingProjectDetails];
    if (field === 'question') {
      newDetails[index].text = value; // Update the 'text' field of the question
      newDetails[index].question = value; // Keep 'question' for UI compatibility
    } else {
      newDetails[index][field] = value;
    }
    setEditingProjectDetails(newDetails);
  };

  const handleEditQuestionToggle = (index, isEditing) => {
    const newDetails = [...editingProjectDetails];
    newDetails[index].isEditingQuestion = isEditing;
    setEditingProjectDetails(newDetails);
  };

  const handleSaveQuestion = (index) => {
    // For now, just exit edit mode for the question text
    handleEditQuestionToggle(index, false);
  };

  const addDetailPair = () => {
    setEditingProjectDetails([...editingProjectDetails, { question: '', answer: '', isEditingQuestion: true }]);
  };

  const removeDetailPair = async (index) => {
    const questionToRemove = editingProjectDetails[index];
    const onConfirm = async () => {
        if (questionToRemove.id) { // Only try to delete if the question exists in the DB
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/projects/questions/${questionToRemove.id}`, config);
            } catch (err) {
                console.error(err.response ? err.response.data : err.message);
                alert(err.response ? err.response.data.msg : 'Failed to delete question.');
                setModalState({ ...modalState, isOpen: false });
                return; // Don't remove from UI if delete failed
            }
        }
        const newDetails = editingProjectDetails.filter((_, i) => i !== index);
        setEditingProjectDetails(newDetails);
        setModalState({ ...modalState, isOpen: false });
    };

    setModalState({
        isOpen: true,
        title: 'Delete Question',
        message: 'Are you sure you want to delete this question?',
        onConfirm,
    });
  };

  const updateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
      };
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/projects/${editingProjectId}`,
        { name: editingProjectName, description: editingProjectDescription },
        config
      );

      // Update each question individually
      for (const question of editingProjectDetails) {
        if (question.id) { // Only update existing questions
          await axios.put(
            `${process.env.REACT_APP_API_URL}/api/projects/questions/${question.id}/assign`,
            { text: question.question },
            config
          );
        } else { // Create new questions if they don't have an ID (added during edit)
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/projects/${editingProjectId}/questions`,
            { text: question.question },
            config
          );
        }
      }
      cancelEdit();
      fetchProjects();
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to update project.');
    }
  };

  const deleteProject = async (projectId) => {
    const onConfirm = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}`, config);
        fetchProjects();
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to delete project.');
      }
      setModalState({ ...modalState, isOpen: false });
    };

    setModalState({
        isOpen: true,
        title: 'Delete Project',
        message: 'Are you sure you want to delete this project?',
        onConfirm,
    });
  };

  const archiveProject = async (projectId) => {
    const onConfirm = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.put(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/archive`, {}, config);
        fetchProjects();
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to archive project.');
      }
      setModalState({ ...modalState, isOpen: false });
    };

    setModalState({
        isOpen: true,
        title: 'Archive Project',
        message: 'Are you sure you want to archive this project?',
        onConfirm,
    });
  };

  const getApproval = async (projectId) => {
    setProjectToApproveId(projectId);
    setShowApproverModal(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token },
        withCredentials: true
      };
      // Fetch approvers from the same company
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, config);
      const companyApprovers = res.data.filter(u => u.role === 'approver');
      setApprovers(companyApprovers);
      if (companyApprovers.length > 0) {
        setSelectedApproverId(companyApprovers[0].id);
      }
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to fetch approvers.');
      setShowApproverModal(false);
    }
  };

  const sendApprovalRequest = async () => {
    if (!selectedApproverId) {
      alert('Please select an approver.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
        withCredentials: true
      };
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/projects/${projectToApproveId}/request-approval`,
        { approverId: selectedApproverId },
        config
      );
      alert('Approval request sent successfully!');
      setShowApproverModal(false);
      fetchProjects(); // Refresh projects to show updated status
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to send approval request.');
    }
  };

  const markAsCompleted = async (projectId) => {
    const onConfirm = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
          withCredentials: true
        };
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/projects/${projectId}`,
          { isCompleted: true }, // Send isCompleted status
          config
        );
        alert(`Project ${projectId} marked as completed!`);
        fetchProjects(); // Refresh projects to show updated status
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to mark project as completed.');
      }
      setModalState({ ...modalState, isOpen: false });
    };

    setModalState({
        isOpen: true,
        title: 'Mark as Completed',
        message: 'Mark this project as completed?',
        onConfirm,
    });
  };

  if (loading) return <p className="loading-message">Loading projects...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  if (selectedProject) {
    return <ProjectView project={selectedProject} onBack={handleBackToProjects} darkMode={false} />;
  }

  return (
    <div className="projects-home-container ProjectsHome">
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
      />
      <div className="projects-home-header">
        <h2>My Projects</h2>
      </div>

      <ul className="projects-home-list">
        {projects.length === 0 ? (
          <p>No projects found. Create one!</p>
        ) : (
          projects.map(project => (
            <li key={project.id} className="projects-home-list-item"
                style={{ backgroundColor: project.isCompleted ? '#98abff' : '#f4f4f4' }}> {/* Conditional styling */}
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
                    <div key={detail.id || `new-${index}`} className="detail-pair">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        {detail.isEditingQuestion ? (
                          <input
                            type="text"
                            value={detail.question}
                            onChange={(e) => handleDetailChange(index, 'question', e.target.value)}
                            style={{ flexGrow: 1, marginRight: '10px' }}
                          />
                        ) : (
                          <p style={{ fontWeight: 'bold', margin: 0 }}>Question: {detail.question}</p>
                        )}
                        {user && user.user.role === 'admin' && (
                          detail.isEditingQuestion ? (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button type="button" onClick={() => handleSaveQuestion(index)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px' }}>Save</button>
                              <button type="button" onClick={() => handleEditQuestionToggle(index, false)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px' }}>Cancel</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => handleEditQuestionToggle(index, true)} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px' }}>Edit</button>
                          )
                        )}
                      </div>

                      <textarea
                        placeholder="Answer (Use Markdown for bold/bullets)"
                        value={detail.answer}
                        onChange={(e) => handleDetailChange(index, 'answer', e.target.value)}
                        rows="4"
                      ></textarea>
                      <p style={{ fontSize: '0.8em', color: '#666', textAlign: 'right', marginTop: '5px' }}>
                        Words: {detail.answer ? detail.answer.trim().split(/\s+/).filter(word => word.length > 0).length : 0} |
                        Chars: {detail.answer ? detail.answer.length : 0}
                      </p>
                      {user && user.user.role === 'admin' && ( // Only visible to admins
                        <button type="button" onClick={() => removeDetailPair(index)} className="remove-detail-button">Remove</button>
                      )}
                    </div>
                  ))}

                  <div>
                    {user && user.user.role === 'admin' && ( // Only visible to admins
                    <button type="button" onClick={addDetailPair} className="add-detail-button">Add another question/answer pair</button>
                  )}

                    <div className="edit-buttons">
                      <button type="submit" className="save-button">Save</button>
                      <button type="button" onClick={cancelEdit} className="cancel-button">Cancel</button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="projects-home-project-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{project.name}</h3>
                    <button onClick={() => handleViewProject(project)} className="projects-home-view-link">View</button>
                  </div>
                  {project.deadlineDate && (
                    <p style={{ color: '#3e51b5', fontWeight: 'bold', fontSize: '0.9em', textAlign: 'right', marginBottom: '10px' }}>
                      Due: {new Date(project.deadlineDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="projects-home-project-description">{project.description}</p>
                  <p className="projects-home-project-owner">Owner: {project.owner.username} | Company: {project.companyName}</p>
                  {project.status === 'pending_approval' && (
                    <p style={{ color: 'black', fontWeight: 'bold', marginTop: '5px' }}>Status: Pending Approval</p>
                  )}
                  {project.status === 'approved' && (
                    <p style={{ color: 'green', fontWeight: 'bold', marginTop: '5px' }}>Status: Approved</p>
                  )}
                  {project.status === 'rejected' && (
                    <p style={{ color: 'red', fontWeight: 'bold', marginTop: '5px' }}>Status: Rejected</p>
                  )}
                  <div className="projects-home-project-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="main-actions">
                      {!project.isCompleted && (
                        <>
                          <button onClick={() => startEdit(project)} className="edit-button" style={{ backgroundColor: '#7fab61' }}>Edit</button>
                          {project.status !== 'pending_approval' && ( // Hide if already pending approval
                            <button onClick={() => getApproval(project.id)} className="approval-button" style={{ backgroundColor: '#98abff' }}>Get Approval</button>
                          )}
                        </>
                      )}
                      <button onClick={() => archiveProject(project.id)} className="archive-button">Archive</button>
                      {!project.isCompleted && (
                        <button onClick={() => markAsCompleted(project.id)} className="completed-button" style={{ backgroundColor: '#debf84' }}>Completed</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user && user.user.role === 'admin' && (
                        <button onClick={() => deleteProject(project.id)} className="delete-button">Delete</button>
                      )}
                    </div>
                  </div>

                  {/* Approver Selection Modal */}
                  {showApproverModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                        <h3>Select Approver</h3>
                        {approvers.length === 0 ? (
                          <p>No approvers found in your company.</p>
                        ) : (
                          <select
                            value={selectedApproverId}
                            onChange={(e) => setSelectedApproverId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', width: '100%' }}
                          >
                            {approvers.map(approver => (
                              <option key={approver.id} value={approver.id}>{approver.username}</option>
                            ))}
                          </select>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                          <button onClick={sendApprovalRequest} disabled={!selectedApproverId} style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Send Request
                          </button>
                          <button onClick={() => setShowApproverModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/projects/archived">View Archived Projects</Link>
      </div>
    </div>
  );
};

export default ProjectsHome;
