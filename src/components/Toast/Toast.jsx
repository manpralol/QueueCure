import React from 'react';

export const Toast = ({ message, visible }) => {
  return (
    <div style={{
      background: 'var(--accent)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: 'var(--radius-lg)',
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      zIndex: 9999,
      fontSize: '13px',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.3s ease-in-out',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {message}
    </div>
  );
};
