
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { marked } from 'marked';

const AIReviewDetail = () => {
    const { id } = useParams();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: {
                        'x-auth-token': token
                    }
                };

                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ai/reviews/${id}`, config);
                setReview(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response ? err.response.data.msg : 'Failed to fetch review.');
                setLoading(false);
            }
        };

        fetchReview();
    }, [id]);

    if (loading) {
        return <p>Loading review...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!review) {
        return <p>Review not found.</p>;
    }

    return (
        <div className="review-card">
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
        </div>
    );
};

export default AIReviewDetail;
