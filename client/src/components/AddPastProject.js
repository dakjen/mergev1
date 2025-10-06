import React, { useState } from 'react';
import axios from 'axios';

const AddPastProject = ({ onProjectAdded }) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [qaPairs, setQaPairs] = useState([{ question: '', answer: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddQAPair = () => {
    setQaPairs([...qaPairs, { question: '', answer: '' }]);
  };

  const handleRemoveQAPair = (index) => {
    const newQaPairs = qaPairs.filter((_, i) => i !== index);
    setQaPairs(newQaPairs);
  };

  const handleQAChange = (index, field, value) => {
    const newQaPairs = qaPairs.map((qa, i) =>
      i === index ? { ...qa, [field]: value } : qa
    );
    setQaPairs(newQaPairs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      };

      const payload = {
        projectTitle,
        projectDescription,
        qaPairs: qaPairs.filter(qa => qa.question.trim() !== ''), // Only send non-empty Q&A
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/projects/manual-project`, payload, config);
      onProjectAdded(res.data.project);
      setProjectTitle('');
      setProjectDescription('');
      setQaPairs([{ question: '', answer: '' }]);
      alert('Project created successfully!');
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3>Add a Finished Project Manually</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="projectTitle" style={{ display: 'block', marginBottom: '5px' }}>Project Title:</label>
          <input
            type="text"
            id="projectTitle"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="projectDescription" style={{ display: 'block', marginBottom: '5px' }}>Project Description:</label>
          <textarea
            id="projectDescription"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows="4"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          ></textarea>
        </div>

        <h4>Questions and Answers</h4>
        {qaPairs.map((qa, index) => (
          <div key={index} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Question {index + 1}:</label>
            <textarea
              value={qa.question}
              onChange={(e) => handleQAChange(index, 'question', e.target.value)}
              rows="2"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
            ></textarea>
            <label style={{ display: 'block', marginBottom: '5px' }}>Answer {index + 1}:</label>
            <textarea
              value={qa.answer}
              onChange={(e) => handleQAChange(index, 'answer', e.target.value)}
              rows="4"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            ></textarea>
            {qaPairs.length > 1 && (
              <button type="button" onClick={() => handleRemoveQAPair(index)} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Remove Q&A
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddQAPair} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
          Add Q&A Pair
        </button>

        {error && <p style={{ color: 'red', marginTop: '20px' }}>Error: {error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
          {loading ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
};

export default AddPastProject;