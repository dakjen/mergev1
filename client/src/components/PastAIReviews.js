import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked'; // For rendering markdown response

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
      const res = await axios.get('http://localhost:8000/api/ai/reviews', config); // New API endpoint
      setReviews(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch past AI reviews.');
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading past reviews...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Past AI Reviews</h2>

      {reviews.length === 0 ? (
        <p>No past AI reviews found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reviews.map(review => (
            <li key={review.id} style={{ marginBottom: '30px', border: '1px solid #eee', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
              <h3>Project: {review.project.name}</h3>
              <p><strong>Reviewed By:</strong> {review.reviewedBy.username}</p>
              <p><strong>Reviewed At:</strong> {new Date(review.reviewedAt).toLocaleString()}</p>
              {review.grantWebsite && <p><strong>Grant Website:</strong> <a href={review.grantWebsite} target="_blank" rel="noopener noreferrer">{review.grantWebsite}</a></p>}
              {review.grantPurposeStatement && <p><strong>Grant Purpose Statement:</strong> {review.grantPurposeStatement}</p>}
              <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h4>AI Response:</h4>
                <div dangerouslySetInnerHTML={{ __html: marked.parse(review.aiResponse) }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PastAIReviews;
