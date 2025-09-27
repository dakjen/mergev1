import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked'; // For rendering markdown response

const AIReviewerTool = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [grantWebsite, setGrantWebsite] = useState(''); // New state
  const [grantPurposeStatement, setGrantPurposeStatement] = useState(''); // New state
  const [aiReviewResult, setAiReviewResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false); // Loading state for AI review

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
        headers: { 'x-auth-token': token },
        withCredentials: true
      };
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects`, config);
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProjectId(res.data[0].id); // Select first project by default
      }
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch projects.');
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedProjectId) {
      alert('Please select a project to review.');
      return;
    }
    if (!grantWebsite.trim()) {
      alert('Please enter the Grant Website.');
      return;
    }
    if (!grantPurposeStatement.trim()) {
      alert('Please enter the Grant Purpose Statement.');
      return;
    }

    setReviewLoading(true);
    setAiReviewResult('');
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/review`,
        {
          projectId: selectedProjectId,
          grantWebsite,
          grantPurposeStatement,
        },
        config
      );
      setAiReviewResult(res.data.review);
      setReviewLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? (err.response.data.msg || err.response.data) : 'Failed to get AI review.');
      setReviewLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading projects...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>AI Reviewer Tool</h2>

      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
        <h3>Select Project for Review</h3>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', width: '100%' }}
        >
          <option value="">-- Select a Project --</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>

        <h3>Grant Website</h3>
        <input
          type="url"
          placeholder="e.g., https://www.examplegrant.org"
          value={grantWebsite}
          onChange={(e) => setGrantWebsite(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', width: '100%' }}
        />

        <h3>Grant Purpose Statement</h3>
        <textarea
          placeholder="Enter the purpose statement of the grant you are applying for."
          value={grantPurposeStatement}
          onChange={(e) => setGrantPurposeStatement(e.target.value)}
          rows="5"
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', width: '100%' }}
        ></textarea>

        <button
          onClick={handleReview}
          disabled={!selectedProjectId || !grantWebsite.trim() || !grantPurposeStatement.trim() || reviewLoading}
          style={{ padding: '10px 20px', backgroundColor: '#6200EE', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {reviewLoading ? 'Getting Review...' : 'Get AI Review'}
        </button>
      </div>

      {aiReviewResult && (
        <div style={{ marginTop: '30px', textAlign: 'left', border: '1px solid #eee', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
          <h3>AI Review Result</h3>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(aiReviewResult) }} />
        </div>
      )}
    </div>
  );
};

export default AIReviewerTool;