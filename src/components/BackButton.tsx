import React from 'react';
import { useNavigate } from 'react-router-dom';

const btnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 24,
  right: 32,
  zIndex: 100,
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 20px',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button style={btnStyle} onClick={() => navigate(-1)}>
      <span role="img" aria-label="back">⬅️</span> 返回
    </button>
  );
};

export default BackButton; 