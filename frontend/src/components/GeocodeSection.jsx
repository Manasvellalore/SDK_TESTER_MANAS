import React, { useEffect, useRef, useState } from "react";
import "../styles/GeocodeSection.css";

const GeocodeSection = ({ customerData, intelligence, sessionInfo }) => {
  const mapRef = useRef(null);
  const [formAddress, setFormAddress] = useState("Loading...");
  const [deviceAddress, setDeviceAddress] = useState("Loading...");
  const [mapAddress, setMapAddress] = useState("Loading...");
  const [mapInstance, setMapInstance] = useState(null);
  const [formLatLng, setFormLatLng] = useState(null);
  const [deviceLatLng, setDeviceLatLng] = useState(null);
  const [mapLatLng, setMapLatLng] = useState(null);

  // Extract user data
  const userName =
    customerData?.customerName || customerData?.name || "Unknown User";
  const formAddressRaw = customerData?.address || "Not provided";

  // Get device coordinates from SDK
  const deviceLocationEvent = intelligence?.sdkData?.find(
    (e) => e.type === "DEVICE_LOCATION",
  );
  const deviceLat =
    deviceLocationEvent?.payload?.latitude || intelligence?.latitude;
  const deviceLng =
    deviceLocationEvent?.payload?.longitude || intelligence?.longitude;

  useEffect(() => {
    console.log("🗺️ [GEOCODE] Component mounted");
    console.log("📍 Device Coordinates:", { lat: deviceLat, lng: deviceLng });
    console.log("📝 Form Address:", formAddressRaw);

    // Set form address immediately
    setFormAddress(formAddressRaw);

    if (!deviceLat || !deviceLng) {
      console.error("⚠️ No device coordinates available");
      setDeviceAddress("No location data available");
      setMapAddress("No location data available");
      return;
    }

    // Set device coordinates
    setDeviceLatLng({ lat: deviceLat, lng: deviceLng });

    // Fetch addresses and geocoding
    fetchAddresses(deviceLat, deviceLng);

    // Geocode form address to get lat/lng
    if (formAddressRaw && formAddressRaw !== "Not provided") {
      geocodeFormAddress(formAddressRaw);
    }

    // Initialize map after 1 second
    const timer = setTimeout(() => initializeMap(), 1000);

    return () => {
      clearTimeout(timer);
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.log("Map cleanup skipped");
        }
      }
    };
  }, [deviceLat, deviceLng, formAddressRaw]);

  const fetchAddresses = async (lat, lng) => {
    try {
      console.log("🌍 [GEOCODE] Fetching device/map address...");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/reverse-geocode`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        },
      );

      const data = await response.json();
      console.log("✅ [GEOCODE] Device address response:", data);

      if (data.success && data.address) {
        const formatted =
          data.address.formatted_address ||
          `${data.address.locality || ""}, ${data.address.city || ""}, ${data.address.state || ""}`.trim();

        setDeviceAddress(formatted || "Address not available");
        setMapAddress(formatted || "Address not available");
        setMapLatLng({ lat, lng }); // Map address uses same coordinates
      } else {
        setDeviceAddress("Address not available");
        setMapAddress("Address not available");
      }
    } catch (error) {
      console.error("❌ [GEOCODE] Error fetching address:", error);
      setDeviceAddress("Error loading address");
      setMapAddress("Error loading address");
    }
  };

  const geocodeFormAddress = async (address) => {
    try {
      console.log("📍 [GEOCODE] Geocoding form address:", address);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/geocode`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        },
      );

      const data = await response.json();
      console.log("✅ [GEOCODE] Form address geocoding:", data);

      if (data.success && data.results && data.results.length > 0) {
        const coords = data.results[0];
        setFormLatLng({
          lat: coords.latitude || coords.lat,
          lng: coords.longitude || coords.lng,
        });
      }
    } catch (error) {
      console.error("❌ [GEOCODE] Form address geocoding failed:", error);
    }
  };

  const initializeMap = () => {
  console.log('🗺️ [GEOCODE] Initializing map with triangulation...');

  // Check if Mappls SDK is loaded
  if (!window.mappls) {
    console.error('⚠️ Mappls SDK not loaded. Loading now...');
    loadMapplsSDK();
    return;
  }

  if (!mapRef.current) {
    console.error('⚠️ Map container not ready');
    return;
  }

  try {
    // Initialize map
    const map = new window.mappls.Map(mapRef.current, {
      center: [deviceLat, deviceLng],
      zoom: 12,
      zoomControl: true,
      location: false
    });

    console.log('✅ [GEOCODE] Map initialized');

    // ✅ CORRECTED: Mappls Marker syntax
    const addMarker = (lat, lng, title, color, popupHtml) => {
      const marker = new window.mappls.Marker({
        map: map,
        position: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      });

      // Mappls popup syntax
      const popup = new window.mappls.Popup({
        content: popupHtml
      });

      marker.bindPopup(popup);
      marker.openPopup();
      
      return marker;
    };

    // 1. Device Location Marker (BLUE)
    if (deviceLat && deviceLng) {
      const deviceMarker = addMarker(
        deviceLat, 
        deviceLng, 
        '📱 Device Location', 
        '#2196f3',
        `
          <div style="padding: 12px; min-width: 200px;">
            <strong style="color: #2196f3;">📱 Device Location</strong><br/>
            <small style="color: #666;">GPS from SDK<br>
            Lat: ${deviceLat.toFixed(6)}<br>Lng: ${deviceLng.toFixed(6)}</small>
          </div>
        `
      );
    }

    // 2. Form Address Marker (RED)
    if (formLatLng) {
      const formMarker = addMarker(
        formLatLng.lat, 
        formLatLng.lng, 
        '📝 Form Address', 
        '#f44336',
        `
          <div style="padding: 12px; min-width: 200px;">
            <strong style="color: #f44336;">📝 Form Address</strong><br/>
            <small style="color: #666;">What user entered<br>
            Lat: ${formLatLng.lat.toFixed(6)}<br>Lng: ${formLatLng.lng.toFixed(6)}</small>
          </div>
        `
      );
    }

    // 3. Map Address Marker (GREEN)
    if (mapLatLng) {
      const mapMarker = addMarker(
        mapLatLng.lat, 
        mapLatLng.lng, 
        '🗺️ Map Address', 
        '#4caf50',
        `
          <div style="padding: 12px; min-width: 200px;">
            <strong style="color: #4caf50;">🗺️ Map Address</strong><br/>
            <small style="color: #666;">Reverse geocoded<br>
            Lat: ${mapLatLng.lat.toFixed(6)}<br>Lng: ${mapLatLng.lng.toFixed(6)}</small>
          </div>
        `
      );
    }

    // Auto-fit map to show all markers
    if (window.mappls && window.mappls.fitBounds) {
      // Collect all coordinates
      const bounds = [];
      if (deviceLat && deviceLng) bounds.push([deviceLat, deviceLng]);
      if (formLatLng) bounds.push([formLatLng.lat, formLatLng.lng]);
      if (mapLatLng) bounds.push([mapLatLng.lat, mapLatLng.lng]);
      
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [20, 20] });
        console.log(`✅ [GEOCODE] Fitted bounds to ${bounds.length} locations`);
      }
    }

    setMapInstance(map);
    console.log('✅ [GEOCODE] Triangulation map ready');

  } catch (error) {
    console.error('❌ [GEOCODE] Map error:', error);
  }
};


  const loadMapplsSDK = (lat, lng) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/mappls-config`)
      .then((res) => res.json())
      .then((config) => {
        const script = document.createElement("script");
        script.src = `https://apis.mappls.com/advancedmaps/api/${config.token}/map_sdk?layer=vector&v=3.0`;
        script.onload = () => {
          console.log("✅ Mappls SDK loaded dynamically");
          setTimeout(() => initializeMap(), 500);
        };
        document.head.appendChild(script);
      })
      .catch((err) => {
        console.error("❌ Failed to load Mappls config:", err);
      });
  };

  return (
    <div className="geocode-section">
      <h2 className="section-title">🗺️ Geocode & Location Triangulation</h2>
      <p className="section-subtitle">
        Triangulation shows form address vs device GPS vs map geocoding - detect
        location fraud
      </p>

      {/* Map Container */}
      <div className="map-container">
        {!deviceLat || !deviceLng ? (
          <div className="map-placeholder">
            <p>⚠️ No device location data</p>
            <small>SDK did not capture GPS coordinates</small>
          </div>
        ) : (
          <div ref={mapRef} className="mappls-map" id="mappls-geocode-map" />
        )}
      </div>

      {/* Address Cards */}
      <div className="address-cards-container">
        {/* Form Address */}
        <div className="address-card form-address-card">
          <div className="address-icon form-icon">📝</div>
          <div className="address-content">
            <div className="address-card-header">
              <h4>Address in Form</h4>
              <span className="distance-pill">
                {(() => {
                  const d = distanceKm(formLatLng, deviceLatLng);
                  return d != null ? `${d.toFixed(2)} km to Device` : "0 km";
                })()}
              </span>
            </div>
            <p className="user-name">{userName}</p>
            <p className="address-text">{formAddress}</p>
          </div>
        </div>

        {/* Device Address */}
        <div className="address-card device-address-card">
          <div className="address-icon device-icon">📱</div>
          <div className="address-content">
            <div className="address-card-header">
              <h4>Device Address</h4>
              <span className="distance-pill">
                {(() => {
                  const d = distanceKm(deviceLatLng, mapLatLng);
                  return d != null ? `${d.toFixed(2)} km to Map` : "0 km";
                })()}
              </span>
            </div>
            <p className="user-name">{userName}</p>
            <p className="address-text">{deviceAddress}</p>
          </div>
        </div>

        {/* Map Address */}
        <div className="address-card map-address-card">
          <div className="address-icon map-icon">🗺️</div>
          <div className="address-content">
            <div className="address-card-header">
              <h4>Address on Map</h4>
              <span className="distance-pill">
                {(() => {
                  const d = distanceKm(mapLatLng, formLatLng);
                  return d != null ? `${d.toFixed(2)} km to Form` : "0 km";
                })()}
              </span>
            </div>
            <p className="user-name">{userName}</p>
            <p className="address-text">{mapAddress}</p>
          </div>
        </div>
      </div>

      {/* Triangulation Status */}
      <div className="triangulation-analysis">
        <h4>🔍 Triangulation Fraud Detection</h4>
        <p>
          The map shows all 3 locations as markers. A red polygon connects them
          when locations differ.
        </p>
        {formLatLng && deviceLatLng && mapLatLng && (
          <div className="risk-indicator">
            <strong>Distance Spread:</strong>{" "}
            {calculateSpread(formLatLng, deviceLatLng, mapLatLng).toFixed(2)} km
            <span
              className={`risk-badge ${calculateSpread(formLatLng, deviceLatLng, mapLatLng) > 5 ? "high-risk" : "low-risk"}`}
            >
              {calculateSpread(formLatLng, deviceLatLng, mapLatLng) > 5
                ? "⚠️ HIGH RISK"
                : "✅ LOW RISK"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: distance in km between two lat/lng points (Haversine)
const distanceKm = (p1, p2) => {
  if (!p1 || !p2 || p1.lat == null || p1.lng == null || p2.lat == null || p2.lng == null)
    return null;
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const d =
    R *
    Math.acos(
      Math.sin(toRad(p1.lat)) * Math.sin(toRad(p2.lat)) +
        Math.cos(toRad(p1.lat)) *
          Math.cos(toRad(p2.lat)) *
          Math.cos(toRad(p2.lng - p1.lng))
    );
  return d;
};

// Helper function to calculate spread between 3 points
const calculateSpread = (p1, p2, p3) => {
  const R = 6371; // Earth's radius in km
  const toRad = (x) => (x * Math.PI) / 180;

  const dist12 =
    R *
    Math.acos(
      Math.sin(toRad(p1.lat)) * Math.sin(toRad(p2.lat)) +
        Math.cos(toRad(p1.lat)) *
          Math.cos(toRad(p2.lat)) *
          Math.cos(toRad(p2.lng - p1.lng)),
    );
  const dist13 =
    R *
    Math.acos(
      Math.sin(toRad(p1.lat)) * Math.sin(toRad(p3.lat)) +
        Math.cos(toRad(p1.lat)) *
          Math.cos(toRad(p3.lat)) *
          Math.cos(toRad(p3.lng - p1.lng)),
    );
  const dist23 =
    R *
    Math.acos(
      Math.sin(toRad(p2.lat)) * Math.sin(toRad(p3.lat)) +
        Math.cos(toRad(p2.lat)) *
          Math.cos(toRad(p3.lat)) *
          Math.cos(toRad(p3.lng - p2.lng)),
    );

  return Math.max(dist12, dist13, dist23);
};


// ✅ Mappls helper functions
const addMarker = (map, lat, lng, title, popupHtml) => {
  const marker = new window.mappls.Marker({
    map: map,
    position: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    }
  });

  const popup = new window.mappls.Popup({
    content: popupHtml
  });

  marker.bindPopup(popup);
  marker.openPopup();
  
  return marker;
};


export default GeocodeSection;
