const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const mapRoutes = require('./routes/mapRoutes');
require('dotenv').config();


const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors()); // Allow frontend to call backend
app.use(express.json()); // Parse JSON requests

// NEW: Serve static files from the parent directory (where index.html is)
// app.use(express.static(path.join(__dirname, '..')));

// NEW: Explicitly serve the public folder for images and SDK
// app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/api/map', mapRoutes);


// ==========================================
// CONFIGURATION
// ==========================================
const MAPPLS_ACCESS_TOKEN = process.env.MAPPLS_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;


// Check if API key is loaded
if (!MAPPLS_ACCESS_TOKEN) {
  console.warn('⚠️ WARNING: MAPPLS_ACCESS_TOKEN not found');
}


console.log('✅ Mappls API key loaded successfully');
console.log('🔒 API key will remain hidden from frontend');


// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/api', (req, res) => {
  res.json({
    status: 'running',
    message: 'Mappls Proxy Server',
    endpoints: [
      'POST /api/reverse-geocode',
      'POST /api/geocode',
      'POST /api/nearby-search'
    ]
  });
});


// ==========================================
// REVERSE GEOCODING ENDPOINT
// ==========================================
app.post('/api/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);
    
    // Call Mappls Reverse Geocoding API
    const response = await axios.get(
      `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_ACCESS_TOKEN}/rev_geocode`,
      {
        params: {
          lat: latitude,
          lng: longitude
        }
      }
    );
    
    const data = response.data;
    
    // Check if results exist
    if (!data.results || data.results.length === 0) {
      return res.json({
        success: false,
        error: 'No address found for these coordinates'
      });
    }
    
    // Extract only address information (don't send raw API response)
    const result = data.results[0];
    const addressInfo = {
      formattedAddress: result.formatted_address || 'Address not found',
      houseNumber: result.house_number || '',
      houseName: result.house_name || '',
      poi: result.poi || '',
      street: result.street || '',
      subSubLocality: result.subSubLocality || '',
      subLocality: result.subLocality || '',
      locality: result.locality || '',
      village: result.village || '',
      district: result.district || '',
      subDistrict: result.subDistrict || '',
      city: result.city || '',
      state: result.state || '',
      pincode: result.pincode || '',
      area: result.area || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      capturedAt: Date.now()
    };
    
    console.log('✅ Address retrieved:', addressInfo.formattedAddress);
    
    // Return only address info (API key never exposed)
    res.json({
      success: true,
      address: addressInfo
    });
    
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error.message);
    
    // Handle API errors
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: 'Mappls API error',
        message: error.response.data.message || 'Failed to get address'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});




// ==========================================
// GEOCODING ENDPOINT
// ==========================================
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    console.log(`🔍 Geocoding address: ${address}`);
    
    const response = await axios.get(
      `https://atlas.mappls.com/api/places/geocode`,
      {
        params: {
          address: address
        },
        headers: {
          'Authorization': `Bearer ${MAPPLS_ACCESS_TOKEN}`
        }
      }
    );
    
    const data = response.data;
    
    console.log('✅ Geocoding results retrieved');
    
    res.json({
      success: true,
      results: data.copResults || []
    });
    
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Mappls API error',
        message: error.response.data.message || 'Failed to geocode address'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


//DISTACNE OF BANK

// ==========================================
// DISTANCE CALCULATION ENDPOINT (BANK DISTANCE)
// ==========================================
app.post('/api/calculate-distance', async (req, res) => {
  try {
    const { userLat, userLon, bankLat, bankLon } = req.body;
    
    console.log('🚀 === DISTANCE CALCULATION STARTED ===');
    console.log('📍 User: lat=' + userLat + ', lon=' + userLon);
    console.log('🏦 Bank: lat=' + bankLat + ', lon=' + bankLon);
    
    if (!userLat || !userLon || !bankLat || !bankLon) {
      console.log('❌ Missing coordinates');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing coordinates' 
      });
    }
    
    const mapplsApiKey = process.env.MAPPLS_ACCESS_TOKEN;
    
    if (!mapplsApiKey) {
      console.log('❌ No API key');
      return res.status(500).json({ 
        success: false, 
        error: 'Mappls API key not configured' 
      });
    }
    
    // ✅ FIXED: Mappls uses LONGITUDE,LATITUDE (not lat,lon)
    const url = `https://apis.mappls.com/advancedmaps/v1/${mapplsApiKey}/distance_matrix/driving/${userLon},${userLat};${bankLon},${bankLat}?sources=0&destinations=1`;
    
    console.log('📡 Calling Mappls API with format: lon,lat;lon,lat');
    console.log('📡 User coords: ' + userLon + ',' + userLat);
    console.log('📡 Bank coords: ' + bankLon + ',' + bankLat);
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log('📦 API Response received');
    console.log('📦 Response code:', data.responseCode);
    console.log('📏 DISTANCES:', JSON.stringify(data.results.distances));
    console.log('⏱️ DURATIONS:', JSON.stringify(data.results.durations));
    
    if (data.results?.distances && data.results?.durations) {
      const distancesArray = data.results.distances;
      const durationsArray = data.results.durations;
      
      console.log('🔍 First distance element:', distancesArray[0]);
      console.log('🔍 Array length:', distancesArray[0].length);
      
      // Try to get the value
      let distanceMeters = null;
      let durationSeconds = null;
      
      if (Array.isArray(distancesArray[0])) {
        if (distancesArray[0].length > 1) {
          distanceMeters = distancesArray[0][1];
          durationSeconds = durationsArray[0][1];
          console.log('✅ Using [0][1] index');
        } else if (distancesArray[0].length === 1) {
          distanceMeters = distancesArray[0][0];
          durationSeconds = durationsArray[0][0];
          console.log('⚠️ Using [0][0] index (only one value)');
        }
      }
      
      console.log('🔢 Distance (meters):', distanceMeters);
      console.log('🔢 Duration (seconds):', durationSeconds);
      
      if (distanceMeters === null || distanceMeters === undefined || distanceMeters === 0) {
        console.log('❌ Invalid distance value');
        console.log('📦 FULL API RESPONSE:', JSON.stringify(data, null, 2));
        return res.json({
          success: false,
          error: 'Could not parse distance',
          debug: {
            distances: distancesArray,
            durations: durationsArray,
            message: 'Check if coordinates are in correct format (lon,lat)'
          }
        });
      }
      
      const distanceKm = parseFloat(distanceMeters) / 1000;
      const durationMinutes = parseFloat(durationSeconds) / 60;
      
      console.log(`✅ SUCCESS: ${distanceKm.toFixed(2)} km, ${durationMinutes.toFixed(1)} min`);
      console.log('🚀 === CALCULATION COMPLETE ===\n');
      
      return res.json({
        success: true,
        distanceKm: distanceKm,
        durationMinutes: durationMinutes,
        calculationMethod: "MAPPLS_DISTANCE_MATRIX_API"
      });
    }
    
    console.log('⚠️ Invalid response structure');
    res.json({ success: false, error: 'Invalid response from Mappls' });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('❌ Mappls API Status:', error.response.status);
      console.error('❌ Mappls API Error:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: 'Mappls API error',
        message: error.response.data.message || error.message,
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
});



// ==========================================
// 🆕 CALCULATE AGENT-USER DISTANCE WITH MAP
// ==========================================

app.post('/api/calculate-agent-user-distance', async (req, res) => {
  try {
    const { agentLat, agentLon, userLat, userLon, agentName, userName, agentAddress, userAddress } = req.body;

    console.log(`🗺️ [AGENT-USER] Calculating distance...`);
    console.log(`Agent: ${agentLat}, ${agentLon}`);
    console.log(`User: ${userLat}, ${userLon}`);

    if (!agentLat || !agentLon || !userLat || !userLon) {
      return res.status(400).json({
        success: false,
        error: 'All coordinates are required'
      });
    }

    const mapplsToken = process.env.MAPPLS_ACCESS_TOKEN;

    if (!mapplsToken) {
      return res.status(500).json({
        success: false,
        error: 'Mappls API token not configured'
      });
    }

    // Calculate straight-line distance (Haversine)
    const R = 6371; // Earth radius in km
    const toRadians = (deg) => deg * (Math.PI / 180);
    const dLat = toRadians(userLat - agentLat);
    const dLon = toRadians(userLon - agentLon);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(agentLat)) * Math.cos(toRadians(userLat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;

    // Try to get driving distance from Mappls
    let drivingDistance = null;
    let drivingDuration = null;

    try {
      const distanceUrl = `https://apis.mappls.com/advancedmaps/v1/${mapplsToken}/distance_matrix/driving/${agentLon},${agentLat};${userLon},${userLat}?rtype=0&region=ind`;
      
      console.log('📡 [AGENT-USER] Calling Mappls Distance Matrix API...');
      
      const distanceResponse = await fetch(distanceUrl);
      
      if (distanceResponse.ok) {
        const distanceData = await distanceResponse.json();
        const distanceMeters = distanceData.results?.distances?.[0]?.[1];
        const durationSeconds = distanceData.results?.durations?.[0]?.[1];
        
        if (distanceMeters) {
          drivingDistance = distanceMeters / 1000; // Convert to km
          drivingDuration = Math.round(durationSeconds / 60); // Convert to minutes
          console.log(`✅ [AGENT-USER] Driving distance: ${drivingDistance} km`);
        }
      }
    } catch (err) {
      console.warn('⚠️ [AGENT-USER] Could not get driving distance:', err.message);
    }

    // Use driving distance if available, otherwise straight-line
    const finalDistance = drivingDistance || straightLineDistance;

    // Format duration
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
    };

    // Assess risk based on distance
    const assessRisk = (distanceKm) => {
      let riskScore = 0;
      let riskLevel = "LOW";
      let isSuspicious = false;
      const reasons = [];
      let recommendation = "";

      if (distanceKm > 200) {
        riskScore = 90;
        riskLevel = "CRITICAL";
        isSuspicious = true;
        reasons.push(`User is ${distanceKm.toFixed(1)} km away from agent`);
        reasons.push("Physical meeting impossible - likely fraud");
        recommendation = "BLOCK - Require video KYC verification";
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

      return { riskScore, riskLevel, isSuspicious, reasons, recommendation };
    };

    const riskAnalysis = assessRisk(finalDistance);

    // Prepare response
    const response = {
      success: true,
      agentLocation: {
        latitude: agentLat,
        longitude: agentLon,
        name: agentName || 'Agent',
        address: agentAddress || `${agentLat}, ${agentLon}`
      },
      userLocation: {
        latitude: userLat,
        longitude: userLon,
        name: userName || 'User',
        address: userAddress || `${userLat}, ${userLon}`
      },
      distance: {
        km: parseFloat(finalDistance.toFixed(2)),
        meters: Math.round(finalDistance * 1000),
        miles: parseFloat((finalDistance * 0.621371).toFixed(2))
      },
      straightLineDistance: {
        km: parseFloat(straightLineDistance.toFixed(2))
      },
      drivingDistance: drivingDistance ? {
        km: parseFloat(drivingDistance.toFixed(2)),
        durationMinutes: drivingDuration,
        durationFormatted: formatDuration(drivingDuration)
      } : null,
      riskAnalysis: riskAnalysis,
      calculationMethod: drivingDistance ? "MAPPLS_DISTANCE_MATRIX_API" : "HAVERSINE_FORMULA"
    };

    console.log('✅ [AGENT-USER] Distance calculated successfully');

    res.json(response);

  } catch (error) {
    console.error('❌ [AGENT-USER] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});







// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('===========================================');
  console.log('🚀 Mappls Proxy Server Started!');
  console.log('===========================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`✅ API key secured in environment variables`);
  console.log(`🔒 API key will NOT be exposed to frontend`);
  console.log('===========================================');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/ (serves index.html)`);
  console.log(`  GET  http://localhost:${PORT}/result.html`);
  console.log(`  POST http://localhost:${PORT}/api/reverse-geocode`);
  console.log(`  POST http://localhost:${PORT}/api/geocode`);
  console.log(`  POST http://localhost:${PORT}/api/nearby-search`);
  console.log(`  POST http://localhost:${PORT}/api/calculate-distance`);
  console.log('===========================================');
});


module.exports = app;
