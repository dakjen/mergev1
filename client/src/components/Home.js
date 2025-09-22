import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Welcome to merge</h2>
      <p>Please register or log in to continue.</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/register" style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#3e51b5', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Register</Link>
        <Link to="/login" style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#7fab61', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Login</Link>
      </div>
    </div>
  );
};

export default Home;
