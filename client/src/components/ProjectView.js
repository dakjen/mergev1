import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
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

      {project.details && project.details.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#555', textAlign: 'center' }}>Project Details:</h3>
          {project.details.map((detail, index) => (
            <div key={index} style={{ marginBottom: '15px', padding: '15px', background: '#fff', borderRadius: '5px', border: '1px solid #eee' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>Q: {detail.question}</p>
              <p style={{ margin: '0', color: '#666' }}>A: {detail.answer}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>Back to Projects</button>
    </div>
  );
};

export default ProjectView;