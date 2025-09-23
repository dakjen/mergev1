import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import './ProjectView.css';



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
    <div className="project-view-container ProjectView">
      <h2>{project.name}</h2>
      
      {project.description && (
        <div className="project-view-description">
          <h3>Description:</h3>
          <p>{project.description}</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="project-view-keywords">
          <strong>Keywords:</strong> {keywords.join(', ')}
        </div>
      )}

      {project.details && project.details.length > 0 && (
        <div className="project-view-details">
          <h3>Project Details:</h3>
          {project.details.map((detail, index) => (
            <div key={index} className="project-view-detail">
              <p>Q: {detail.question}</p>
              <div dangerouslySetInnerHTML={{ __html: marked.parse(detail.answer) }} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="project-view-back-button">Back to Projects</button>
    </div>
  );
};

export default ProjectView;
