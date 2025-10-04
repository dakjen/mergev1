import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Merge = () => {
    const { projectId } = useParams(); // Get projectId from URL parameters
    const [currentUser, setCurrentUser] = useState(null); // To store current user info
    // eslint-disable-next-line no-unused-vars
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectDeadlineDate, setNewProjectDeadlineDate] = useState('');
    const [newProjectThemeAngle, setNewProjectThemeAngle] = useState(''); // New state for theme/angle
    const [newProjectPartnership, setNewProjectPartnership] = useState(''); // New state for possible partnership
    const [newProjectQuestions, setNewProjectQuestions] = useState([]);
    const [showAddProjectForm, setShowAddProjectForm] = useState(false);
    const [companyUsers, setCompanyUsers] = useState([]); // New state for users in the company
    const [groupedQuestions, setGroupedQuestions] = useState({}); // New state for questions grouped by project
    const [expandedProjects, setExpandedProjects] = useState({}); // New state to manage expanded projects

    const fetchCompanyUsers = useCallback(async () => {
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
    }, []);

    const fetchAssignedQuestions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const config = {
                headers: { 'x-auth-token': token }
            };

            let res;
            if (projectId) {
                // Fetch a single project with all its questions
                res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}`, config);
                const project = res.data;
                setGroupedQuestions({ [project.id]: { project, questions: project.questions } });
            } else {
                // Fetch all projects where the user has assigned questions
                res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/with-assigned-questions`, config);
                const projects = res.data;
                const grouped = projects.reduce((acc, project) => {
                    acc[project.id] = { project, questions: project.questions };
                    return acc;
                }, {});
                setGroupedQuestions(grouped);
            }
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
        }
    }, [projectId]);



    const fetchCurrentUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth`, config); // Assuming /api/auth returns current user info
            setCurrentUser(res.data.user); // Assuming user object is nested under 'user'
        } catch (err) {
            console.error('Failed to fetch current user:', err.response ? err.response.data : err.message);
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
        fetchCompanyUsers();
    }, [fetchCurrentUser, fetchCompanyUsers]);

    useEffect(() => {
        if (currentUser) {
            fetchAssignedQuestions();
        }
    }, [currentUser, fetchAssignedQuestions]);


    const updateQuestionStatus = async (questionId, newStatus, newAnswer) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            };
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/projects/questions/${questionId}`,
                { status: newStatus, answer: newAnswer },
                config
            );
            // Re-fetch questions to update the UI
            fetchAssignedQuestions();
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            alert(err.response ? err.response.data.msg : 'Failed to update question.');
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

    const toggleProjectExpansion = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };


    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>


            {/* Assigned Questions Section - Project Centric */}
            <h2 style={{ color: '#3e51b5', marginTop: '40px' }}>Your Questions</h2>
            {Object.keys(groupedQuestions).length === 0 ? (
                <p>No questions assigned to you.</p>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {Object.values(groupedQuestions).map(projectGroup => (
                        <div key={projectGroup.project.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '8px', textAlign: 'left' }}>
                            <h2 onClick={() => toggleProjectExpansion(projectGroup.project.id)} style={{ cursor: 'pointer', color: '#3e51b5' }}>
                                {projectGroup.project.name} ({projectGroup.questions.length} questions) <span style={{ float: 'right' }}>{expandedProjects[projectGroup.project.id] ? '▲' : '▼'}</span>
                            </h2>
                            {/* Project Details */}
                            <div style={{ marginBottom: '15px', textAlign: 'left', fontSize: '0.9em' }}>
                                {projectGroup.project.description && <p><strong>Description:</strong> {projectGroup.project.description}</p>}
                                {projectGroup.project.details?.themeAngle && <p><strong>Theme/Angle:</strong> {projectGroup.project.details.themeAngle}</p>}
                                {projectGroup.project.details?.possiblePartnership && <p><strong>Possible Partnership:</strong> {projectGroup.project.details.possiblePartnership}</p>}
                                {projectGroup.project.deadlineDate && <p><strong>Due Date:</strong> {new Date(projectGroup.project.deadlineDate).toLocaleDateString()}</p>}
                            </div>
                            {/* Progress Bar */}
                            <div>
                                {(() => {
                                    const submittedCount = projectGroup.questions.filter(q => q.status === 'submitted').length;
                                    const totalCount = projectGroup.questions.length;
                                    const progress = totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;
                                    return (
                                        <div style={{ marginBottom: '10px' }}>
                                            <p style={{ margin: '0 0 5px 0' }}>{submittedCount} of {totalCount} questions submitted</p>
                                            <div style={{ border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
                                                <div style={{ width: `${progress}%`, backgroundColor: '#007bff', height: '20px', textAlign: 'center', color: 'white', lineHeight: '20px' }}>
                                                    {Math.round(progress)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            {expandedProjects[projectGroup.project.id] && (
                                <ul>
                                    {projectGroup.questions.filter(question => question.assignedToId === currentUser.id).map(question => (
                                        <li key={question.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                                            <p style={{ fontWeight: 'bold' }}>Question: {question.text}</p>

                                            {/* Answer Input */}
                                            <div style={{ marginBottom: '10px' }}>
                                                <label htmlFor={`answer-${question.id}`} style={{ display: 'block', marginBottom: '5px' }}>Your Answer:</label>
                                                <textarea
                                                    id={`answer-${question.id}`}
                                                    value={question.answer || ''}
                                                    onChange={(e) => {
                                                        // Update local state for answer
                                                        const updatedGrouped = { ...groupedQuestions };
                                                        const qIndex = updatedGrouped[projectGroup.project.id].questions.findIndex(q => q.id === question.id);
                                                        if (qIndex !== -1) {
                                                            updatedGrouped[projectGroup.project.id].questions[qIndex].answer = e.target.value;
                                                            setGroupedQuestions(updatedGrouped);
                                                        }
                                                    }}
                                                    rows="4"
                                                    style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                                                ></textarea>
                                                <button onClick={() => updateQuestionStatus(question.id, question.status, question.answer)} style={{ marginTop: '5px', padding: '8px 15px', backgroundColor: '#476c2e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Answer</button>
                                                <button onClick={() => updateQuestionStatus(question.id, 'submitted', question.answer)} style={{ marginTop: '5px', marginLeft: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Submit</button>
                                            </div>

                                            {/* Status Dropdown */}
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                                <label htmlFor={`status-${question.id}`} style={{ marginRight: '10px' }}>Status:</label>
                                                <select
                                                    id={`status-${question.id}`}
                                                    value={question.status}
                                                    onChange={(e) => updateQuestionStatus(question.id, e.target.value, question.answer)}
                                                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="in-review">In Review</option>
                                                </select>
                                            </div>

                                            {/* Re-assign Dropdown (Admin/Approver only) */}
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                                <label htmlFor={`reassign-${question.id}`} style={{ marginRight: '10px' }}>Re-assign To:</label>
                                                <select
                                                    id={`reassign-${question.id}`}
                                                    value={question.assignedToId || ''}
                                                    // onChange={(e) => updateQuestionStatus(question.id, question.status, question.answer, e.target.value || null)} // Temporarily disabled
                                                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {companyUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name || u.username}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Assignment Log */}
                                            {question.assignmentLogs && question.assignmentLogs.length > 0 && (
                                                <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                    <h4 style={{ marginBottom: '5px' }}>Assignment History:</h4>
                                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9em' }}>
                                                        {question.assignmentLogs.map((log, logIndex) => (
                                                            <li key={logIndex} style={{ marginBottom: '3px' }}>
                                                                {log.assignedBy?.username || 'System'} assigned this question to {log.assignedTo?.username || 'N/A'}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* Merge Button */}
                            {(() => {
                                const allQuestionsSubmitted = projectGroup.questions.every(q => q.status === 'submitted');
                                return (
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('token');
                                                const config = { headers: { 'x-auth-token': token } };
                                                await axios.post(`${process.env.REACT_APP_API_URL}/api/projects/${projectGroup.project.id}/compile`, {}, config);
                                                alert('Project merged successfully! A narrative has been created.');
                                            } catch (err) {
                                                console.error(err.response ? err.response.data : err.message);
                                                alert('Failed to merge project.');
                                            }
                                        }}
                                        style={{
                                            marginTop: '10px',
                                            padding: '10px 20px',
                                            backgroundColor: allQuestionsSubmitted ? '#28a745' : '#6c757d', // Green when active, grey when disabled
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: allQuestionsSubmitted ? 'pointer' : 'not-allowed'
                                        }}
                                        disabled={!allQuestionsSubmitted}
                                    >
                                        Merge
                                    </button>
                                );
                            })()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Merge;