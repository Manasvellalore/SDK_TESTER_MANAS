// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AgentPortal from './components/AgentPortal';
import OTPVerification from './components/OTPVerification';
import OTPResults from './components/OTPResults';
import ThankYouPage from './components/ThankYouPage'; // ✅ NEW: Import Thank You page
import CasesManager from './components/CasesManager';
import DashboardPage from './components/DashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/agent" replace />} />

        <Route path="/agent" element={<AgentPortal />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/otp-results" element={<OTPResults />} />
        <Route path="/thank-you" element={<ThankYouPage />} /> {/* ✅ NEW: Thank You route */}
         <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesManager />} />
      </Routes>
    </Router>
  );
}

export default App;
