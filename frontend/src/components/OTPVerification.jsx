import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/OTPVerification.css";


function OTPVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const CORRECT_OTP = "202666";
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(""); // 🆕 Show message instead of disabling
  const [sdkReady, setSdkReady] = useState(false);
  const [bargadInstance, setBargadInstance] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState([]);
  const [showMap, setShowMap] = useState(false); 
  const [mapInitialized, setMapInitialized] = useState(false);
const [isVerified, setIsVerified] = useState(false);


  useEffect(() => {
    let isMounted = true;
    let scriptElement = null;

    const loadSDK = async () => {
      try {
        console.log("🚀 [SDK] Initializing OTP page...");

        if (sessionId) {
          console.log(`🔗 [SESSION] Agent session detected: ${sessionId}`);
        }

        if (window.bargadInstance) {
          console.log("✅ [SDK] Using existing instance");
          if (isMounted) {
            setBargadInstance(window.bargadInstance);
            setSdkReady(true);
          }
          return;
        }

        if (window.Bargad) {
          console.log("✅ [SDK] Class exists, creating instance");
          await initializeBargad();
          return;
        }

        console.log("📦 [SDK] Loading bundle...");

        const existingScripts = document.querySelectorAll(
          'script[src*="bargad-bundle"]'
        );
        existingScripts.forEach((s) => {
          console.log("🗑️ [SDK] Removing old script");
          s.remove();
        });

          // ✅ Set backend URL for SDK before loading
window.BARGAD_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
console.log('🌍 [REACT] Setting SDK backend URL:', window.BARGAD_API_URL);

scriptElement = document.createElement("script");


        scriptElement = document.createElement("script");
        scriptElement.src = `/sdk/bargad-bundle.js?v=${Date.now()}`;
        scriptElement.type = "text/javascript";
        scriptElement.async = false;

        scriptElement.onload = async () => {
          console.log("✅ [SDK] Bundle loaded");
          await new Promise((resolve) => setTimeout(resolve, 1500));

          if (window.Bargad) {
            await initializeBargad();
          } else {
            throw new Error("Bargad class not found after loading");
          }
        };

        scriptElement.onerror = (e) => {
          const error = "Failed to load SDK bundle";
          console.error("❌ [SDK]", error, e);
          if (isMounted) {
            setLoadError(error);
            setSdkReady(true);
          }
        };

        document.head.appendChild(scriptElement);
      } catch (error) {
        console.error("❌ [SDK] Error:", error);
        if (isMounted) {
          setLoadError(error.message);
          setSdkReady(true);
        }
      }
    };

    const initializeBargad = async () => {
      try {
        if (window.bargadInstance) {
          console.log("⚠️ [SDK] Instance already exists");
          if (isMounted) {
            setBargadInstance(window.bargadInstance);
            setSdkReady(true);
          }
          return;
        }

        console.log("🎯 [SDK] Creating instance for OTP page...");
        
        console.log('🔍 [SDK] Checking for OTP elements...');
        const otpInput = document.getElementById('otp');
        const otpButton = document.getElementById('otp-verify-btn');

        console.log('📍 OTP Input found:', !!otpInput);
        console.log('📍 OTP Button found:', !!otpButton);

        if (!otpInput || !otpButton) {
          console.warn('⚠️ [SDK] OTP elements not ready, waiting 2 more seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const otpInputRetry = document.getElementById('otp');
          const otpButtonRetry = document.getElementById('otp-verify-btn');
          console.log('📍 Retry - OTP Input:', !!otpInputRetry);
          console.log('📍 Retry - OTP Button:', !!otpButtonRetry);
        }

        const instance = new window.Bargad(
          "test-api-key",
          sessionId || "otp-user-1"
        );

        instance.trackOTPAttempts = {
          enabled: true,
          args: [["otp-verify-btn"]],
        };
        instance.trackDeviceLocation = true;
        instance.trackDeviceScreenSize = true;
        instance.trackDeviceID = true;
        instance.trackCPUCores = true;
        instance.trackGyroscope = true;
        instance.trackAccelerometerEvents = true;
        instance.trackMotionEvents = true;
        instance.trackScreenOrientation = true;
        instance.trackDisplaySettings = true;

        console.log("🚀 [SDK] Initializing trackers...");
        instance.initialize();

        setTimeout(() => {
          console.log("🔐 [SDK] Manually reinitializing OTP tracking...");
          
          const otpInputFinal = document.getElementById('otp');
          const otpButtonFinal = document.getElementById('otp-verify-btn');
          
          console.log('📍 FINAL CHECK - OTP Input:', !!otpInputFinal);
          console.log('📍 FINAL CHECK - OTP Button:', !!otpButtonFinal);
          
          if (otpInputFinal && otpButtonFinal && instance.initOTPAttempts) {
            console.log('✅ [SDK] Calling initOTPAttempts() manually...');
            try {
              instance.initOTPAttempts();
              console.log('✅ [SDK] OTP tracking reinitialized successfully!');
            } catch (err) {
              console.error('❌ [SDK] Failed to reinitialize OTP:', err);
            }
          } else if (!instance.initOTPAttempts) {
            console.error('❌ [SDK] initOTPAttempts method not found on instance!');
          } else {
            console.error('❌ [SDK] OTP elements still not found after 2 seconds!');
          }
        }, 2000);

        window.bargadInstance = instance;

        setTimeout(() => {
          try {
            console.log("📤 [SDK] Forcing emission...");
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
            console.error("❌ [SDK] Emit error:", err);
          }
        }, 4000);

        if (isMounted) {
          setBargadInstance(instance);
          setSdkReady(true);
        }

        console.log("✅ [SDK] Ready!");
      } catch (error) {
        console.error("❌ [SDK] Init error:", error);
        if (isMounted) {
          setLoadError(error.message);
          setSdkReady(true);
        }
      }
    };

    loadSDK();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  // 🆕 Verify OTP - Just shows message, doesn't block anything
 const handleVerifyOtp = async () => {
  console.log('🔍 [DEBUG] OTP entered:', otp);
  console.log('🔍 [DEBUG] Correct OTP:', CORRECT_OTP);
  console.log('🔍 [DEBUG] Match?', otp === CORRECT_OTP);
  const attemptTimestamp = Date.now();
  const newAttempt = {
    otp: otp,
    timestamp: attemptTimestamp,
    isCorrect: otp === CORRECT_OTP
  };

  // Add to attempts array
  const updatedAttempts = [...otpAttempts, newAttempt];
  setOtpAttempts(updatedAttempts);

  if (otp === CORRECT_OTP) {
    // ✅ CORRECT OTP
    setIsVerified(true);
    
    // Calculate time differences between attempts
    const timeDiffs = calculateTimeDiffs(updatedAttempts);
    const wrongAttempts = updatedAttempts.filter(a => !a.isCorrect);
    const totalAttempts = updatedAttempts.length;
    
    // Fraud score calculation
    const fraudScore = calculateOtpRisk(totalAttempts);
    const isRapidGuessing = timeDiffs.some(t => t < 3); // Less than 3 seconds = bot
    
    // Create SDK-style OTP VERIFICATION event
    const otpEvent = {
      type: "OTP_VERIFICATION",
      payload: {
        // Attempt summary (SDK style)
        verificationAttempts: totalAttempts,
        verificationAttemptType: totalAttempts === 1 ? "SINGLE" : "MULTIPLE",
        
        // Detailed attempt log
        attempts: updatedAttempts.map(a => ({
          otpValue: a.otp,
          attemptTimestamp: a.timestamp,
          isCorrect: a.isCorrect,
          attemptNumber: updatedAttempts.indexOf(a) + 1
        })),
        
        // Time analysis
        firstAttemptTimestamp: updatedAttempts[0].timestamp,
        lastAttemptTimestamp: attemptTimestamp,
        timeBetweenAttempts: timeDiffs,
        averageTimeBetweenAttempts: timeDiffs.length > 0 
          ? (timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length).toFixed(2)
          : 0,
        
        // Fraud scoring (match SDK style)
        fraudScore: {
          score: fraudScore,
          level: fraudScore > 70 ? "HIGH_RISK" : fraudScore > 40 ? "MEDIUM_RISK" : "LOW_RISK",
          reasons: [
            `${totalAttempts} verification ${totalAttempts === 1 ? 'attempt' : 'attempts'}`,
            `${wrongAttempts.length} wrong OTP ${wrongAttempts.length === 1 ? 'entry' : 'entries'}`,
            totalAttempts > 3 ? "Multiple failed attempts - suspicious" : "Normal verification behavior",
            isRapidGuessing ? "Rapid guessing detected - bot suspected" : "Normal timing pattern"
          ],
          confidence: totalAttempts > 1 ? 0.8 : 0.9
        },
        
        // Verification pattern analysis
        verificationPattern: {
          patternType: totalAttempts > 3 ? "TRIAL_AND_ERROR" : totalAttempts > 1 ? "RETRY" : "FIRST_ATTEMPT_SUCCESS",
          suspicionLevel: totalAttempts > 3 ? "HIGH" : totalAttempts > 1 ? "MEDIUM" : "LOW",
          isRapidGuessing: isRapidGuessing,
          behaviorIndicator: isRapidGuessing ? "BOT_LIKE" : "HUMAN_LIKE"
        },
        
        // Summary statistics
        totalAttempts: totalAttempts,
        wrongAttempts: wrongAttempts.length,
        correctAttempts: updatedAttempts.filter(a => a.isCorrect).length,
        finalStatus: "VERIFIED",
        
        // Risk assessment
        riskScore: fraudScore,
        riskLevel: fraudScore > 70 ? "HIGH" : fraudScore > 40 ? "MEDIUM" : "LOW",
        isSuspicious: totalAttempts > 2,
        
        // OTP details
        otpLength: CORRECT_OTP.length,
        currentOtpValue: otp
      },
      timestamp: Date.now(),
      userId: sessionId || "otp-user-1",
      SDK: "Bargad-v1.0.0"
    };

    // Add to SDK events
    if (bargadInstance && bargadInstance.allEvents) {
      bargadInstance.allEvents.push(otpEvent);
      console.log('✅ [OTP_VERIFICATION] Event added to SDK');
      console.log('📊 [OTP_VERIFICATION] Total attempts:', totalAttempts);
      console.log('📊 [OTP_VERIFICATION] Fraud score:', fraudScore);
    }

    // Calculate Agent-User Distance BEFORE navigating
console.log('🗺️ [AGENT-USER] Starting distance calculation...');

let events = bargadInstance?.allEvents || [];
const userLocationEvent = events.find((e) => e.type === "DEVICE_LOCATION");

if (userLocationEvent && sessionId) {
  console.log('✅ [AGENT-USER] User location found');

  const agentDataString = localStorage.getItem(`agent_location_${sessionId}`);
  console.log('🔍 [AGENT-USER] Agent data:', agentDataString ? 'Found' : 'NOT FOUND');

  if (agentDataString) {
    const agentData = JSON.parse(agentDataString);
    console.log('✅ [AGENT-USER] Agent location parsed');

    try {
      console.log('🗺️ [AGENT-USER] Calling MapmyIndia API...');

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_BASE_URL}/api/calculate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userLat: agentData.location.latitude,
          userLon: agentData.location.longitude,
          bankLat: userLocationEvent.payload.latitude,
          bankLon: userLocationEvent.payload.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          console.log('✅ [AGENT-USER] Distance:', data.distanceKm, 'km');

          const agentUserDistanceEvent = {
            type: "AGENT_USER_DISTANCE",
            payload: {
              agentLocation: {
                latitude: agentData.location.latitude,
                longitude: agentData.location.longitude,
                name: agentData.agentName || 'Agent',
                address: agentData.location.address || 'Agent Location'
              },
              userLocation: {
                latitude: userLocationEvent.payload.latitude,
                longitude: userLocationEvent.payload.longitude,
                name: 'Customer',
                address: userLocationEvent.payload.address?.formattedAddress || 'User Location'
              },
              distance: {
                km: data.distanceKm,
                meters: Math.round(data.distanceKm * 1000),
                miles: parseFloat((data.distanceKm * 0.621371).toFixed(2))
              },
              duration: {
                minutes: data.durationMinutes,
                formatted: `${Math.floor(data.durationMinutes / 60)}h ${Math.round(data.durationMinutes % 60)}m`
              },
              drivingDistance: {
                km: data.distanceKm,
                durationFormatted: `${Math.floor(data.durationMinutes / 60)}h ${Math.round(data.durationMinutes % 60)}m`
              },
              calculationMethod: "MAPPLS_DISTANCE_MATRIX_API",
              riskAnalysis: assessAgentUserRisk(data.distanceKm)
            },
            timestamp: Date.now(),
            userId: sessionId || "otp-user-1",
            SDK: "Bargad-v1.0.0"
          };

          events.push(agentUserDistanceEvent);
          console.log('✅ [AGENT-USER] Event added! Total events:', events.length);
        } else {
          console.error('❌ [AGENT-USER] API error:', data.error);
        }
      } else {
        console.error('❌ [AGENT-USER] HTTP error:', response.status);
      }
    } catch (err) {
      console.error('❌ [AGENT-USER] Fetch failed:', err);
    }
  } else {
    console.warn('⚠️ [AGENT-USER] No agent location in localStorage');
  }
} else {
  console.warn('⚠️ [AGENT-USER] Missing user location or sessionId');
}

// Save ALL events (including agent-user distance)
console.log('💾 [SAVE] Saving', events.length, 'events');
sessionStorage.setItem('otpEvents', JSON.stringify(events));
sessionStorage.setItem('otpData', JSON.stringify({ 
  otp, 
  sessionId, 
  timestamp: new Date().toISOString() 
}));

    // Show success message
    setVerificationMessage("✅ OTP Verified! Redirecting...");

    // Save all SDK events to sessionStorage before navigating
if (bargadInstance && bargadInstance.allEvents) {
  sessionStorage.setItem('otpEvents', JSON.stringify(bargadInstance.allEvents));
  console.log('💾 [OTP] Saved', bargadInstance.allEvents.length, 'events to sessionStorage');
}

if (sessionId) {
  console.log(`✅ [SESSION] Marking session ${sessionId} as verified`);
  localStorage.setItem(
    `verification_${sessionId}`,
    JSON.stringify({
      verified: true,
      timestamp: new Date().toISOString(),
      otp: otp,
      eventCount: bargadInstance?.allEvents?.length || 0,
    })
  );

  window.dispatchEvent(new Event("storage"));
  console.log('📡 [SESSION] Agent Portal notified');
}

// Show success message
setVerificationMessage("✅ OTP Verified! Redirecting...");

// Auto-navigate to results after 1.5 seconds
setTimeout(() => {
  console.log('✅ [OTP] Navigating to results...');
  navigate('/otp-results');
}, 1500);


    // Auto-navigate to results after 1.5 seconds
    setTimeout(() => {
      console.log('✅ [OTP] Navigating to results...');
      navigate('/otp-results');
    }, 1500);

  } else {
    // ❌ WRONG OTP
    setVerificationMessage(`⚠️ Wrong OTP. Attempt ${updatedAttempts.length}. Try again.`);
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setVerificationMessage("");
    }, 3000);
  }
};




  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert('⚠️ Please enter a 6-digit OTP');
      return;
    }

    if (!consent) {
      alert('⚠️ Please accept the terms and conditions to proceed');
      return;
    }

    try {
      console.log('🚀 [SUBMIT] Processing final submission...');
      setIsSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 8000));

      let events = [];

      if (bargadInstance) {
        events = bargadInstance.allEvents || [];
        console.log(`📊 [SUBMIT] ${events.length} events captured`);

        const otpAttempts = events.filter(e => e.type === "OTP_ATTEMPT");
        console.log(`🔐 [SUBMIT] OTP attempts captured: ${otpAttempts.length}`);

        console.log('📍 [AGENT-USER] Starting distance calculation...');

        const userLocationEvent = events.find((e) => e.type === "DEVICE_LOCATION");

        if (userLocationEvent && sessionId) {
          console.log('✅ User location found');

          const agentDataString = localStorage.getItem(`agent_location_${sessionId}`);

          if (agentDataString) {
            if (agentDataString) {
  const agentData = JSON.parse(agentDataString);
  console.log('✅ Agent location found');

  try {
    console.log('🗺️ [AGENT-USER] Calling backend API with MapmyIndia...');

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

    // 🆕 Use same endpoint as bank distance (calculate-distance)
    const response = await fetch(`${API_BASE_URL}/api/calculate-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userLat: agentData.location.latitude,     // Agent is "source"
        userLon: agentData.location.longitude,
        bankLat: userLocationEvent.payload.latitude,   // User is "destination"
        bankLon: userLocationEvent.payload.longitude
      })
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success) {
        console.log('✅ [AGENT-USER] Distance calculated via MapmyIndia:', data.distanceKm, 'km');

        // Create agent-user distance event (same format as bank distance)
        const agentUserDistanceEvent = {
          type: "AGENT_USER_DISTANCE",
          payload: {
            agentLocation: {
              latitude: agentData.location.latitude,
              longitude: agentData.location.longitude,
              name: agentData.agentName || 'Agent',
              address: agentData.location.address || 'Agent Location'
            },
            userLocation: {
              latitude: userLocationEvent.payload.latitude,
              longitude: userLocationEvent.payload.longitude,
              name: 'Customer',
              address: userLocationEvent.payload.address?.formattedAddress || 'User Location'
            },
            distance: {
              km: data.distanceKm,
              meters: Math.round(data.distanceKm * 1000),
              miles: parseFloat((data.distanceKm * 0.621371).toFixed(2))
            },
            duration: {
              minutes: data.durationMinutes,
              formatted: `${Math.floor(data.durationMinutes / 60)}h ${Math.round(data.durationMinutes % 60)}m`
            },
            drivingDistance: {
              km: data.distanceKm,
              durationFormatted: `${Math.floor(data.durationMinutes / 60)}h ${Math.round(data.durationMinutes % 60)}m`
            },
            calculationMethod: "MAPPLS_DISTANCE_MATRIX_API",
            riskAnalysis: assessAgentUserRisk(data.distanceKm),
            isSuspicious: data.distanceKm > 50,
            riskLevel: data.distanceKm > 100 ? 'CRITICAL' : data.distanceKm > 50 ? 'HIGH' : 'LOW',
            riskScore: data.distanceKm > 100 ? 90 : data.distanceKm > 50 ? 70 : 30
          },
          timestamp: Date.now(),
          userId: sessionId || "otp-user-1",
          SDK: "Bargad-v1.0.0"
        };

        events.push(agentUserDistanceEvent);
        console.log('✅ [AGENT-USER] Distance event added (MapmyIndia)');
      } else {
        console.error('❌ [AGENT-USER] API returned error:', data.error);
      }
    } else {
      console.error('❌ [AGENT-USER] Backend returned error status:', response.status);
    }
  } catch (err) {
    console.error('❌ [AGENT-USER] API call failed:', err);
  }
} else {
  console.warn('⚠️ [AGENT-USER] Agent location not found in localStorage');
}
          }
 else {
            console.warn('⚠️ [AGENT-USER] Agent location not found in localStorage');
          }
        } else {
          if (!userLocationEvent) {
            console.warn('⚠️ [AGENT-USER] User location not captured');
          }
          if (!sessionId) {
            console.warn('⚠️ [AGENT-USER] No session ID in URL');
          }
        }

        const hasBankDistance = events.some((e) => e.type === "BANK_DISTANCE");

        if (!hasBankDistance) {
          const locationEvent = events.find((e) => e.type === "DEVICE_LOCATION");

          if (locationEvent && bargadInstance.bankDistanceTracker) {
            console.log('🗺️ [SUBMIT] Calculating bank distance...');
            try {
              const { latitude, longitude } = locationEvent.payload;
              const address = locationEvent.payload.address?.formattedAddress || "Address not available";

              const bankEvent = await bargadInstance.bankDistanceTracker.calculateDistanceToBank(
                latitude,
                longitude,
                "SBI Bank - Shirpur Branch",
                address,
                sessionId || "otp-user-1"
              );

              events.push(bankEvent);
              console.log('✅ [SUBMIT] Bank distance added');
            } catch (err) {
              console.error('❌ [SUBMIT] Bank distance failed:', err);
            }
          }
        }

        console.log(`✅ [SUBMIT] Final: ${events.length} events`);
      } else {
        console.warn('⚠️ [SUBMIT] SDK not loaded');
        events = [
          {
            type: "OTP_VERIFICATION",
            payload: { otp: otp, verified: true },
            timestamp: Date.now(),
            userId: sessionId || "otp-user-1",
            SDK: "Bargad-v1.0.0",
          },
        ];
      }

      if (sessionId) {
        console.log(`✅ [SESSION] Marking session ${sessionId} as verified`);
        localStorage.setItem(
          `verification_${sessionId}`,
          JSON.stringify({
            verified: true,
            timestamp: new Date().toISOString(),
            otp: otp,
            eventCount: events.length,
          })
        );

        window.dispatchEvent(new Event("storage"));
        console.log('📡 [SESSION] Agent Portal notified');
      }

      sessionStorage.setItem('otpEvents', JSON.stringify(events));
      sessionStorage.setItem('otpData', JSON.stringify({ otp, sessionId, timestamp: new Date().toISOString() }));

      console.log('✅ [SUBMIT] Complete, navigating to results...');
      navigate('/otp-results');

    } catch (error) {
      console.error('❌ [SUBMIT] Error:', error);
      alert('Verification error: ' + error.message);
      setIsSubmitting(false);
    }
  };

  if (!sdkReady) {
    return (
      <div className="otp-container">
        <div className="otp-card">
          <div className="loading-spinner"></div>
          <h2>Loading SDK...</h2>
          <p>Initializing device trackers</p>
          {sessionId && <p className="session-id">🔗 Session: {sessionId}</p>}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="otp-container">
        <div className="otp-card error">
          <h2>⚠️ SDK Load Error</h2>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()}>🔄 Reload</button>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <h1>🔐 Verify OTP</h1>
          <p>Enter the 6-digit OTP to complete verification</p>
          {sessionId && <p className="session-id">Session: {sessionId}</p>}
        </div>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="consent-group">
            <label className="consent-label">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={isSubmitting}
                className="consent-checkbox"
              />
              <span className="consent-text">
                I hereby accept terms and conditions of using Bargad.AI
              </span>
            </label>
          </div>

          <div className="otp-input-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* 🆕 Verify button - Never disabled, just shows message */}
          <button
            type="button"
            id="otp-verify-btn"
            className="otp-verify-btn"
            onClick={handleVerifyOtp}
            disabled={isSubmitting || otp.length !== 6 || !consent} 
          >
            VERIFY OTP
          </button>

          {/* 🆕 Show verification message */}
          {/* 🆕 Toast Notification */}
{verificationMessage && (
  <div className={`toast-notification ${verificationMessage.includes('✅') ? 'toast-success' : 'toast-error'}`}>
    <div className="toast-icon">
      {verificationMessage.includes('✅') ? '✅' : '⚠️'}
    </div>
    <div className="toast-content">
      <div className="toast-title">
        {verificationMessage.includes('✅') ? 'Success!' : 'Error'}
      </div>
      <div className="toast-message">
        {verificationMessage.replace('✅', '').replace('⚠️', '').trim()}
      </div>
    </div>
  </div>
)}


          {/* Submit button */}
        </form>

        {/* 🆕 MAP SECTION - Add this before closing </div> of otp-card */}
        {showMap && (
          <div className="map-section" style={{ marginTop: '30px' }}>
            <div className="map-header">
              <h3>📍 Location Verification</h3>
              <p>Your location and nearest bank branch</p>
            </div>
            <div 
              id="mappls-map" 
              style={{ 
                width: '100%', 
                height: '400px', 
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            ></div>
            {bargadInstance?.allEvents?.find(e => e.type === 'BANK_DISTANCE') && (
              <div className="map-info" style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                    Distance to Bank
                  </p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4285F4' }}>
                    {bargadInstance.allEvents.find(e => e.type === 'BANK_DISTANCE').payload.distance.km.toFixed(2)} km
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                    Drive Time
                  </p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#34A853' }}>
                    ~{Math.round(bargadInstance.allEvents.find(e => e.type === 'BANK_DISTANCE').payload.duration.minutes)} min
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
    
  



const calculateTimeDiffs = (attempts) => {
  if (attempts.length < 2) return [];
  const diffs = [];
  for (let i = 1; i < attempts.length; i++) {
    diffs.push((attempts[i].timestamp - attempts[i-1].timestamp) / 1000); // seconds
  }
  return diffs;
};

const calculateOtpRisk = (totalAttempts) => {
  if (totalAttempts === 1) return 0;   // perfect
  if (totalAttempts === 2) return 20;  // normal
  if (totalAttempts === 3) return 40;  // suspicious
  if (totalAttempts <= 5) return 70;   // high risk
  return 95; // very high risk - likely bot
};


// Helper functions remain the same
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function assessAgentUserRisk(distanceKm) {
  let riskScore = 0;
  let riskLevel = "LOW";
  let isSuspicious = false;
  let recommendation = "";
  const reasons = [];

  if (distanceKm > 200) {
    riskScore = 90;
    riskLevel = "CRITICAL";
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away from agent`);
    reasons.push("Physical meeting impossible - likely fraud");
    recommendation = "BLOCK - Require video KYC";
  } else if (distanceKm > 100) {
    riskScore = 70;
    riskLevel = "HIGH";
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away from agent`);
    reasons.push("Different city/region - remote onboarding");
    recommendation = "REVIEW - Verify with video call";
  } else if (distanceKm > 50) {
    riskScore = 50;
    riskLevel = "MEDIUM";
    isSuspicious = true;
    reasons.push(`User is ${distanceKm.toFixed(1)} km away`);
    reasons.push("May require additional verification");
    recommendation = "ALERT - Confirm customer details";
  } else if (distanceKm > 20) {
    riskScore = 30;
    riskLevel = "LOW";
    isSuspicious = false;
    reasons.push(`User is within ${distanceKm.toFixed(1)} km`);
    reasons.push("Normal distance for assisted onboarding");
    recommendation = "ALLOW - Standard verification";
  } else if (distanceKm > 5) {
    riskScore = 10;
    riskLevel = "VERY_LOW";
    isSuspicious = false;
    reasons.push(`User nearby (${distanceKm.toFixed(1)} km)`);
    reasons.push("Likely in same locality");
    recommendation = "ALLOW - Low risk";
  } else {
    riskScore = 0;
    riskLevel = "MINIMAL";
    isSuspicious = false;
    reasons.push(`User very close (${distanceKm.toFixed(1)} km)`);
    reasons.push("Physical presence at branch confirmed");
    recommendation = "FAST-TRACK - User at branch";
  }

  return {
    riskScore,
    riskLevel,
    isSuspicious,
    reasons,
    recommendation
  };
}

export default OTPVerification;
