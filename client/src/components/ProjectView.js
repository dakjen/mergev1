import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';



// Stop words to exclude from keywords
const stopWords = ['the', 'and', 'for', 'with', 'our', 'individuals', 'through', 'communities', 'that', 'this', 'from', 'are', 'was', 'but', 'not', 'you', 'your', 'have', 'has'];

const getKeywords = (project, topN = 5) => {
  if (!project) return [];

  // Combine description + answers into one string
  let text = project.description || '';
  if (project.details && project.details.length > 0) {
    project.details.forEach(d => {
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


const ProjectView = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keywords, setKeywords] = useState([]);
const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
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
        const res = await axios.get(`http://localhost:8000/api/projects/${id}`, config);
        setProject(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.msg : 'Failed to fetch project.');
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project) {
      const topKeywords = getKeywords(project, 5);
      setKeywords(topKeywords);
    }
  }, [project]);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading project...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;
  if (!project) return <p style={{ textAlign: 'center' }}>Project not found.</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>{project.name}</h2>
      
      {project.description && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '5px', borderLeft: '5px solid #7fab61' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Description:</h3>
          <p>{project.description}</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '5px' }}>
          <strong>Keywords:</strong> {keywords.join(', ')}
        </div>
      )}

      {project.details && project.details.length > 0 && (
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>Project Details:</h3>
          {project.details.map((detail, index) => (
            <div key={index} style={{ 
              marginBottom: '15px', 
              padding: '15px', 
              background: '#fff', 
              borderRadius: '5px', 
              border: '1px solid #eee', 
              wordWrap: 'break-word', 
              overflowWrap: 'break-word' 
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#3e51b6' }}>Q: {detail.question}</p>
              <p style={{ margin: '0', color: '#1e1e1e', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>A: {detail.answer}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>Back to Projects</button>
    </div>
  );
};

export default ProjectView;
