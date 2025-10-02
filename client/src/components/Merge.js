
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Merge = () => {
    const { projectId } = useParams(); // Get projectId from URL parameters
    const [hasSubmitted, setHasSubmitted] = useState(false); // New state to track if user has submitted questions
    const [projectSummary, setProjectSummary] = useState(null); // New state for project summary data
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
        if (!projectId || !currentUser) return; // Only fetch if projectId and currentUser are available
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const config = {
                headers: { 'x-auth-token': token }
            };
            // Fetch only questions assigned to the current user for the specific project
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/questions/assigned-to-me`, config);
            setAssignedQuestions(res.data);

            // Group questions by project (though here it will be just one project)
            const grouped = res.data.reduce((acc, question) => {
                const projId = question.project.id;
                if (!acc[projId]) {
                    acc[projId] = { project: question.project, questions: [] };
                }
                acc[projId].questions.push(question);
                return acc;
            }, {});
            setGroupedQuestions(grouped);

        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
        }
    };

    const fetchProjectSummary = async () => {
        if (!projectId) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/summary`, config);
            setProjectSummary(res.data);
            // Check if current user has submitted all their questions
            const userSummary = res.data.userCompletion.find(uc => uc.id === currentUser?.id);
            if (userSummary && userSummary.notCompleted === 0 && userSummary.totalAssigned > 0) {
                setHasSubmitted(true);
            } else {
                setHasSubmitted(false);
            }
        } catch (err) {
            console.error('Failed to fetch project summary:', err.response ? err.response.data : err.message);
        }
    };

    const fetchCurrentUser = async () => {
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
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchCompanyUsers();
        // Only fetch assigned questions and summary if projectId and currentUser are available
        if (projectId && currentUser) {
            fetchAssignedQuestions();
            fetchProjectSummary();
        }
    }, [projectId, currentUser?.id]); // Re-run when projectId or currentUser changes


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
            // Re-fetch questions and summary to update the UI
            fetchAssignedQuestions();
            fetchProjectSummary();
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
            <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
                <h2>Start a New Project</h2>
                <button onClick={() => {
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectDeadlineDate('');
                    setNewProjectThemeAngle('');
                    setNewProjectPartnership('');
                    setNewProjectQuestions([]);
                    setShowAddProjectForm(true);
                }} style={{ padding: '10px 20px', backgroundColor: '#476c2e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Create New Project


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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewProjectQuestions([...newProjectQuestions, { text: '', assignedToId: null, maxLimit: 0, limitUnit: 'characters' }]);
                                    }}
                                    style={{ marginBottom: '10px' }}
                                >Add Question</button>
                                {newProjectQuestions.map((q, index) => (
                                    <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            {/* Assigned To Dropdown for New Project Questions */}
                                            <div>
                                                <label htmlFor={`new-question-assignedTo-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Assign To:</label>
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
                                            <div style={{ flexGrow: 1 }}>
                                                <label htmlFor={`question-text-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Question:</label>
                                                <textarea
                                                    id={`question-text-${index}`}
                                                    placeholder="Question text"
                                                    value={q.text}
                                                    onChange={(e) => {
                                                        const updatedQuestions = [...newProjectQuestions];
                                                        updatedQuestions[index].text = e.target.value;
                                                        setNewProjectQuestions(updatedQuestions);
                                                    }}
                                                    rows="2"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px' }}>Limit:</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={q.maxLimit}
                                                        onChange={(e) => {
                                                            const updatedQuestions = [...newProjectQuestions];
                                                            updatedQuestions[index].maxLimit = e.target.value;
                                                            setNewProjectQuestions(updatedQuestions);
                                                        }}
                                                        style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc', width: '80px' }}
                                                    />
                                                    <select
                                                        value={q.limitUnit}
                                                        onChange={(e) => {
                                                            const updatedQuestions = [...newProjectQuestions];
                                                            updatedQuestions[index].limitUnit = e.target.value;
                                                            setNewProjectQuestions(updatedQuestions);
                                                        }}
                                                        style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="characters">characters</option>
                                                        <option value="words">words</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedQuestions = newProjectQuestions.filter((_, i) => i !== index);
                                                setNewProjectQuestions(updatedQuestions);
                                            }}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px', marginTop: '5px' }}
                                        >Remove Question</button>
                                    </div>
                                ))}}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Project</button>
                                <button type="button" onClick={() => setShowAddProjectForm(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

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
                            {expandedProjects[projectGroup.project.id] && (
                                <ul>
                                    {projectGroup.questions.map(question => (
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
                                            </div>

                                            {/* Status Dropdown */}
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                                <label htmlFor={`status-${question.id}`} style={{ marginRight: '10px' }}>Status:</label>
                                                <select
                                                    id={`status-${question.id}`}
                                                    value={question.status}
                                                    onChange={(e) => updateQuestionStatus(question.id, e.target.value, question.answer, question.assignedToId)}
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
                                                    onChange={(e) => updateQuestionStatus(question.id, question.status, question.answer, e.target.value || null)}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Merge;


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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewProjectQuestions([...newProjectQuestions, { text: '', assignedToId: null, maxLimit: 0, limitUnit: 'characters' }]);
                                    }}
                                    style={{ marginBottom: '10px' }}
                                >Add Question</button>
                                {newProjectQuestions.map((q, index) => (
                                    <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            {/* Assigned To Dropdown for New Project Questions */}
                                            <div>
                                                <label htmlFor={`new-question-assignedTo-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Assign To:</label>
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
                                            <div style={{ flexGrow: 1 }}>
                                                <label htmlFor={`question-text-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Question:</label>
                                                <textarea
                                                    id={`question-text-${index}`}
                                                    placeholder="Question text"
                                                    value={q.text}
                                                    onChange={(e) => {
                                                        const updatedQuestions = [...newProjectQuestions];
                                                        updatedQuestions[index].text = e.target.value;
                                                        setNewProjectQuestions(updatedQuestions);
                                                    }}
                                                    rows="2"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px' }}>Limit:</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={q.maxLimit}
                                                        onChange={(e) => {
                                                            const updatedQuestions = [...newProjectQuestions];
                                                            updatedQuestions[index].maxLimit = e.target.value;
                                                            setNewProjectQuestions(updatedQuestions);
                                                        }}
                                                        style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc', width: '80px' }}
                                                    />
                                                    <select
                                                        value={q.limitUnit}
                                                        onChange={(e) => {
                                                            const updatedQuestions = [...newProjectQuestions];
                                                            updatedQuestions[index].limitUnit = e.target.value;
                                                            setNewProjectQuestions(updatedQuestions);
                                                        }}
                                                        style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="characters">characters</option>
                                                        <option value="words">words</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedQuestions = newProjectQuestions.filter((_, i) => i !== index);
                                                setNewProjectQuestions(updatedQuestions);
                                            }}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 10px', marginTop: '5px' }}
                                        >Remove Question</button>
                                    </div>
                                ))}}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Project</button>
                                <button type="button" onClick={() => setShowAddProjectForm(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

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
                            {expandedProjects[projectGroup.project.id] && (
                                <ul>
                                    {projectGroup.questions.map(question => (
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
                                                <button onClick={() => updateQuestionStatus(question.id, question.status, question.answer, question.assignedToId)} style={{ marginTop: '5px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Answer</button>
                                            </div>

                                            {/* Status Dropdown */}
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                                <label htmlFor={`status-${question.id}`} style={{ marginRight: '10px' }}>Status:</label>
                                                <select
                                                    id={`status-${question.id}`}
                                                    value={question.status}
                                                    onChange={(e) => updateQuestionStatus(question.id, e.target.value, question.answer, question.assignedToId)}
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
                                                    onChange={(e) => updateQuestionStatus(question.id, question.status, question.answer, e.target.value || null)}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Merge;
