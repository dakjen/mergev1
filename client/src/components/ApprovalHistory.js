import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ApprovalHistory = () => {
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApprovalHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in as an admin.');
          setLoading(false);
          return;
        }
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        const res = await axios.get('http://localhost:8000/api/admin/approvals/history', config);
        setApprovalLogs(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.msg : 'Failed to fetch approval history.');
        setLoading(false);
      }
    };
    fetchApprovalHistory();
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading approval history...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '0 20px' }}>
        <button onClick={() => navigate('/admin')} style={{ marginRight: '20px', padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back</button>
        <h1>Approval History</h1>
      </div>
      {approvalLogs.length === 0 ? (
        <p>No approval records found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {approvalLogs.map(log => (
            <li key={log.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '800px', textAlign: 'left' }}>
              <p><strong>Approved User:</strong> {log.approvedUser.username} ({log.approvedUser.email})</p>
              <p><strong>Approved By:</strong> {log.approvedBy.username} ({log.approvedBy.email})</p>
              <p><strong>Role Assigned:</strong> {log.roleAssigned}</p>
              <p><strong>Company Assigned:</strong> {log.companyAssigned?.name || 'N/A'}</p>
              <p><strong>Approved At:</strong> {new Date(log.approvedAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApprovalHistory;
