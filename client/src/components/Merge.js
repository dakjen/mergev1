import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Merge = () => {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: {
                        'x-auth-token': token
                    }
                };

                const [projectsRes, usersRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/projects`, config),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/users`, config)
                ]);

                setProjects(projectsRes.data);
                setUsers(usersRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response ? err.response.data.msg : 'Failed to fetch data.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            <h1>Merge Tool</h1>
            <div style={{ display: 'flex' }}>
                <div style={{ width: '30%', borderRight: '1px solid #ccc', paddingRight: '20px' }}>
                    <h2>Projects</h2>
                    <ul>
                        {projects.map(project => (
                            <li key={project.id} onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer' }}>
                                {project.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ width: '70%', paddingLeft: '20px' }}>
                    {selectedProject ? (
                        <div>
                            <h2>{selectedProject.name}</h2>
                            <p>{selectedProject.description}</p>
                            <h3>Assign Questions to Users</h3>
                            <ul>
                                {users.map(user => (
                                    <li key={user.id}>{user.username}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>Select a project to view details.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Merge;