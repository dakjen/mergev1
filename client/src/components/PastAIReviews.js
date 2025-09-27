import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PastAIReviews.css';

const PastAIReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPastReviews();
  }, []);

  const fetchPastReviews = async () => {
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

      {reviews.length === 0 ? (
        <p className="no-reviews">No past AI reviews found.</p>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <Link key={review.id} to={`/tools/ai-reviewer/past-reviews/${review.id}`} className="review-button-link">
                <button className="review-button">
                    <span className="project-name">{review.project.name}</span>
                    <span className="review-date">{new Date(review.reviewedAt).toLocaleDateString()}</span>
                    <span className="reviewer-name">{review.reviewedBy.username}</span>
                </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastAIReviews;