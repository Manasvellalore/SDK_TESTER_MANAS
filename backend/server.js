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

app.use('/api/map', mapRoutes);

// ✅ NEW: In-memory session storage (use database in production)
const sessions = {};

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
      'POST /api/nearby-search',
      'POST /api/calculate-distance',
      'POST /api/save-sdk-data',
      'GET /api/check-verification/:sessionId',
      'GET /api/dashboard-data/:sessionId'
    ]
  });
});

// ==========================================
// REVERSE GEOCODING ENDPOINT
// ==========================================
app.post('/api/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);
    
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
    
    if (!data.results || data.results.length === 0) {
      return res.json({
        success: false,
        error: 'No address found for these coordinates'
      });
    }
    
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
    
    res.json({
      success: true,
      address: addressInfo
    });
    
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error.message);
    
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
// CALCULATE AGENT-USER DISTANCE WITH MAP
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
    const R = 6371;
    const toRadians = (deg) => deg * (Math.PI / 180);
    const dLat = toRadians(userLat - agentLat);
    const dLon = toRadians(userLon - agentLon);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(agentLat)) * Math.cos(toRadians(userLat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;

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
          drivingDistance = distanceMeters / 1000;
          drivingDuration = Math.round(durationSeconds / 60);
          console.log(`✅ [AGENT-USER] Driving distance: ${drivingDistance} km`);
        }
      }
    } catch (err) {
      console.warn('⚠️ [AGENT-USER] Could not get driving distance:', err.message);
    }

    const finalDistance = drivingDistance || straightLineDistance;

    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
    };

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
// ✅ NEW: SAVE SDK DATA FROM USER'S DEVICE
// ==========================================
app.post('/api/save-sdk-data', async (req, res) => {
  try {
    const { sessionId, sdkData } = req.body;

    console.log(`💾 [SDK] Saving data for session: ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Store or update session data
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        sessionId,
        verified: true,
        createdAt: Date.now()
      };
    }

    sessions[sessionId].sdkData = sdkData;
    sessions[sessionId].updatedAt = Date.now();

    console.log(`✅ [SDK] Data saved. Total events: ${sdkData?.totalEvents || 0}`);

    // ✅ NEW: Submit to Scoreplex
    try {
      console.log('🔍 [SCOREPLEX] Submitting search...');
      
      const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;
      
      if (!scoreplexApiKey) {
        console.warn('⚠️ [SCOREPLEX] API key not configured');
      } else {
        // Get agent location from localStorage to extract user info
        const agentData = sessions[sessionId].agentData || {};
        
        // Prepare Scoreplex request
        const scoreplexPayload = {
          email: agentData.email || '',
          phone: agentData.phone || '',
          ip: sdkData?.ip || '',
          first_name: agentData.firstName || '',
          last_name: agentData.lastName || '',
          verification: true
        };

        console.log('📤 [SCOREPLEX] Payload:', JSON.stringify(scoreplexPayload, null, 2));

        const scoreplexResponse = await axios.post(
          `https://api.scoreplex.io/api/v1/search`,
          scoreplexPayload,
          {
            params: {
              api_key: scoreplexApiKey
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (scoreplexResponse.data && scoreplexResponse.data.id) {
          sessions[sessionId].scoreplexTaskId = scoreplexResponse.data.id;
          console.log(`✅ [SCOREPLEX] Task created: ${scoreplexResponse.data.id}`);
        }
      }
    } catch (scoreplexError) {
      console.error('❌ [SCOREPLEX] Submit error:', scoreplexError.message);
      // Continue even if Scoreplex fails
    }

    res.json({
      success: true,
      message: 'SDK data saved successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('❌ [SDK] Save error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// ✅ NEW: CHECK VERIFICATION STATUS (FOR POLLING)
// ==========================================
app.get('/api/check-verification/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`🔍 [VERIFY] Checking session: ${sessionId}`);

    const session = sessions[sessionId];

    if (!session) {
      return res.json({
        verified: false,
        hasSDKData: false
      });
    }

    res.json({
      verified: session.verified || false,
      hasSDKData: !!session.sdkData
    });

  } catch (error) {
    console.error('❌ [VERIFY] Check error:', error.message);
    res.status(500).json({
      verified: false,
      error: error.message
    });
  }
});

// ==========================================
// ✅ NEW: GET DASHBOARD DATA WITH SCOREPLEX INTELLIGENCE
// ==========================================
// ==========================================
// ✅ GET DASHBOARD DATA WITH SCOREPLEX INTELLIGENCE
// ==========================================
app.get('/api/dashboard-data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`📊 [DASHBOARD] Fetching data for session: ${sessionId}`);

    const session = sessions[sessionId];

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (!session.sdkData) {
      return res.status(404).json({
        success: false,
        error: 'SDK data not yet available'
      });
    }

    // Initialize intelligence with defaults
    let intelligence = {
      email: {},
      phone: {},
      ip: {},
      darknet: {},
      overallScore: 0,
      scoreplexData: null
    };

    // ✅ Fetch Scoreplex results if task exists
    if (session.scoreplexTaskId) {
      try {
        console.log(`🔍 [SCOREPLEX] Fetching results for task: ${session.scoreplexTaskId}`);
        
        const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;
        
        const scoreplexResponse = await axios.get(
          `https://api.scoreplex.io/api/v1/search/task/${session.scoreplexTaskId}`,
          {
            params: {
              api_key: scoreplexApiKey,
              report: true
            }
          }
        );

        const report = scoreplexResponse.data.report;

        if (report) {
          console.log('✅ [SCOREPLEX] Results fetched successfully');

          // ==========================================
          // EMAIL INTELLIGENCE - 32 FIELDS
          // ==========================================
          intelligence.email = {
            'email_addresses_amount': report.email_addresses_amount || 0,
            'email_disposable': report.email_disposable || false,
            'email_first_name': report.email_first_name || 'N/A',
            'email_phone_numbers': report.email_phone_numbers || [],
            'email_generic': report.email_generic || false,
            'email_common': report.email_common || false,
            'email_user_activity': report.email_user_activity || 'N/A',
            'email_spam_trap_score': report.email_spam_trap_score || 0,
            'email_frequent_complainer': report.email_frequent_complainer || false,
            'email_suspect': report.email_suspect || false,
            'email_recent_abuse': report.email_recent_abuse || false,
            'email_domain_age': report.email_domain_age || 'N/A',
            'email_domain_velocity': report.email_domain_velocity || 'N/A',
            'email_domain_trust': report.email_domain_trust || 'N/A',
            'email_suggested_domain': report.email_suggested_domain || 'N/A',
            'email_smtp_score': report.email_smtp_score || 0,
            'email_overall_score': report.email_overall_score || 0,
            'email_risky_tld': report.email_risky_tld || false,
            'email_spf_record': report.email_spf_record || false,
            'email_dmarc_record': report.email_dmarc_record || false,
            'email_mx_records': report.email_mx_records || false,
            'email_valid': report.email_valid || false,
            'email_deliverability': report.email_deliverability || 'N/A',
            'email_google_name_valid': report.email_google_name_valid || false,
            'email_format_is_bad': report.email_format_is_bad || false,
            'email_has_stop_words': report.email_has_stop_words || false,
            'email_account_vowels_count': report.email_account_vowels_count || 0,
            'email_account_consonants_count': report.email_account_consonants_count || 0,
            'email_account_length': report.email_account_length || 0,
            'email_account_digit_count': report.email_account_digit_count || 0,
            'email_social_has_profile_picture': report.email_social_has_profile_picture || false,
            'email_addresses': report.email_addresses || []
          };

          // ==========================================
          // PHONE INTELLIGENCE - 19 FIELDS
          // ==========================================
          intelligence.phone = {
            'phone_numbers_amount': report.phone_numbers_amount || 0,
            'phone_valid': report.phone_valid || false,
            'phone_associated_emails': report.phone_associated_emails || [],
            'phone_name': report.phone_name || 'N/A',
            'phone_line_type': report.phone_line_type || 'N/A',
            'phone_recent_abuse': report.phone_recent_abuse || false,
            'phone_spammer': report.phone_spammer || false,
            'phone_voip': report.phone_voip || false,
            'phone_prepaid': report.phone_prepaid || false,
            'phone_risky': report.phone_risky || false,
            'phone_active': report.phone_active || false,
            'phone_country': report.phone_country || 'N/A',
            'phone_city': report.phone_city || 'N/A',
            'phone_region': report.phone_region || 'N/A',
            'phone_zip_code': report.phone_zip_code || 'N/A',
            'phone_timezone': report.phone_timezone || 'N/A',
            'phone_social_has_profile_picture': report.phone_social_has_profile_picture || false,
            'phone_carrier': report.phone_carrier || 'N/A',
            'phone_numbers_list': report.phone_numbers_list || []
          };

          // ==========================================
          // IP INTELLIGENCE - 22 FIELDS
          // ==========================================
          intelligence.ip = {
            'ip_hostname': report.ip_hostname || report.ip || 'N/A',
            'ip_country': report.ip_country || 'N/A',
            'ip_city': report.ip_city || 'N/A',
            'ip_region': report.ip_region || 'N/A',
            'ip_time_zone': report.ip_time_zone || 'N/A',
            'ip_connection_type': report.ip_connection_type || 'N/A',
            'ip_latitude': report.ip_latitude || 'N/A',
            'ip_longitude': report.ip_longitude || 'N/A',
            'ip_isp': report.ip_isp || 'N/A',
            'ip_organization': report.ip_organization || 'N/A',
            'ip_asn': report.ip_asn || 'N/A',
            'ip_proxy': report.ip_proxy || false,
            'ip_vpn': report.ip_vpn || false,
            'ip_tor': report.ip_tor || false,
            'ip_recent_fraud': report.ip_recent_fraud || false,
            'ip_bot_activity': report.ip_bot_activity || false,
            'ip_is_crawler': report.ip_is_crawler || false,
            'ip_frequent_fraud': report.ip_frequent_fraud || false,
            'ip_high_risk_attacks': report.ip_high_risk_attacks || false,
            'ip_shared_connection': report.ip_shared_connection || false,
            'ip_dynamic_connection': report.ip_dynamic_connection || false,
            'ip_trusted_network': report.ip_trusted_network || false
          };

          // ==========================================
          // DARKNET / DATA LEAKS
          // ==========================================
          intelligence.darknet = {
            'sl_data': {
              'phones': report.phones || [],
              'emails': report.emails || [],
              'full_names': report.full_names || [],
              'aliases': report.aliases || [],
              'accounts': report.accounts_registered_list || [],
              'addresses': report.addresses || [],
              'genders': report.gender || 'N/A',
              'birthdays': report.birthday || 'N/A'
            },
            'data_leaks_first_seen': report.data_leaks_first_seen || 'N/A',
            'data_leaks_last_seen': report.data_leaks_last_seen || 'N/A',
            'data_leaks_count': report.data_leaks_count || 0,
            'email_data_leaks_count': report.email_data_leaks_count || 0,
            'email_data_leaks_list': report.email_data_leaks_list || [],
            'email_data_leaks_first_seen': report.email_data_leaks_first_seen || 'N/A',
            'email_data_leaks_last_seen': report.email_data_leaks_last_seen || 'N/A',
            'phone_data_leaks_count': report.phone_data_leaks_count || 0,
            'phone_data_leaks_list': report.phone_data_leaks_list || [],
            'phone_data_leaks_first_seen': report.phone_data_leaks_first_seen || 'N/A',
            'phone_data_leaks_last_seen': report.phone_data_leaks_last_seen || 'N/A'
          };

          // ==========================================
          // OVERALL SCORING
          // ==========================================
          intelligence.overallScore = report.overall_score || 0;
          intelligence.scoring = {
            overall: report.overall_score || 0,
            email: report.email_score || 0,
            phone: report.phone_score || 0,
            name: report.name_score || 0,
            ip: report.ip_score || 0
          };

          intelligence.scoreplexData = report;
        }
      } catch (scoreplexError) {
        console.error('❌ [SCOREPLEX] Fetch error:', scoreplexError.message);
      }
    } else {
      console.warn('⚠️ [SCOREPLEX] No task ID found for this session');
    }

    console.log(`✅ [DASHBOARD] Data prepared for session: ${sessionId}`);

    res.json({
      success: true,
      sdkData: session.sdkData,
      intelligence: intelligence,
      sessionInfo: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        hasScoreplex: !!session.scoreplexTaskId
      }
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ==========================================
// ✅ NEW: SAVE AGENT DATA (CUSTOMER INFO FROM FORM)
// ==========================================
app.post('/api/save-agent-data', (req, res) => {
  try {
    const { sessionId, customerData } = req.body;

    console.log(`💾 [AGENT] Saving customer data for session: ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        sessionId,
        verified: false,
        createdAt: Date.now()
      };
    }

    sessions[sessionId].agentData = customerData;
    sessions[sessionId].updatedAt = Date.now();

    console.log(`✅ [AGENT] Customer data saved`);

    res.json({
      success: true,
      message: 'Agent data saved successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('❌ [AGENT] Save error:', error.message);
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
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  POST http://localhost:${PORT}/api/reverse-geocode`);
  console.log(`  POST http://localhost:${PORT}/api/geocode`);
  console.log(`  POST http://localhost:${PORT}/api/calculate-distance`);
  console.log(`  POST http://localhost:${PORT}/api/calculate-agent-user-distance`);
  console.log(`  POST http://localhost:${PORT}/api/save-sdk-data`);
  console.log(`  GET  http://localhost:${PORT}/api/check-verification/:sessionId`);
  console.log(`  GET  http://localhost:${PORT}/api/dashboard-data/:sessionId`);
  console.log('===========================================');
});

module.exports = app;
