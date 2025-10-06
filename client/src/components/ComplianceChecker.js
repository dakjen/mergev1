import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for API calls

const ComplianceChecker = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectDetails, setSelectedProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    } else {
      setSelectedProjectDetails([]);
    }
  }, [selectedProjectId]);

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

  const fetchProjectDetails = async (projectId) => {
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}`, config);
      const questions = res.data.questions ? res.data.questions.map(q => ({
        question: q.text,
        answer: q.answer,
        limit: q.maxLimit || 0, // Use maxLimit from Question model
        unit: q.limitUnit || 'word' // Use limitUnit from Question model
      })) : [];
      setSelectedProjectDetails(questions); // Set questions as details
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch project details.');
      setLoading(false);
    }
  };

  const checkCompliance = (answer, limit, unit) => {
    const result = {
      count: 0,
      compliance: true,
      unit: unit,
    };

    if (answer) {
      if (unit === 'character') {
        result.count = answer.length;
        result.compliance = limit === 0 || result.count <= limit;
      } else { // Default to word count
        const words = answer.trim().split(/\s+/).filter(word => word.length > 0);
        result.count = words.length;
        result.compliance = limit === 0 || result.count <= limit;
      }
    }
    return result;
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading projects...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Compliance Checker</h2>

      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h3>Select Project</h3>
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
      </div>

      {selectedProjectDetails.length === 0 ? (
        selectedProjectId ? <p>No Q&A details found for this project.</p> : <p>Please select a project to view its compliance.</p>
      ) : (
        <div style={{ textAlign: 'left' }}>
          <h3>Project Q&A Compliance</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedProjectDetails.map((detail, index) => {
              const compliance = checkCompliance(detail.answer, detail.limit, detail.unit);
              return (
                <li key={index} style={{ marginBottom: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: compliance.compliance ? '#e6ffe6' : '#ffe6e6' }}>
                  <h4>Question: {detail.question}</h4>
                  <p>Answer: {detail.answer || 'No answer provided.'}</p>
                  <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
                    <strong>{detail.unit === 'character' ? 'Character' : 'Word'} Limit:</strong> {detail.limit === 0 ? 'N/A' : detail.limit} (Current: {compliance.count}) -
                    <span style={{ color: compliance.compliance ? 'green' : 'red', fontWeight: 'bold' }}>
                      {compliance.compliance ? ' Within Limit' : ' Exceeds Limit'}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;
