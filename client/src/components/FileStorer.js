import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileStorer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFilename, setNewFilename] = useState(''); // New state for user-provided filename
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
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
        headers: {
          'x-auth-token': token
        },
        withCredentials: true
      };
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files`, config);
      setFiles(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to fetch files.');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    // Optionally pre-fill newFilename with original filename
    if (e.target.files[0]) {
      setNewFilename(e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!newFilename.trim()) { // Ensure filename is not just whitespace
      alert('Please enter a filename.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('newFilename', newFilename.trim()); // Send the new filename

      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data' // Important for file uploads
        },
        withCredentials: true
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/files/upload`, formData, config);
      alert('File uploaded successfully!');
      setSelectedFile(null); // Clear selected file
      setNewFilename(''); // Clear new filename
      fetchFiles(); // Refresh the list of files
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to upload file.');
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        },
        withCredentials: true,
        responseType: 'blob' // Important for downloading binary data
      };

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${fileId}`, config);

      // Create a blob from the response data
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // Use original filename
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert(err.response ? err.response.data.msg : 'Failed to download file.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading files...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>File Storer for Company Documents</h2>

      {/* File Upload Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Upload New File</h3>
        <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
        <input // New input for user-provided filename
          type="text"
          placeholder="Enter new filename (e.g., MyDocument.pdf)"
          value={newFilename}
          onChange={(e) => setNewFilename(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', width: 'calc(100% - 16px)' }}
        />
        <button onClick={handleUpload} disabled={!selectedFile || !newFilename.trim()} style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Upload File
        </button>
      </div>

      {/* List of Uploaded Files */}
      <div>
        <h3>Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {files.map(file => (
              <li key={file.id} style={{ background: '#f4f4f4', margin: '10px auto', padding: '10px', borderRadius: '5px', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{file.filename} (Uploaded by: {file.uploadedBy.username} on {new Date(file.createdAt).toLocaleDateString()})</span>
                <div>
                  <button onClick={() => handleDownload(file.id, file.filename)} style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileStorer;