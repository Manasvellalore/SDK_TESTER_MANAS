import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user icon (blue)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom bank icon (red/green based on risk)
const createBankIcon = (isRisky) => new L.Icon({
  iconUrl: isRisky 
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fetch and display real route
function RealRouteLayer({ userPos, bankPos, distanceKm }) {
  const [routePath, setRoutePath] = useState(null);
  const map = useMap();

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        console.log('🗺️ Fetching route via OSRM...');
        
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${bankPos[1]},${bankPos[0]}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Convert [lon, lat] to [lat, lon] for Leaflet
          const path = coordinates.map(coord => [coord[1], coord[0]]);
          
          setRoutePath(path);
          
          // Fit map to route
          const bounds = L.latLngBounds(path);
          map.fitBounds(bounds, { padding: [50, 50] });
          
          console.log('✅ Route loaded');
        } else {
          console.warn('⚠️ Route failed, using straight line');
          setRoutePath([userPos, bankPos]);
        }
      } catch (error) {
        console.error('❌ Route fetch failed:', error);
        setRoutePath([userPos, bankPos]);
      }
    };

    if (userPos && bankPos) {
      fetchRoute();
    }
  }, [userPos, bankPos, map]);

  if (!routePath) return null;

  // Get line color based on distance
  const getLineColor = () => {
    if (distanceKm < 5) return '#4CAF50';
    if (distanceKm < 20) return '#FFC107';
    if (distanceKm < 50) return '#FF9800';
    return '#F44336';
  };

  return (
    <Polyline
      positions={routePath}
      color={getLineColor()}
      weight={4}
      opacity={0.7}
    />
  );
}

function MapView({ bankDistanceEvent }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef(null);

  // Extract data safely
  const hasData = bankDistanceEvent && bankDistanceEvent.payload;
  const userLocation = hasData ? bankDistanceEvent.payload.userLocation : null;
  const targetBank = hasData ? bankDistanceEvent.payload.targetBank : null;
  const distanceKm = hasData ? bankDistanceEvent.payload.distanceKm : 0;
  const riskLevel = hasData ? bankDistanceEvent.payload.riskLevel : 'UNKNOWN';
  const riskScore = hasData ? bankDistanceEvent.payload.riskScore : 0;
  const recommendation = hasData ? bankDistanceEvent.payload.recommendation : '';
  const riskReasons = hasData ? bankDistanceEvent.payload.riskReasons : [];

  const getRiskEmoji = () => {
    if (riskLevel === 'CRITICAL' || riskLevel === 'VERY_HIGH') return '🚨';
    if (riskLevel === 'HIGH') return '⚠️';
    if (riskLevel === 'MEDIUM') return '⚡';
    return '✅';
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!hasData) {
    return (
      <div className="map-error">
        <p>⚠️ No location data available</p>
      </div>
    );
  }

  if (!userLocation || !targetBank) {
    return <div className="map-error">❌ Invalid location data</div>;
  }

  const userPos = [userLocation.latitude, userLocation.longitude];
  const bankPos = [targetBank.latitude, targetBank.longitude];
  const center = [
    (userLocation.latitude + targetBank.latitude) / 2,
    (userLocation.longitude + targetBank.longitude) / 2
  ];

  const isRisky = distanceKm > 50;

  // Helper function for address
  const getAddress = (addr) => {
    if (typeof addr === 'string') return addr;
    if (addr && typeof addr === 'object') {
      return addr.formattedAddress || addr.formatted_address || addr.address || 'Address not available';
    }
    return 'Address not available';
  };

  return (
    <div className={`map-view-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="map-header">
        <div className="map-title">
          <span className="map-icon">🗺️</span>
          <h3>Distance Visualization</h3>
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '📉 Exit Fullscreen' : '📈 Fullscreen'}
        </button>
      </div>

      <div className="map-content-wrapper">
        {/* Info Cards */}
        <div className="map-info-cards">
          <div className={`info-card risk-${riskLevel?.toLowerCase()}`}>
            <div className="info-label">Distance</div>
            <div className="info-value">{distanceKm} km</div>
          </div>

          <div className={`info-card risk-${riskLevel?.toLowerCase()}`}>
            <div className="info-label">Risk Level</div>
            <div className="info-value">{getRiskEmoji()} {riskLevel}</div>
          </div>

          <div className={`info-card risk-${riskLevel?.toLowerCase()}`}>
            <div className="info-label">Risk Score</div>
            <div className="info-value">{riskScore}/100</div>
          </div>

          <div className={`info-card risk-${riskLevel?.toLowerCase()}`}>
            <div className="info-label">Recommendation</div>
            <div className="info-value-small">{recommendation}</div>
          </div>
        </div>

        {/* Map with OpenStreetMap Tiles */}
        <MapContainer
          center={center}
          zoom={10}
          className="leaflet-map"
          ref={mapRef}
          style={{ 
            height: isFullscreen ? 'calc(100vh - 250px)' : '500px',
            width: '100%',
            borderRadius: '10px'
          }}
        >
          {/* 🆕 OpenStreetMap Standard Tiles (Same as Agent-User) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Real Route */}
          <RealRouteLayer 
            userPos={userPos} 
            bankPos={bankPos} 
            distanceKm={distanceKm}
          />

          {/* User Marker (Blue) */}
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div className="popup-content">
                <h4>👤 Your Location</h4>
                <p><strong>Address:</strong></p>
                <p>{getAddress(userLocation.address)}</p>
                <p><strong>Coordinates:</strong></p>
                <p>{userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>

          {/* Bank Marker (Red/Green) */}
          <Marker position={bankPos} icon={createBankIcon(isRisky)}>
            <Popup>
              <div className="popup-content">
                <h4>🏦 {targetBank.name}</h4>
                <p><strong>Address:</strong></p>
                <p>{getAddress(targetBank.address)}</p>
                <p><strong>Coordinates:</strong></p>
                <p>{targetBank.latitude.toFixed(6)}, {targetBank.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Location Details Below Map */}
        <div className="distance-details">
          <div className="location-info user-location">
            <h4>🔴 User Location</h4>
            <p><strong>Address:</strong> {getAddress(userLocation.address)}</p>
            <p><strong>Coordinates:</strong> {userPos[0].toFixed(6)}, {userPos[1].toFixed(6)}</p>
          </div>

          <div className="location-info bank-location">
            <h4>🏦 Target Bank</h4>
            <p><strong>Name:</strong> {targetBank.name}</p>
            <p><strong>Address:</strong> {getAddress(targetBank.address)}</p>
            <p><strong>Coordinates:</strong> {bankPos[0].toFixed(6)}, {bankPos[1].toFixed(6)}</p>
          </div>

          {riskReasons && riskReasons.length > 0 && (
            <div className={`risk-analysis risk-${riskLevel.toLowerCase().replace('_', '-')}`}>
              <h4>⚠️ Risk Analysis</h4>
              <p>
                <strong>Risk Level:</strong>{' '}
                <span className={`risk-badge risk-${riskLevel.toLowerCase().replace('_', '-')}`}>
                  {riskLevel}
                </span>
              </p>
              <p><strong>Risk Score:</strong> {riskScore}/100</p>
              <div className="risk-reasons">
                <strong>Reasons:</strong>
                <ul>
                  {riskReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
              <p className="recommendation">
                <strong>💡 Recommendation:</strong> {recommendation}
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-title">📊 Map Legend</div>
          <div className="legend-item">
            <span className="legend-marker" style={{background: '#2196F3'}}>🔵</span>
            <span>User Location</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker" style={{background: isRisky ? '#F44336' : '#4CAF50'}}>
              {isRisky ? '🔴' : '🟢'}
            </span>
            <span>Bank Location ({isRisky ? 'High Risk' : 'Safe'})</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#4CAF50'}}></span>
            <span>Route: 0-5 km</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#FFC107'}}></span>
            <span>Route: 5-20 km</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#FF9800'}}></span>
            <span>Route: 20-50 km</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#F44336'}}></span>
            <span>Route: 50+ km</span>
          </div>
          <div style={{marginTop: '10px', fontSize: '11px', color: '#666'}}>
            🗺️ Map: OpenStreetMap | Route: OSRM
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;
