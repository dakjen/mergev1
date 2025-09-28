import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const ToBeApproved = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [rejectionComments, setRejectionComments] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/pending-approval`, config);
      setPendingApprovals(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch pending approvals.');
      setLoading(false);
    }
  };

  const handleApprove = async (projectId) => {
    const onConfirm = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
          withCredentials: true
        };
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/projects/${projectId}/respond-approval`,
          { approvalStatus: 'approved' },
          config
        );
        alert('Project approved successfully!');
        fetchPendingApprovals(); // Refresh the list
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        alert(err.response ? err.response.data.msg : 'Failed to approve project.');
      }
      setModalState({ ...modalState, isOpen: false });
    };

    setModalState({
      isOpen: true,
      title: 'Approve Project',
      message: 'Are you sure you want to approve this project?',
      onConfirm,
    });
  };

  const handleRejectClick = (projectId) => {
    setCurrentProjectId(projectId);
    setShowCommentsModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionComments.trim()) {
      alert('Please provide comments for rejection.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/projects/${currentProjectId}/respond-approval`,
        { approvalStatus: 'rejected', comments: rejectionComments.trim() },
        config
      );
      alert('Project rejected successfully!');
      setShowCommentsModal(false);
      setRejectionComments('');
      setCurrentProjectId(null);
      fetchPendingApprovals(); // Refresh the list
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to reject project.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading pending approvals...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
      />
      <h2>Projects To Be Approved</h2>

      {pendingApprovals.length === 0 ? (
        <p>No projects currently awaiting your approval.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingApprovals.map(approval => (
            <li key={approval.id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
              <h3>Project: {approval.project.name}</h3>
              <p><strong>Description:</strong> {approval.project.description}</p>
              <p><strong>Requested By:</strong> {approval.requestedBy.username}</p>
              <p><strong>Requested At:</strong> {new Date(approval.requestedAt).toLocaleString()}</p>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button onClick={() => handleApprove(approval.projectId)} style={{ padding: '8px 15px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Approve
                </button>
                <button onClick={() => handleRejectClick(approval.projectId)} style={{ padding: '8px 15px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Rejection Comments Modal */}
      {showCommentsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <h3>Enter Rejection Comments</h3>
            <textarea
              placeholder="Provide comments for rejecting this project..."
              value={rejectionComments}
              onChange={(e) => setRejectionComments(e.target.value)}
              rows="5"
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical', marginBottom: '15px' }}
            ></textarea>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleRejectSubmit} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Submit Rejection
              </button>
              <button onClick={() => setShowCommentsModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToBeApproved;