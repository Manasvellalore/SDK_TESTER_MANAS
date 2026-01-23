import React, { useState } from 'react';
import OnboardingForm from './OnboardingForm';
import SessionModal from './SessionModal';
import { Toaster } from 'react-hot-toast';
import '../styles/AgentPortal.css';


const AgentPortal = () => {
  const [sessionData, setSessionData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');


  // ==========================================
  // AGENT LOCATION CAPTURE
  // ==========================================


  const captureAgentLocation = () => {
    return new Promise((resolve, reject) => {
      console.log('📍 [AGENT] Requesting location permission...');


      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }


      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ [AGENT] GPS location captured!');
          console.log('📍 Latitude:', position.coords.latitude);
          console.log('📍 Longitude:', position.coords.longitude);
          console.log('📍 Accuracy:', position.coords.accuracy, 'meters');


          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            capturedAt: new Date().toISOString()
          };


          // Get address from backend
          try {
            console.log('🗺️ [AGENT] Fetching address from backend...');
            
            // ✅ DEPLOYMENT CHANGE: Use environment variable for API URL
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
            
            const response = await fetch(`${API_BASE_URL}/api/reverse-geocode`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
            });


            if (response.ok) {
              const data = await response.json();
              
              if (data.success) {
                locationData.address = data.address;
                console.log('✅ [AGENT] Address:', data.address);
              } else {
                console.warn('⚠️ [AGENT] Address lookup failed');
                locationData.address = `${position.coords.latitude}, ${position.coords.longitude}`;
              }
            } else {
              console.warn('⚠️ [AGENT] Backend returned error');
              locationData.address = `${position.coords.latitude}, ${position.coords.longitude}`;
            }
          } catch (err) {
            console.warn('⚠️ [AGENT] Address fetch failed:', err);
            locationData.address = `${position.coords.latitude}, ${position.coords.longitude}`;
          }


          resolve(locationData);
        },
        (error) => {
          console.error('❌ [AGENT] Location error:', error);


          let errorMessage = 'Could not get location. ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permission denied. Please allow location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location unavailable. Please check your device settings.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Request timed out. Please try again.';
              break;
            default:
              errorMessage += 'Unknown error occurred.';
          }


          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  };


  // ==========================================
  // HANDLE GENERATE OTP WITH LOCATION
  // ==========================================


  const handleGenerateOTP = async (formData) => {
    try {
      console.log('🚀 [AGENT] Starting OTP generation with location capture...');


      // STEP 1: CAPTURE AGENT LOCATION
      console.log('📍 [AGENT] Capturing agent location...');
      
      const agentLocation = await captureAgentLocation();
      
      console.log('✅ [AGENT] Agent location captured:', agentLocation);


      // STEP 2: GENERATE SESSION ID
      const sessionId = Math.random().toString(36).substring(2, 15);
      
      // ✅ DEPLOYMENT CHANGE: Use dynamic URL based on environment
      const baseUrl = window.location.origin; // Gets current domain (local or deployed)
      const verificationLink = `${baseUrl}/verify-otp?session=${sessionId}`;
      
      console.log('🔑 [AGENT] Session ID:', sessionId);
      console.log('🔗 [AGENT] Verification link:', verificationLink);


      // STEP 3: CREATE AGENT DATA OBJECT
      const agentData = {
        location: agentLocation,
        agentName: formData.agentName || 'Agent Name',
        agentId: 'AGENT_001',
        branchName: 'Shirpur Branch',
        branchAddress: 'Shirpur, Dhule District, Maharashtra',
        sessionId: sessionId,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };


      // STEP 4: STORE AGENT LOCATION WITH SESSION
      localStorage.setItem(`agent_location_${sessionId}`, JSON.stringify(agentData));
      console.log('💾 [AGENT] Agent data stored for session:', sessionId);


      // STEP 5: CREATE SESSION DATA
      const session = {
        sessionId,
        verificationLink,
        customerData: formData,
        agentLocation: agentLocation,
        timestamp: new Date().toISOString()
      };


      setSessionData(session);
      setShowModal(true);


      // STEP 6: MONITOR VERIFICATION STATUS
      const checkVerification = () => {
        const verification = localStorage.getItem(`verification_${sessionId}`);
        if (verification) {
          const data = JSON.parse(verification);
          if (data.verified) {
            setVerificationStatus('verified');
            console.log('✅ [AGENT] Customer verified session:', sessionId);
            localStorage.removeItem(`verification_${sessionId}`);
          }
        }
      };


      const interval = setInterval(checkVerification, 2000);
      setTimeout(() => clearInterval(interval), 300000);


      console.log('✅ [AGENT] OTP generation complete with location tracking!');


    } catch (error) {
      console.error('❌ [AGENT] Error in handleGenerateOTP:', error);
      alert(`Error: ${error.message}\n\nPlease try again and allow location access.`);
    }
  };


  return (
    <div className="agent-portal-container">
      <Toaster position="top-right" />
      
      <header className="portal-header">
        <div className="header-content">
          <img src="Bargad_logo.jpeg" alt="Bargad.ai" className="logo" />
          <h1>Bargad.ai Agent Portal</h1>
          <span className="badge">Fraud Detection System</span>
        </div>
      </header>


      <div className="portal-content">
        <div className="content-wrapper">
          <div className="intro-section">
            <h2>Customer Onboarding</h2>
            <p>Securely onboard customers with real-time device verification</p>
          </div>


          <OnboardingForm 
            onGenerateOTP={handleGenerateOTP}
            verificationStatus={verificationStatus}
            sessionData={sessionData}
          />
        </div>
      </div>


      {showModal && sessionData && (
        <SessionModal 
          sessionData={sessionData}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};


export default AgentPortal;
