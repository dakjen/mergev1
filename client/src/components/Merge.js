
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Merge = () => {
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectDeadlineDate, setNewProjectDeadlineDate] = useState('');
    const [newProjectThemeAngle, setNewProjectThemeAngle] = useState(''); // New state for theme/angle
    const [newProjectPartnership, setNewProjectPartnership] = useState(''); // New state for possible partnership
    const [newProjectQuestions, setNewProjectQuestions] = useState([]);
    const [showAddProjectForm, setShowAddProjectForm] = useState(false);
    const [companyUsers, setCompanyUsers] = useState([]); // New state for users in the company

    const fetchCompanyUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, config);
            setCompanyUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch company users:', err.response ? err.response.data : err.message);
        }
    };

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
        fetchCompanyUsers(); // Fetch company users when component mounts
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

    const addProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            };
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/projects`,
                { 
                    name: newProjectName, 
                    description: newProjectDescription, 
                    deadlineDate: newProjectDeadlineDate, 
                    details: { themeAngle: newProjectThemeAngle, possiblePartnership: newProjectPartnership }, // Store theme/angle and partnership in details
                    questions: newProjectQuestions 
                },
                config
            );
            setNewProjectName('');
            setNewProjectDescription('');
            setNewProjectDeadlineDate('');
            setNewProjectThemeAngle('');
            setNewProjectPartnership(''); // Clear possible partnership
            setNewProjectQuestions([]);
            setShowAddProjectForm(false);
            // After creating a project, we might want to refresh assigned questions if any were assigned to the current user
            fetchAssignedQuestions(); 
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            alert(err.response ? err.response.data.msg : 'Failed to add project.');
        }
    };

    if (loading) return <p>Loading assigned questions...</p>;

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
                <h2>Project Management</h2>
                <button onClick={() => {
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectDeadlineDate('');
                    setNewProjectQuestions([]);
                    setShowAddProjectForm(true);
                }} style={{ padding: '10px 20px', backgroundColor: '#6200EE', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Create New Project
                </button>

                {showAddProjectForm && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h3>Create New Project</h3>
                        <form onSubmit={addProject} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Project Name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                required
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                            <textarea
                                placeholder="Project Description (Optional)"
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                rows="3"
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                            ></textarea>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Theme or Angle (Optional)"
                                    value={newProjectThemeAngle}
                                    onChange={(e) => setNewProjectThemeAngle(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', flex: 1 }}
                                />
                                <input
                                    type="text"
                                    placeholder="Possible Partnership (Optional)"
                                    value={newProjectPartnership}
                                    onChange={(e) => setNewProjectPartnership(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', flex: 1 }}
                                />
                            </div>
                            <label htmlFor="newProjectDeadlineDate" style={{ textAlign: 'left', marginBottom: '-5px' }}>Due Date:</label>
                            <input
                                type="date"
                                id="newProjectDeadlineDate"
                                value={newProjectDeadlineDate}
                                onChange={(e) => setNewProjectDeadlineDate(e.target.value)}
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />

                            {/* Questions for New Project */}
                            <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <h4>Questions (Optional)</h4>
                                {newProjectQuestions.map((q, index) => (
                                    <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                                        <textarea
                                            placeholder="Question text"
                                            value={q.text}
                                            onChange={(e) => {
                                                const updatedQuestions = [...newProjectQuestions];
                                                updatedQuestions[index].text = e.target.value;
                                                setNewProjectQuestions(updatedQuestions);
                                            }}
                                            rows="2"
                                            style={{ width: '100%', marginBottom: '5px' }}
                                        ></textarea>
                                        {/* Assigned To Dropdown for New Project Questions */}
                                        <div style={{ marginBottom: '10px' }}>
                                            <label htmlFor={`new-question-assignedTo-${index}`} style={{ marginRight: '5px' }}>Assign To:</label>
                                            <select
                                                id={`new-question-assignedTo-${index}`}
                                                value={q.assignedToId || ''}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...newProjectQuestions];
                                                    updatedQuestions[index].assignedToId = e.target.value || null;
                                                    setNewProjectQuestions(updatedQuestions);
                                                }}
                                                style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc' }}
                                            >
                                                <option value="">Unassigned</option>
                                                {companyUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name || u.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedQuestions = newProjectQuestions.filter((_, i) => i !== index);
                                                setNewProjectQuestions(updatedQuestions);
                                            }}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px' }}
                                        >Remove Question</button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setNewProjectQuestions([...newProjectQuestions, { text: '', assignedToId: null, status: 'pending' }])}
                                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px', marginTop: '10px' }}
                                >Add Question</button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Project</button>
                                <button type="button" onClick={() => setShowAddProjectForm(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <h1 style={{ color: '#3e51b5' }}>Assigned Questions</h1>
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
