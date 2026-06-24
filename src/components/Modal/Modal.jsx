import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Modal.module.css';
import { authService } from '../../services/authService';

const Modal = ({ isOpen, onClose, role, onLogin }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'doctor') {
      setEmail('doctor@demo.com');
      setPassword('password');
    } else if (role === 'receptionist') {
      setEmail('receptionist@demo.com');
      setPassword('password');
    } else {
      setEmail('');
      setPassword('');
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const loginEmail = email || (role === 'doctor' ? 'doctor@demo.com' : role === 'receptionist' ? 'receptionist@demo.com' : 'patient@demo.com');
      const loginPassword = password || 'password';
      let userData = null;
      try {
        const result = await authService.login(loginEmail, loginPassword, role);
        if (result && result.token) {
          localStorage.setItem('qt-token', result.token);
          userData = {
            token: result.token,
            id: result.userId,
            role: result.role,
            name: (role === 'patient' && fullName.trim()) ? fullName.trim() : result.name,
            email: loginEmail
          };
        }
      } catch (err) {
        console.warn('Backend authentication failed or server unreachable, falling back to mock authentication:', err);
        const enteredName = role === 'patient'
          ? (fullName.trim() || 'Priya Sharma')
          : (role === 'doctor' ? 'Dr. Arjun Mehta' : 'Sneha Patil');
        userData = {
          id: role === 'patient' ? 3 : (role === 'doctor' ? 1 : 2),
          role,
          name: enteredName,
          email: loginEmail
        };
      }
      onLogin(role, userData);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    doctor: {
      badge: 'Doctor Portal',
      dotColor: 'var(--doc-color)',
      badgeColor: 'var(--doc-color)',
      title: 'Welcome back, Doctor.',
      subtitle: 'Sign in to view your schedule, patient history, and upcoming appointments.',
      submitText: 'Sign In to Doctor Portal',
      submitClass: styles.docSubmit,
      demoNoteBg: 'var(--doc-bg)',
      demoNoteBorder: 'var(--doc-bg)',
      demoNoteText: 'var(--doc-color)'
    },
    receptionist: {
      badge: 'Receptionist Portal',
      dotColor: 'var(--rec-color)',
      badgeColor: 'var(--rec-color)',
      title: 'Manage the queue.',
      subtitle: 'Access appointment bookings, patient check-ins, and scheduling tools.',
      submitText: 'Sign In to Reception Portal',
      submitClass: styles.recSubmit,
      demoNoteBg: 'var(--rec-bg)',
      demoNoteBorder: 'var(--rec-bg)',
      demoNoteText: 'var(--rec-color)'
    },
    patient: {
      badge: 'Patient Portal',
      dotColor: 'var(--pat-color)',
      badgeColor: 'var(--pat-color)',
      title: 'Your health, your schedule.',
      subtitle: 'Book, reschedule, or track appointments with ease.',
      submitText: 'Continue to Patient Portal',
      submitClass: styles.patSubmit,
      demoNoteBg: 'var(--pat-bg)',
      demoNoteBorder: 'var(--pat-bg)',
      demoNoteText: 'var(--pat-color)'
    }
  };

  const config = roleConfig[role] || roleConfig.patient;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <svg viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className={styles.modalRoleBadge} style={{ color: config.badgeColor }}>
          <div className={styles.modalRoleDot} style={{ background: config.dotColor }} />
          {config.badge}
        </div>
        <h3>{config.title}</h3>
        <p>{config.subtitle}</p>

        <div
          className={styles.demoNote}
          style={{
            backgroundColor: config.demoNoteBg,
            borderColor: config.demoNoteBorder,
            color: config.demoNoteText,
            border: '1px solid'
          }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Demo mode — {role === 'patient' ? 'click Continue' : 'click Sign In'} to enter
        </div>

        <form onSubmit={handleSubmit}>
          {role === 'patient' ? (
            <>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email / Phone</label>
                <input type="text" placeholder="you@email.com or +91 98…" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </>
          ) : (
            <div className={styles.formGroup}>
              <label>{role === 'doctor' ? 'Medical ID / Email' : 'Email Address'}</label>
              <input type="email" placeholder={role === 'doctor' ? 'doctor@clinic.com' : 'reception@clinic.com'} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

          <button
            type="submit"
            className={`${styles.formSubmit}`}
            disabled={isLoading || (role === 'patient' && !fullName.trim())}
            style={{
              backgroundColor: role === 'doctor' ? 'var(--doc-color)' : role === 'receptionist' ? 'var(--rec-color)' : 'var(--black)',
              opacity: (isLoading || (role === 'patient' && !fullName.trim())) ? 0.7 : 1,
              cursor: (isLoading || (role === 'patient' && !fullName.trim())) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing in...' : config.submitText}
          </button>
        </form>

        <p className={styles.formFooter}>
          {role === 'patient' ? (
            <>Already have an account? <a href="#">Sign in</a></>
          ) : (
            <><a href="#">Forgot password?</a> &nbsp;·&nbsp; <a href="#">{role === 'doctor' ? 'Register account' : 'Contact admin'}</a></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Modal;
