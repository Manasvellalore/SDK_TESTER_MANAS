import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AgentPortal.css';

const AgentPortal = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('individual');
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    panNumber: '',
    dob: '',
    mobileNumber: '',
    emailId: '',
    addressLine1: '',
    addressLine2: '',
    residenceType: '',
    customerAge: '',
    updateAddress: false,
    addressType: 'domestic',
    state: '',
    city: '',
    landmark: '',
    pinCode: '',
    documentType: '',
    uploadedFile: null,
    countryCode: '',
    stdCode: '',
    phoneNumber: '',
    extension: '',
    contactEmailId: '',
  });

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  
  const [sdkReady, setSdkReady] = useState(false);
  const [bargadInstance, setBargadInstance] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // SDK INITIALIZATION
  useEffect(() => {
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);
    console.log('🔑 [SESSION] Generated:', newSessionId);
    
    loadSDK(newSessionId);
  }, []);

  const loadSDK = async (sid) => {
    try {
      console.log('🚀 [SDK] Initializing on form page...');

      if (window.bargadInstance) {
        console.log('✅ [SDK] Using existing instance');
        setBargadInstance(window.bargadInstance);
        setSdkReady(true);
        return;
      }

      if (window.Bargad) {
        console.log('✅ [SDK] Class exists, creating instance');
        await initializeBargad(sid);
        return;
      }

      console.log('📦 [SDK] Loading bundle...');

      const existingScripts = document.querySelectorAll('script[src*="bargad-bundle"]');
      existingScripts.forEach((s) => s.remove());

      window.BARGAD_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      
      const scriptElement = document.createElement('script');
      scriptElement.src = `/sdk/bargad-bundle.js?v=${Date.now()}`;
      scriptElement.type = 'text/javascript';
      scriptElement.async = false;

      scriptElement.onload = async () => {
        console.log('✅ [SDK] Bundle loaded');
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (window.Bargad) {
          await initializeBargad(sid);
        } else {
          throw new Error('Bargad class not found after loading');
        }
      };

      scriptElement.onerror = (e) => {
        console.error('❌ [SDK] Failed to load bundle', e);
        setLoadError('Failed to load SDK bundle');
        setSdkReady(true);
      };

      document.head.appendChild(scriptElement);
    } catch (error) {
      console.error('❌ [SDK] Error:', error);
      setLoadError(error.message);
      setSdkReady(true);
    }
  };

  const initializeBargad = async (sid) => {
    try {
      if (window.bargadInstance) {
        console.log('⚠️ [SDK] Instance already exists');
        setBargadInstance(window.bargadInstance);
        setSdkReady(true);
        return;
      }

      console.log('🎯 [SDK] Creating instance for form page...');

      const instance = new window.Bargad('test-api-key', sid);

      instance.trackDeviceLocation = true;
      instance.trackDeviceScreenSize = true;
      instance.trackDeviceID = true;
      instance.trackCPUCores = true;
      instance.trackGyroscope = true;
      instance.trackAccelerometerEvents = true;
      instance.trackMotionEvents = true;
      instance.trackScreenOrientation = true;
      instance.trackDisplaySettings = true;

      console.log('🚀 [SDK] Initializing trackers...');
      instance.initialize();

      setTimeout(() => {
        try {
          console.log('📤 [SDK] Forcing emission...');
          if (instance.emitDeviceLocationData) instance.emitDeviceLocationData();
          if (instance.emitGyroscopeData) instance.emitGyroscopeData();
          if (instance.emitAccelerometerData) instance.emitAccelerometerData();
          if (instance.emitMotionData) instance.emitMotionData();
          if (instance.emitScreenOrientationData) instance.emitScreenOrientationData();
          if (instance.emitDisplaySettingsData) instance.emitDisplaySettingsData();
          if (instance.emitDeviceScreenSize) instance.emitDeviceScreenSize();
          if (instance.emitDeviceID) instance.emitDeviceID();
          if (instance.emitCPUCoresData) instance.emitCPUCoresData();

          console.log(`✅ [SDK] Events: ${instance.allEvents?.length || 0}`);
        } catch (err) {
          console.error('❌ [SDK] Emit error:', err);
        }
      }, 4000);

      window.bargadInstance = instance;
      setBargadInstance(instance);
      setSdkReady(true);

      console.log('✅ [SDK] Ready and tracking!');
    } catch (error) {
      console.error('❌ [SDK] Init error:', error);
      setLoadError(error.message);
      setSdkReady(true);
    }
  };

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
          
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            capturedAt: new Date().toISOString()
          };

          try {
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
              }
            }
          } catch (err) {
            console.warn('⚠️ [AGENT] Address fetch failed:', err);
            locationData.address = `${position.coords.latitude}, ${position.coords.longitude}`;
          }

          resolve(locationData);
        },
        (error) => {
          console.error('❌ [AGENT] Location error:', error);
          reject(new Error('Could not get location. Please allow location access.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!consent) {
      alert('⚠️ Please accept the terms and conditions');
      return;
    }

    const attemptTimestamp = Date.now();
    const newAttempt = {
      timestamp: attemptTimestamp,
      attemptNumber: submitAttempts.length + 1,
    };

    const updatedAttempts = [...submitAttempts, newAttempt];
    setSubmitAttempts(updatedAttempts);

    console.log(`🔄 [SUBMIT] Attempt ${updatedAttempts.length}`);

    setIsSubmitting(true);

    try {
      console.log('🚀 [SUBMIT] Processing submission...');

      const agentLocation = await captureAgentLocation();
      console.log('✅ [AGENT] Location captured');

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

      const nameParts = (formData.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Use both possible field names so Case Manager and Scoreplex get phone/email
      const phoneRaw = (formData.mobileNumber || formData.phoneNumber || '').trim();
      const phone = phoneRaw
        ? (phoneRaw.startsWith('+') ? phoneRaw : `+91${phoneRaw.replace(/^0+/, '')}`)
        : '';
      const email = (formData.emailId || formData.contactEmailId || '').trim();

      const customerData = {
        customerName: formData.fullName || 'Customer',
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        // Keep alternate keys so backend can fallback if needed
        phoneNumber: formData.phoneNumber,
        mobileNumber: formData.mobileNumber,
        emailId: formData.emailId,
        contactEmailId: formData.contactEmailId,
        address: [formData.addressLine1, formData.addressLine2, formData.city, formData.state].filter(Boolean).join(', '),
        dob: formData.dob,
        pan: formData.panNumber,
        fatherName: formData.fatherName,
        residenceType: formData.residenceType,
        age: formData.customerAge,
      };

      await fetch(`${API_BASE_URL}/api/save-agent-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          customerData: customerData
        })
      });

      console.log('⏳ [SDK] Waiting for all events to collect (8 seconds)...');
      await new Promise((resolve) => setTimeout(resolve, 8000));

      if (bargadInstance) {
        console.log('📤 [SDK] Forcing emission of all events...');
        try {
          if (bargadInstance.emitKeypressData) bargadInstance.emitKeypressData();
          if (bargadInstance.emitClipboardData) bargadInstance.emitClipboardData();
          if (bargadInstance.emitLongPressData) bargadInstance.emitLongPressData();
          if (bargadInstance.emitTapData) bargadInstance.emitTapData();
          if (bargadInstance.emitSwipeData) bargadInstance.emitSwipeData();
          if (bargadInstance.emitScreenOrientationData) bargadInstance.emitScreenOrientationData();
          if (bargadInstance.emitDisplaySettingsData) bargadInstance.emitDisplaySettingsData();
          if (bargadInstance.emitPinchData) bargadInstance.emitPinchData();
          if (bargadInstance.emitAmbientLightData) bargadInstance.emitAmbientLightData();
          if (bargadInstance.emitDeviceLocationData) bargadInstance.emitDeviceLocationData();
          if (bargadInstance.emitGyroscopeData) bargadInstance.emitGyroscopeData();
          if (bargadInstance.emitProximityData) bargadInstance.emitProximityData();
          if (bargadInstance.emitMotionData) bargadInstance.emitMotionData();
          if (bargadInstance.emitAccelerometerData) bargadInstance.emitAccelerometerData();
          if (bargadInstance.emitDeviceScreenSize) bargadInstance.emitDeviceScreenSize();
          if (bargadInstance.emitDeviceID) bargadInstance.emitDeviceID();
          if (bargadInstance.emitIMEI) bargadInstance.emitIMEI();
          if (bargadInstance.emitBluetoothDevices) bargadInstance.emitBluetoothDevices();
          if (bargadInstance.emitCPUCoresData) bargadInstance.emitCPUCoresData();
          if (bargadInstance.emitTouchBiometricsData) bargadInstance.emitTouchBiometricsData();
          if (bargadInstance.emitFormTimeData) bargadInstance.emitFormTimeData();
          if (bargadInstance.emitInputPatternData) bargadInstance.emitInputPatternData();

          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log(`📊 [SDK] Total events: ${bargadInstance.allEvents?.length || 0}`);
        } catch (emitError) {
          console.error('❌ [SDK] Emit error:', emitError);
        }
      }

      let events = bargadInstance?.allEvents || [];

      const timeDiffs = calculateTimeDiffs(updatedAttempts);
      const totalAttempts = updatedAttempts.length;
      const fraudScore = calculateSubmitRisk(totalAttempts);

      const submissionEvent = {
        type: 'FORM_SUBMISSION',
        payload: {
          submissionAttempts: totalAttempts,
          attempts: updatedAttempts,
          firstAttemptTimestamp: updatedAttempts[0].timestamp,
          lastAttemptTimestamp: attemptTimestamp,
          timeBetweenAttempts: timeDiffs,
          fraudScore: {
            score: fraudScore,
            level: fraudScore > 70 ? 'HIGH_RISK' : fraudScore > 40 ? 'MEDIUM_RISK' : 'LOW_RISK',
            confidence: 0.9,
          },
          finalStatus: 'SUBMITTED',
        },
        timestamp: Date.now(),
        userId: sessionId,
        SDK: 'Bargad-v1.0.0',
      };

      events.push(submissionEvent);

      console.log('🗺️ [AGENT-USER] Starting distance calculation...');

      const userLocationEvent = events.find((e) => e.type === 'DEVICE_LOCATION');

      if (userLocationEvent) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/calculate-distance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userLat: agentLocation.latitude,
              userLon: agentLocation.longitude,
              bankLat: userLocationEvent.payload.latitude,
              bankLon: userLocationEvent.payload.longitude,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.success) {
              console.log('✅ [AGENT-USER] Distance:', data.distanceKm, 'km');

              const agentUserDistanceEvent = {
                type: 'AGENT_USER_DISTANCE',
                payload: {
                  agentLocation: {
                    latitude: agentLocation.latitude,
                    longitude: agentLocation.longitude,
                    name: 'Agent',
                    address: agentLocation.address || 'Agent Location',
                  },
                  userLocation: {
                    latitude: userLocationEvent.payload.latitude,
                    longitude: userLocationEvent.payload.longitude,
                    name: 'Customer',
                    address: userLocationEvent.payload.address?.formattedAddress || 'User Location',
                  },
                  distance: {
                    km: data.distanceKm,
                    meters: Math.round(data.distanceKm * 1000),
                    miles: parseFloat((data.distanceKm * 0.621371).toFixed(2)),
                  },
                  duration: {
                    minutes: data.durationMinutes,
                    formatted: `${Math.floor(data.durationMinutes / 60)}h ${Math.round(data.durationMinutes % 60)}m`,
                  },
                  calculationMethod: 'MAPPLS_DISTANCE_MATRIX_API',
                  riskAnalysis: assessAgentUserRisk(data.distanceKm),
                },
                timestamp: Date.now(),
                userId: sessionId,
                SDK: 'Bargad-v1.0.0',
              };

              events.push(agentUserDistanceEvent);
            }
          }
        } catch (err) {
          console.error('❌ [AGENT-USER] Distance calculation failed:', err);
        }
      }

      console.log('💾 [BACKEND] Sending SDK data to backend...');

      try {
        const sdkDataResponse = await fetch(`${API_BASE_URL}/api/save-sdk-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            sdkData: events,
          }),
        });

        if (sdkDataResponse.ok) {
          console.log('✅ [BACKEND] SDK data saved successfully');
        }
      } catch (err) {
        console.error('❌ [BACKEND] Error saving SDK data:', err);
      }

      const agentData = {
        location: agentLocation,
        agentName: 'Agent Name',
        agentId: 'AGENT_001',
        branchName: 'Shirpur Branch',
        sessionId: sessionId,
        timestamp: Date.now(),
      };

      localStorage.setItem(`agent_location_${sessionId}`, JSON.stringify(agentData));

      console.log('✅ [SUBMIT] Complete! Navigating to Thank You page...');

      navigate('/thank-you', { state: { sessionId } });

    } catch (error) {
      console.error('❌ [SUBMIT] Error:', error);
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="kyc-container">
      <header className="kyc-header">
        <div className="header-left">
          <img src="/new-logo.png" alt="Bargad.ai" className="kyc-logo" />
          <span className="header-title"></span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="icon-circle">👤</div>
            <div>
              <div className="user-name">Rushit Morye</div>
              <div className="user-subtitle">Here we are to help you...</div>
            </div>
          </div>
          <div className="icon-circle">📁</div>
          <div className="icon-circle">🔔</div>
        </div>
      </header>

      <div className="kyc-banner">
        CUSTOMER INTERACTION FRONTED (SVR-CPV-IPV-RE-KYC-)
      </div>

      <div className="kyc-main">
        <aside className="sidebar">
          <button 
            className={`sidebar-btn ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setActiveTab('individual')}
          >
            Individual
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'authorized' ? 'active' : ''}`}
            onClick={() => setActiveTab('authorized')}
          >
            Authorised Signatory
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'proprietor' ? 'active' : ''}`}
            onClick={() => setActiveTab('proprietor')}
          >
            Proprietor
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'partner' ? 'active' : ''}`}
            onClick={() => setActiveTab('partner')}
          >
            Partner
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'beneficial' ? 'active' : ''}`}
            onClick={() => setActiveTab('beneficial')}
          >
            Beneficial Owner
          </button>
        </aside>

        <main className="form-content">
          {!sdkReady && (
            <div className="sdk-loading">
              <div className="loading-spinner"></div>
              <p>Initializing SDK trackers...</p>
            </div>
          )}

          {sdkReady && (
            <form onSubmit={handleSubmit}>
              <div className="form-tabs">
                <button type="button" className="tab-btn active">Input Number</button>
                <button type="button" className="tab-btn">CF</button>
              </div>

              {/* Customer Info Card */}
              <div className="info-card">
                <div className="profile-section">
                  <img src="/default-avatar.png" alt="Profile" className="profile-img" />
                </div>
                <div className="info-grid">
                  <div>
                    <label>Full Name</label>
                    <div className="info-value">Varunus R Bhoite</div>
                  </div>
                  <div>
                    <label>Pan Number</label>
                    <div className="info-value">XXXX XXXX 8531</div>
                  </div>
                  <div>
                    <label>Address Line 1</label>
                    <div className="info-value">Varunus Villa 18</div>
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <div className="info-value">Gurukrupa Rd</div>
                  </div>
                  <div>
                    <label>Father Name</label>
                    <div className="info-value">RXXXOXXFX</div>
                  </div>
                  <div>
                    <label>City</label>
                    <div className="info-value">DN Nagar</div>
                  </div>
                  <div>
                    <label>Residence</label>
                    <div className="info-value">Mumbai</div>
                  </div>
                  <div>
                    <label>Customer Age</label>
                    <div className="info-value">400610</div>
                  </div>
                  <div>
                    <label>DOB</label>
                    <div className="info-value">12 May 1990</div>
                  </div>
                  <div>
                    <label>Email ID</label>
                    <div className="info-value">amit007@gmail.com</div>
                  </div>
                  <div>
                    <label>Mobile No</label>
                    <div className="info-value">9XXXXXXX72</div>
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="consent-section">
                <label className="consent-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>I wish to change my contact details/ current address in the bank records. Attached herewith the KYC documents for the purpose of updation.</span>
                </label>
              </div>

              {/* Update Current Address */}
              <div className="form-section">
                <div className="section-header">
                  <span className="icon">ℹ️</span>
                  <h3>Update Current Address :</h3>
                  <div className="radio-buttons">
                    <label>Preferred Mailing Address</label>
                    <label>
                      <input
                        type="radio"
                        name="addressType"
                        value="yes"
                        checked={formData.addressType === 'yes'}
                        onChange={handleChange}
                      />
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="addressType"
                        value="no"
                        checked={formData.addressType === 'no'}
                        onChange={handleChange}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-group">
                    <label>Landmark</label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Pin Code</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      placeholder="Enter pin code"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Proof of Address */}
              <div className="form-section">
                <div className="section-header">
                  <span className="icon">📷</span>
                  <h3>Upload Proof of Address :</h3>
                  <div className="radio-buttons">
                    <label>Is this your permanent address?</label>
                    <label>
                      <input type="radio" name="permanentAddress" value="yes" />
                      Yes
                    </label>
                    <label>
                      <input type="radio" name="permanentAddress" value="no" />
                      No
                    </label>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Officially Valid Document (OVD)</label>
                    <select name="documentType" value={formData.documentType} onChange={handleChange}>
                      <option value="">Select OVD</option>
                      <option value="passport">Passport</option>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="driving">Driving License</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Details of OVD</label>
                    <div className="ovd-details">
                      <div className="detail-row">
                        <span>OVD Identification Number</span>
                        <span>XXXX XXXX XXXX</span>
                      </div>
                      <div className="detail-row">
                        <span>Name</span>
                        <span>XXXX</span>
                      </div>
                      <div className="detail-row">
                        <span>Place of Issue</span>
                        <span>XXXX</span>
                      </div>
                      <div className="detail-row">
                        <span>Date of Issue</span>
                        <span>XXXX</span>
                      </div>
                      <div className="detail-row">
                        <span>Date of Expiry</span>
                        <span>XXXX</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Upload/ Drag & Drop</label>
                    <div className="upload-area">
                      <span className="upload-icon">+</span>
                    </div>
                    <p className="upload-note">If the above current address is not (fully) government address please make to address, please refer back to HO Detail.).</p>
                  </div>
                </div>
              </div>

              {/* Update Contact Details */}
              <div className="form-section">
                <div className="section-header">
                  <span className="icon">ℹ️</span>
                  <h3>Update Contact Details :</h3>
                </div>

                <div className="form-grid-4">
                  <div className="form-group">
                    <label>Country Code</label>
                    <input
                      type="text"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>STD Code</label>
                    <input
                      type="text"
                      name="stdCode"
                      value={formData.stdCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Extension</label>
                    <input
                      type="text"
                      name="extension"
                      value={formData.extension}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Email ID</label>
                    <input
                      type="email"
                      name="contactEmailId"
                      value={formData.contactEmailId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

// Helper functions
const calculateTimeDiffs = (attempts) => {
  if (attempts.length < 2) return [];
  const diffs = [];
  for (let i = 1; i < attempts.length; i++) {
    diffs.push((attempts[i].timestamp - attempts[i - 1].timestamp) / 1000);
  }
  return diffs;
};

const calculateSubmitRisk = (totalAttempts) => {
  if (totalAttempts === 1) return 0;
  if (totalAttempts === 2) return 20;
  if (totalAttempts === 3) return 40;
  if (totalAttempts <= 5) return 70;
  return 95;
};

function assessAgentUserRisk(distanceKm) {
  let riskScore = 0;
  let riskLevel = 'LOW';
  let isSuspicious = false;
  let recommendation = '';
  const reasons = [];

  if (distanceKm > 200) {
    riskScore = 90;
    riskLevel = 'CRITICAL';
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away from agent`);
    recommendation = 'BLOCK - Require video KYC';
  } else if (distanceKm > 100) {
    riskScore = 70;
    riskLevel = 'HIGH';
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away from agent`);
    recommendation = 'REVIEW - Verify with video call';
  } else if (distanceKm > 50) {
    riskScore = 50;
    riskLevel = 'MEDIUM';
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away`);
    recommendation = 'ALERT - Confirm customer details';
  } else {
    riskScore = 10;
    riskLevel = 'VERY_LOW';
    isSuspicious = false;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away`);
    recommendation = 'APPROVE - Proceed normally';
  }

  return {
    riskScore,
    riskLevel,
    isSuspicious,
    reasons,
    recommendation,
    distanceKm: distanceKm.toFixed(2),
  };
}

export default AgentPortal;
