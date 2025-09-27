
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Merge = () => {
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignedQuestions = async () => {
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
                headers: { 'x-auth-token': token }
            };
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/questions/assigned`, config);
            setAssignedQuestions(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.msg : 'Failed to fetch assigned questions.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedQuestions();
    }, []);

    if (loading) return <p>Loading assigned questions...</p>;
    if (error) return <p>Error: {error}</p>;

    const updateQuestionStatus = async (questionId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            };
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/questions/${questionId}/assign`,
                { status: newStatus },
                config
            );
            // Re-fetch questions to update the UI
            fetchAssignedQuestions(); // Call the function defined in useEffect
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            alert(err.response ? err.response.data.msg : 'Failed to update question status.');
        }
    };

    return (
        <div>
            <h1 style={{ color: '#3e51b5' }}>Merge</h1>
            {assignedQuestions.length === 0 ? (
                <p>No questions assigned to you.</p>
            ) : (
                <ul>
                    {assignedQuestions.map(question => (
                        <li key={question.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                            <h3>Project: {question.project.name}</h3>
                            <p style={{ fontWeight: 'bold' }}>Question: {question.text}</p>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                <label htmlFor={`status-${question.id}`} style={{ marginRight: '10px' }}>Status:</label>
                                <select
                                    id={`status-${question.id}`}
                                    value={question.status}
                                    onChange={(e) => updateQuestionStatus(question.id, e.target.value)}
                                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="in-review">In Review</option>
                                </select>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Merge;
