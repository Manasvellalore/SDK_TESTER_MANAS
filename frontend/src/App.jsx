// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AgentPortal from './components/AgentPortal';
import OTPVerification from './components/OTPVerification';
import OTPResults from './components/OTPResults';


function App() {
  return (
    <Router>
      <Routes>
         <Route path="/" element={<Navigate to="/agent" replace />} />

         <Route path="/agent" element={<AgentPortal />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/otp-results" element={<OTPResults />} />
      </Routes>
    </Router>
  );
}

export default App;
