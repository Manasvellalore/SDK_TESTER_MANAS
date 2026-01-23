import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/OTPResults.css";

function OTPResults() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [otpData, setOtpData] = useState(null);
  const [mapErrors, setMapErrors] = useState({}); // Track map errors by index

  useEffect(() => {
    const storedEvents = sessionStorage.getItem('otpEvents');
    const storedOtpData = sessionStorage.getItem('otpData');

    if (!storedEvents) {
      console.warn('No OTP events found, redirecting...');
      navigate('/verify-otp');
      return;
    }

    try {
      const parsedEvents = JSON.parse(storedEvents);
      setEvents(parsedEvents);
      setOtpData(JSON.parse(storedOtpData));
      
      // 🆕 DEBUG: Check what events we have
      console.log('📊 [DEBUG] Total events:', parsedEvents.length);
      console.log('📊 [DEBUG] Event types:', parsedEvents.map(e => e.type));
      const agentUserEvent = parsedEvents.find(e => e.type === 'AGENT_USER_DISTANCE');
      console.log('📊 [DEBUG] Agent-User Distance event:', agentUserEvent);
      
    } catch (error) {
      console.error('Error parsing stored data:', error);
    }
  }, [navigate]);

  const copyToClipboard = () => {
    const jsonText = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(jsonText);
    alert('✅ JSON copied to clipboard!');
  };

  // Helper function for addresses
  const getAddress = (addr) => {
    if (typeof addr === 'string') return addr;
    if (addr && typeof addr === 'object') {
      return addr.formattedAddress || addr.formatted_address || addr.address || `${addr.latitude || ''}, ${addr.longitude || ''}`;
    }
    return 'Address not available';
  };

  if (!events.length) {
    return (
      <div className="otp-results-page">
        <div className="otp-results-container">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="otp-results-page">
      <div className="otp-results-container">
        {/* HEADER + META */}
        <div className="otp-results-header-block">
          <h1 className="otp-results-header">OTP Verification Results</h1>
          <p className="otp-results-subtitle">
            SDK Captured Data - Agent-Assisted Model
          </p>
          {otpData && (
            <div className="otp-results-meta">
              <span className="meta-pill">
                Session: {otpData.sessionId || 'N/A'}
              </span>
              <span className="meta-pill">
                Timestamp: {new Date(otpData.timestamp).toLocaleString()}
              </span>
              <span className="meta-pill">
                Events: {events.length}
              </span>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="otp-results-actions">
          <button onClick={copyToClipboard} className="btn-primary">
            📋 Copy JSON
          </button>
          <button
            onClick={() => navigate('/verify-otp')}
            className="btn-secondary"
          >
            ← Back to Verification
          </button>
        </div>

        {/* RESULTS GRID */}
        <div className="otp-results-grid">
          {events.map((event, index) => {
            // SPECIAL RENDER FOR AGENT_USER_DISTANCE
            if (event.type === 'AGENT_USER_DISTANCE') {
              const { agentLocation, userLocation, distance, drivingDistance, riskAnalysis, calculationMethod } = event.payload;

              return (
                <div key={index} className="otp-result-card agent-user-distance-card">
                  <div className="otp-result-card-header">
                    <span className="otp-result-tag">🗺️ {event.type}</span>
                    <span className="otp-result-time">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="otp-result-body">
                    {/* MapmyIndia Map */}
                    <MapmyIndiaAgentUserMap
                      agentLocation={agentLocation}
                      userLocation={userLocation}
                      distance={distance}
                      mapId={`mappls-agent-user-map-${index}`}
                      onError={(error) => setMapErrors({...mapErrors, [index]: error})}
                    />

                    {/* Show map container or error */}
                    {mapErrors[index] ? (
                      <div className="map-error-container" style={{
                        background: '#fff3cd',
                        border: '2px solid #ffc107',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '20px',
                        textAlign: 'center'
                      }}>
                        <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>
                          ⚠️ Map Not Available
                        </h3>
                        <p style={{ color: '#856404', margin: '8px 0', fontSize: '14px' }}>
                          <strong>Reason:</strong> {mapErrors[index]}
                        </p>
                        <p style={{ color: '#856404', margin: '8px 0', fontSize: '13px' }}>
                          The distance was calculated successfully using <strong>{calculationMethod}</strong>
                        </p>
                        <details style={{ marginTop: '12px', textAlign: 'left' }}>
                          <summary style={{ cursor: 'pointer', color: '#856404', fontWeight: 'bold' }}>
                            🔧 Troubleshooting Steps
                          </summary>
                          <ul style={{ marginTop: '10px', fontSize: '12px', color: '#856404' }}>
                            <li>Check if MapmyIndia API key is valid in backend/.env</li>
                            <li>Verify domain is authorized in MapmyIndia dashboard</li>
                            <li>Check browser console for detailed error messages</li>
                            <li>Ensure MapmyIndia script loaded in index.html</li>
                          </ul>
                        </details>
                      </div>
                    ) : (
                      <div 
                        id={`mappls-agent-user-map-${index}`}
                        className="distance-map-mappls"
                        style={{
                          height: '400px',
                          width: '100%',
                          borderRadius: '10px',
                          marginBottom: '20px',
                          border: '2px solid #e0e0e0'
                        }}
                      ></div>
                    )}

                    {/* Distance details */}
                    <div className="distance-details">
                      <div className="location-info agent-location">
                        <h4>🔵 Agent Location</h4>
                        <p><strong>Name:</strong> {agentLocation.name}</p>
                        <p><strong>Address:</strong> {getAddress(agentLocation.address)}</p>
                        <p><strong>Coordinates:</strong> {agentLocation.latitude.toFixed(6)}, {agentLocation.longitude.toFixed(6)}</p>
                      </div>

                      <div className="location-info user-location">
                        <h4>🔴 User Location</h4>
                        <p><strong>Name:</strong> {userLocation.name}</p>
                        <p><strong>Address:</strong> {getAddress(userLocation.address)}</p>
                        <p><strong>Coordinates:</strong> {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
                      </div>

                      <div className="distance-metrics">
                        <h4>📏 Distance Analysis</h4>
                        <p><strong>Distance:</strong> {distance.km} km ({distance.miles} miles)</p>
                        <p><strong>Meters:</strong> {distance.meters.toLocaleString()} m</p>
                        {drivingDistance && (
                          <>
                            <p><strong>🚗 Driving Distance:</strong> {drivingDistance.km} km</p>
                            <p><strong>⏱️ Estimated Time:</strong> {drivingDistance.durationFormatted}</p>
                          </>
                        )}
                        <p><strong>Method:</strong> {calculationMethod}</p>
                        {calculationMethod === 'MAPPLS_DISTANCE_MATRIX_API' && (
                          <p style={{ color: '#4CAF50', fontSize: '12px', marginTop: '8px' }}>
                            ✅ Calculated using MapmyIndia API (Real driving distance)
                          </p>
                        )}
                      </div>

                      <div
                        className={`risk-analysis risk-${riskAnalysis.riskLevel
                          .toLowerCase()
                          .replace('_', '-')}`}
                      >
                        <h4>⚠️ Risk Analysis</h4>
                        <p>
                          <strong>Risk Level:</strong>{' '}
                          <span
                            className={`risk-badge risk-${riskAnalysis.riskLevel
                              .toLowerCase()
                              .replace('_', '-')}`}
                          >
                            {riskAnalysis.riskLevel}
                          </span>
                        </p>
                        <p><strong>Risk Score:</strong> {riskAnalysis.riskScore}/100</p>
                        <p>
                          <strong>Suspicious:</strong>{' '}
                          {riskAnalysis.isSuspicious ? (
                            <span style={{ color: '#c62828', fontWeight: 'bold' }}>YES ⚠️</span>
                          ) : (
                            <span style={{ color: '#43a047', fontWeight: 'bold' }}>NO ✅</span>
                          )}
                        </p>
                        <div className="risk-reasons">
                          <strong>Reasons:</strong>
                          <ul>
                            {riskAnalysis.reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="recommendation">
                          <strong>💡 Recommendation:</strong> {riskAnalysis.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Raw JSON (collapsible) */}
                    <details className="raw-json-details">
                      <summary>📄 View Raw JSON</summary>
                      <pre className="otp-result-json">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              );
            }

            // DEFAULT RENDER FOR OTHER EVENTS
            return (
              <div key={index} className="otp-result-card">
                <div className="otp-result-card-header">
                  <span className="otp-result-tag">{event.type}</span>
                  <span className="otp-result-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="otp-result-body">
                  <pre className="otp-result-json">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// MapmyIndia Map Component for Agent-User Distance
function MapmyIndiaAgentUserMap({ agentLocation, userLocation, distance, mapId, onError }) {
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    // Check if Mappls is available
    if (!window.Mappls) {
      console.error('❌ [MAP] Mappls object not found');
      onError('MapmyIndia SDK not loaded. Check if script is added to index.html');
      return;
    }

    if (mapInitialized) return;

    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
      console.error('❌ [MAP] Map element not found:', mapId);
      onError('Map container element not found');
      return;
    }

    try {
      console.log('🗺️ [MAP] Initializing Agent-User map...');

      // Calculate center point
      const centerLat = (agentLocation.latitude + userLocation.latitude) / 2;
      const centerLon = (agentLocation.longitude + userLocation.longitude) / 2;

      // Initialize map
      const map = new window.Mappls.Map(mapId, {
        center: [centerLat, centerLon],
        zoom: 10,
        zoomControl: true,
        location: false
      });

      // Add Agent marker (Blue)
      new window.Mappls.Marker({
        map: map,
        position: [agentLocation.latitude, agentLocation.longitude],
        fitbounds: false,
        icon_url: 'https://apis.mapmyindia.com/map_v3/1.png',
        popupHtml: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #4285F4;">🔵 ${agentLocation.name}</h3>
            <p style="margin: 4px 0; font-size: 13px;">${agentLocation.address}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Lat: ${agentLocation.latitude.toFixed(6)}, Lon: ${agentLocation.longitude.toFixed(6)}
            </p>
          </div>
        `
      });

      // Add User marker (Red)
      new window.Mappls.Marker({
        map: map,
        position: [userLocation.latitude, userLocation.longitude],
        fitbounds: false,
        icon_url: 'https://apis.mapmyindia.com/map_v3/2.png',
        popupHtml: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #EA4335;">🔴 ${userLocation.name}</h3>
            <p style="margin: 4px 0; font-size: 13px;">${userLocation.address}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Lat: ${userLocation.latitude.toFixed(6)}, Lon: ${userLocation.longitude.toFixed(6)}
            </p>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Distance:</strong> ${distance.km.toFixed(2)} km</p>
          </div>
        `
      });

      // Fit bounds to show both markers
      map.fitBounds([
        [agentLocation.latitude, agentLocation.longitude],
        [userLocation.latitude, userLocation.longitude]
      ], {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000
      });

      setMapInitialized(true);
      console.log('✅ [MAP] Agent-User map initialized');

    } catch (error) {
      console.error('❌ [MAP] Failed to initialize:', error);
      onError(`Map initialization failed: ${error.message}`);
    }
  }, [agentLocation, userLocation, distance, mapId, mapInitialized, onError]);

  return null;
}

export default OTPResults;
