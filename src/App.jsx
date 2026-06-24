import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage/LandingPage';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard/ReceptionistDashboard';
import PatientDashboard from './pages/PatientDashboard/PatientDashboard';
import './styles/tokens.css';

const DEMO_USERS = {
  doctor: { id: 1, name: 'Dr. Arjun Mehta', role: 'doctor', email: 'doctor@demo.com' },
  receptionist: { id: 2, name: 'Sneha Patil', role: 'receptionist', email: 'receptionist@demo.com' },
  patient: { id: 3, name: 'Priya Sharma', role: 'patient', email: 'patient@demo.com' }
}

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (role, userData) => {
    const user = {
      ...DEMO_USERS[role],
      ...userData,
      name: userData.name || DEMO_USERS[role].name
    }
    setCurrentUser(user);
  }

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
          <Route path="/doctor" element={<DoctorDashboard user={currentUser || DEMO_USERS.doctor} onLogout={handleLogout} />} />
          <Route path="/receptionist" element={<ReceptionistDashboard user={currentUser || DEMO_USERS.receptionist} onLogout={handleLogout} />} />
          <Route path="/patient" element={<PatientDashboard user={currentUser || DEMO_USERS.patient} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;