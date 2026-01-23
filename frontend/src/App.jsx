// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserForm from './components/UserForm';
import ResultsView from './components/ResultsView';
import AgentPortal from './components/AgentPortal';
import OTPVerification from './components/OTPVerification';
import OTPResults from './components/OTPResults';


function App() {
  return (
    <Router>
      <Routes>
         <Route path="/agent" element={<AgentPortal />} />
        <Route path="/" element={<UserForm />} />
        <Route path="/results" element={<ResultsView />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/otp-results" element={<OTPResults />} />
      </Routes>
    </Router>
  );
}

export default App;
