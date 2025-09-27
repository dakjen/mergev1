import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming Link might be useful for viewing project details

const PastProposals = () => {
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false); // New state for form visibility
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDeadlineDate, setNewProjectDeadlineDate] = useState('');
  const [newProjectQuestions, setNewProjectQuestions] = useState([]);

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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/completed`, config);
      setCompletedProjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError('Failed to fetch completed projects. Please ensure you are logged in and have projects marked as completed.'); // More specific error
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
        `${process.env.REACT_APP_API_URL}/api/projects`,
        { 
          name: newProjectName, 
          description: newProjectDescription, 
          deadlineDate: newProjectDeadlineDate, 
          questions: newProjectQuestions,
          isCompleted: true // Mark as completed by default for past projects
        },
        config
      );
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectDeadlineDate('');
      setNewProjectQuestions([]);
      setShowAddProjectForm(false);
      fetchCompletedProjects(); // Refresh the list of completed projects
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to add project.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading past proposals...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Past Proposals</h2>
      <p>This page displays projects that have been marked as completed.</p>

      <button onClick={() => {
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectDeadlineDate('');
        setNewProjectQuestions([]);
        setShowAddProjectForm(true);
      }} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
        Add Past Project
      </button>

      {showAddProjectForm && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
          <h3>Add New Past Project</h3>
          <form onSubmit={addProject} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <textarea
              placeholder="Project Description (Optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows="3"
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            ></textarea>
            <label htmlFor="newProjectDeadlineDate" style={{ textAlign: 'left', marginBottom: '-5px' }}>Completion Date:</label>
            <input
              type="date"
              id="newProjectDeadlineDate"
              value={newProjectDeadlineDate}
              onChange={(e) => setNewProjectDeadlineDate(e.target.value)}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />

            {/* Questions for New Past Project */}
            <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <h4>Questions (Optional)</h4>
              {newProjectQuestions.map((q, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <textarea
                    placeholder="Question text"
                    value={q.text}
                    onChange={(e) => {
                      const updatedQuestions = [...newProjectQuestions];
                      updatedQuestions[index].text = e.target.value;
                      setNewProjectQuestions(updatedQuestions);
                    }}
                    rows="2"
                    style={{ width: '100%', marginBottom: '5px' }}
                  ></textarea>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedQuestions = newProjectQuestions.filter((_, i) => i !== index);
                      setNewProjectQuestions(updatedQuestions);
                    }}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px' }}
                  >Remove Question</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewProjectQuestions([...newProjectQuestions, { text: '' }])}
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px', marginTop: '10px' }}
              >Add Question</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Past Project</button>
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