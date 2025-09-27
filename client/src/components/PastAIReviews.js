import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
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
        <ul className="reviews-list">
          {reviews.map(review => (
            <li key={review.id} className="review-card">
              <h3>{review.project.name}</h3>
              <p><strong>Reviewed By:</strong> {review.reviewedBy.username}</p>
              <p><strong>Reviewed At:</strong> {new Date(review.reviewedAt).toLocaleString()}</p>
              {review.grantWebsite && (
                <p>
                  <strong>Grant Website:</strong>{' '}
                  <a href={review.grantWebsite} target="_blank" rel="noopener noreferrer">
                    {review.grantWebsite}
                  </a>
                </p>
              )}
              {review.grantPurposeStatement && <p><strong>Grant Purpose Statement:</strong> {review.grantPurposeStatement}</p>}
              <div className="ai-response">
                <h4>AI Response:</h4>
                <div className="ai-response-content" dangerouslySetInnerHTML={{ __html: marked.parse(review.aiResponse) }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PastAIReviews;
