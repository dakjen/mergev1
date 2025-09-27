
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PastAIReviews.css';

const PastAIReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      const [reviewsRes, projectsRes, usersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/ai/reviews`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/projects`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/users`, config)
      ]);
      setReviews(reviewsRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredReviews();
  }, [selectedProject, selectedReviewer, sortBy]);

  const fetchFilteredReviews = async () => {
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
        withCredentials: true,
        params: {
          projectId: selectedProject,
          reviewedById: selectedReviewer,
          sortBy: sortBy
        }
      };
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ai/reviews`, config);
      setReviews(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch past AI reviews.');
      setLoading(false);
    }
  };

  if (loading) return <p className="loading-message">Loading past reviews...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="past-reviews-container">
      <h2>Past AI Reviews</h2>
      <div className="filters">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <select value={selectedReviewer} onChange={(e) => setSelectedReviewer(e.target.value)}>
          <option value="">All Reviewers</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="dueDate_asc">Due Date (Soonest)</option>
          <option value="dueDate_desc">Due Date (Latest)</option>
        </select>
      </div>

      {reviews.length === 0 ? (
        <p className="no-reviews">No past AI reviews found.</p>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <Link key={review.id} to={`/tools/ai-reviewer/past-reviews/${review.id}`} className="review-button-link">
                <button className="review-button">
                    <span className="project-name">{review.project.name}</span>
                    <span className="review-date">{new Date(review.reviewedAt).toLocaleDateString()}</span>
                    {review.project.deadlineDate && <span className="due-date">Due: {new Date(review.project.deadlineDate).toLocaleDateString()}</span>}
                    <span className="reviewer-name">{review.reviewedBy.username}</span>
                </button>
            </Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/tools/ai-reviewer/archived-reviews" className="archived-link">Archived</Link>
      </div>
    </div>
  );
};

export default PastAIReviews;
