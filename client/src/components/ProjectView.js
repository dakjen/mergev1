import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Stop words to exclude from keywords
const stopWords = ['the', 'and', 'for', 'with', 'our', 'individuals', 'through', 'communities', 'that', 'this', 'from', 'are', 'was', 'but', 'not', 'you', 'your', 'have', 'has'];

const getKeywords = (project, topN = 5) => {
  if (!project) return [];

  // Combine description + answers into one string
  let text = project.description || '';
  if (project.questions && project.questions.length > 0) {
    project.questions.forEach(d => {
      text += ' ' + d.answer;
    });
  }

  // Split text into words, lowercase, remove short words and stopwords
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2 && !stopWords.includes(w));

  // Count word frequencies
  const freq = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  // Keep only words that occur at least 3 times
  const filtered = Object.entries(freq).filter(([word, count]) => count >= 3);

  // Sort by frequency descending
  const sorted = filtered.sort((a, b) => b[1] - a[1]);

  // Return only the words, up to topN
  return sorted.slice(0, topN).map(([word]) => word);
};


const ProjectView = ({ project, onBack, darkMode }) => { // Accept project, onBack, and darkMode props
  console.log("ProjectView received project:", project); // Add logging

  const [projectVersions, setProjectVersions] = useState([]); // New state for project versions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    const fetchProjectVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }
        const config = { headers: { 'x-auth-token': token } };
        
        const versionsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${project.id}/versions`, config);

        setProjectVersions(versionsRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.msg : 'Failed to fetch project versions.');
        setLoading(false);
      }
    };
    if (project) {
        fetchProjectVersions();
    }
  }, [project]);

  useEffect(() => {
    if (project) {
      const topKeywords = getKeywords(project, 5);
      setKeywords(topKeywords);
    }
  }, [project]);

  if (!project) return null;
  if (loading) return <p style={{ textAlign: 'center' }}>Loading project...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div className={darkMode ? 'dark-mode-container' : ''} // Apply class conditionally
         style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}> {/* Removed background: '#f9f9f9' */}
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: darkMode ? '#e0e0e0' : '#333' }}>{project.name}</h2>
      
      {project.description && (
        <div style={{ marginBottom: '20px', padding: '15px', background: darkMode ? '#2a2a2a' : '#fff', borderRadius: '5px', borderLeft: '5px solid #7fab61' }}> {/* Conditional background */}
          <h3 style={{ margin: '0 0 10px 0', color: darkMode ? '#e0e0e0' : '#555' }}>Description:</h3> {/* Conditional color */}
          <p style={{ margin: '0', color: darkMode ? '#e0e0e0' : '#1e1e1e' }}>{project.description}</p> {/* Conditional color */}
        </div>
      )}

      {keywords.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', background: darkMode ? '#2a2a2a' : '#e9ecef', borderRadius: '5px' }}> {/* Conditional background */}
          <strong>Keywords:</strong> {keywords.join(', ')}
        </div>
      )}

      {project.questions && project.questions.length > 0 && (
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h3>Project Details:</h3>
          {project.questions.map((detail, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '15px',
              background: darkMode ? '#2a2a2a' : '#fff', // Conditional background
              borderRadius: '5px',
              border: darkMode ? '1px solid #555' : '1px solid #eee', // Conditional border
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: darkMode ? '#fffcf0' : '#3e51b6' }}>Q: {detail.text}</p> {/* Conditional color */}
              <p style={{ margin: '0', color: darkMode ? '#e0e0e0' : '#1e1e1e', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>A: {detail.answer}</p> {/* Conditional color */}
            </div>
          ))}
        </div>
      )}

      <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: darkMode ? '#6c757d' : '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>Back to Projects</button>

      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <h3>Project Versions</h3>
        {projectVersions.length === 0 ? (
          <p>No versions found for this project.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {projectVersions.map(version => (
              <li key={version.id} style={{ marginBottom: '10px', padding: '10px', background: darkMode ? '#2a2a2a' : '#fff', borderRadius: '5px', border: darkMode ? '1px solid #555' : '1px solid #eee' }}>
                <p><strong>Version:</strong> {version.versionNumber}</p>
                <p><strong>Created By:</strong> {version.createdBy.username}</p>
                <p><strong>Created At:</strong> {new Date(version.createdAt).toLocaleString()}</p>
                <button onClick={() => console.log('Version Snapshot:', version.snapshot)} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>View Snapshot</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectView;