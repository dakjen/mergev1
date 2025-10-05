import React, { useState } from 'react';
import axios from 'axios';

const AddPastProject = ({ onProjectAdded }) => {
  const [pastedContent, setPastedContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);

  const handleParseAndAdd = async () => {
    setIsParsing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/projects/parse-pasted-text`, { content: pastedContent }, config);
      onProjectAdded(res.data.project);
      setPastedContent('');
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.msg : 'Failed to parse and add project.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div>
      <h3>Add a Finished Project</h3>
      <p>Paste the content of the project below. The first line will be the title, and the rest will be the description.</p>
      <textarea
        rows="10"
        cols="80"
        value={pastedContent}
        onChange={(e) => setPastedContent(e.target.value)}
        placeholder="Paste project content here..."
      />
      <br />
      <button onClick={handleParseAndAdd} disabled={isParsing}>
        {isParsing ? 'Parsing...' : 'Parse and Add Project'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddPastProject;