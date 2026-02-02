const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mapRoutes = require("./routes/mapRoutes");
require("dotenv").config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

app.use("/api/map", mapRoutes);

// ✅ In-memory session storage (persisted to file so cases survive backend restart)
const sessions = {};
const SESSIONS_FILE = path.join(__dirname, "data", "sessions.json");

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        Object.assign(sessions, parsed);
        console.log(`✅ [SESSIONS] Loaded ${Object.keys(parsed).length} session(s) from disk`);
      }
    }
  } catch (err) {
    console.warn("⚠️ [SESSIONS] Load failed:", err.message);
  }
}

function persistSessions() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 0), "utf8");
  } catch (err) {
    console.warn("⚠️ [SESSIONS] Persist failed:", err.message);
  }
}

loadSessions();

// ==========================================
// IP GEOLOCATION - Correct lat/long for selected IP (skip loopback)
// ==========================================
function isPublicIPv4(ip) {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim().replace(/^::ffff:/, "");
  if (trimmed === "::1" || trimmed === "127.0.0.1" || trimmed === "localhost") return false;
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed);
}

async function getIPGeolocation(ip) {
  if (!isPublicIPv4(ip)) return null;
  const trimmed = ip.trim().replace(/^::ffff:/, "");
  try {
    const res = await axios.get(
      `http://ip-api.com/json/${trimmed}?fields=status,country,regionName,city,lat,lon,timezone`,
      { timeout: 5000 }
    );
    if (res.data && res.data.status === "success")
      return {
        ip_country: res.data.country || "N/A",
        ip_region: res.data.regionName || "N/A",
        ip_city: res.data.city || "N/A",
        ip_latitude: res.data.lat != null ? res.data.lat : "N/A",
        ip_longitude: res.data.lon != null ? res.data.lon : "N/A",
        ip_time_zone: res.data.timezone || "N/A",
      };
    return null;
  } catch (err) {
    console.warn("⚠️ [IP GEO] Lookup failed for", trimmed, err.message);
    return null;
  }
}

// ==========================================
// SCOREPLEX - Start task on form submit (so data is ready when dashboard opens)
// ==========================================
async function createScoreplexTask(sessionId, agentData, ip = "") {
  const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;
  if (!scoreplexApiKey) {
    console.warn("⚠️ [SCOREPLEX] API key not configured");
    return null;
  }
  const rawPhone = agentData.phone || agentData.phoneNumber || agentData.mobileNumber || "";
  let formattedPhone = "";
  if (rawPhone) {
    formattedPhone = String(rawPhone).trim().startsWith("+")
      ? String(rawPhone).trim()
      : `+91${String(rawPhone).trim().replace(/^0+/, "")}`;
  }
  const email = agentData.email || agentData.emailId || agentData.contactEmailId || "";
  if (!email && !formattedPhone) {
    console.warn("⚠️ [SCOREPLEX] No email or phone for task");
    return null;
  }
  const payload = {
    email: email,
    phone: formattedPhone,
    ip: ip || "",
    first_name: agentData.firstName || (agentData.customerName || "").split(" ")[0] || "",
    last_name: agentData.lastName || (agentData.customerName || "").split(" ").slice(1).join(" ") || "",
    verification: true,
  };
  try {
    const res = await axios.post(
      "https://api.scoreplex.io/api/v1/search",
      payload,
      {
        params: { api_key: scoreplexApiKey },
        headers: { "Content-Type": "application/json" },
      }
    );
    if (res.data && res.data.id) {
      sessions[sessionId].scoreplexTaskId = res.data.id;
      persistSessions();
      console.log(`✅ [SCOREPLEX] Task started on submit: ${res.data.id}`);
      return res.data.id;
    }
    return null;
  } catch (err) {
    console.error("❌ [SCOREPLEX] Create task error:", err.message);
    return null;
  }
}

// ==========================================
// CONFIGURATION
// ==========================================
const MAPPLS_ACCESS_TOKEN = process.env.MAPPLS_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

if (!MAPPLS_ACCESS_TOKEN) {
  console.warn("⚠️ WARNING: MAPPLS_ACCESS_TOKEN not found");
}

console.log("✅ Mappls API key loaded successfully");
console.log("🔒 API key will remain hidden from frontend");

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get("/api", (req, res) => {
  res.json({
    status: "running",
    message: "Mappls Proxy Server",
    endpoints: [
      "POST /api/reverse-geocode",
      "POST /api/geocode",
      "POST /api/nearby-search",
      "POST /api/calculate-distance",
      "POST /api/save-sdk-data",
      "GET /api/check-verification/:sessionId",
      "GET /api/dashboard-data/:sessionId",
    ],
  });
});

// ==========================================
// REVERSE GEOCODING ENDPOINT
// ==========================================
app.post("/api/reverse-geocode", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);

    const response = await axios.get(
      `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_ACCESS_TOKEN}/rev_geocode`,
      {
        params: {
          lat: latitude,
          lng: longitude,
        },
      },
    );

    const data = response.data;

    if (!data.results || data.results.length === 0) {
      return res.json({
        success: false,
        error: "No address found for these coordinates",
      });
    }

    const result = data.results[0];
    const addressInfo = {
      formattedAddress: result.formatted_address || "Address not found",
      houseNumber: result.house_number || "",
      houseName: result.house_name || "",
      poi: result.poi || "",
      street: result.street || "",
      subSubLocality: result.subSubLocality || "",
      subLocality: result.subLocality || "",
      locality: result.locality || "",
      village: result.village || "",
      district: result.district || "",
      subDistrict: result.subDistrict || "",
      city: result.city || "",
      state: result.state || "",
      pincode: result.pincode || "",
      area: result.area || "",
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      capturedAt: Date.now(),
    };

    console.log("✅ Address retrieved:", addressInfo.formattedAddress);

    res.json({
      success: true,
      address: addressInfo,
    });
  } catch (error) {
    console.error("❌ Reverse geocoding error:", error.message);

    if (error.response) {
      console.error("API Response Error:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: "Mappls API error",
        message: error.response.data.message || "Failed to get address",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
});

// ==========================================
// GEOCODING ENDPOINT
// ==========================================
app.post("/api/geocode", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    console.log(`🔍 Geocoding address: ${address}`);

    const response = await axios.get(
      `https://atlas.mappls.com/api/places/search/json`,
      {
        params: {
          address: address,
        },
        headers: {
          Authorization: `Bearer ${MAPPLS_ACCESS_TOKEN}`,
        },
      },
    );

    const data = response.data;

    console.log("✅ Geocoding results retrieved");

       const results = (data.suggestedLocations || data.results || []).map(loc => ({
      formattedAddress: loc.address || loc.formatted_address || loc.text,
      latitude: loc.lat || loc.latlng?.lat,
      longitude: loc.lng || loc.latlng?.lng,
      locality: loc.locality,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
    })).filter(r => r.latitude && r.longitude);

    res.json({
      success: true,
      results: results.slice(0, 5), // Top 5 results
    });
  } catch (error) {
    console.error("❌ Geocoding error:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: "Mappls API error",
        message: error.response.data.message || "Failed to geocode address",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
});

// ==========================================
// DISTANCE CALCULATION ENDPOINT
// ==========================================
app.post("/api/calculate-distance", async (req, res) => {
  try {
    const { userLat, userLon, bankLat, bankLon } = req.body;

    console.log("🚀 === DISTANCE CALCULATION STARTED ===");
    console.log("📍 User: lat=" + userLat + ", lon=" + userLon);
    console.log("🏦 Bank: lat=" + bankLat + ", lon=" + bankLon);

    if (!userLat || !userLon || !bankLat || !bankLon) {
      console.log("❌ Missing coordinates");
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
      });
    }

    const mapplsApiKey = process.env.MAPPLS_ACCESS_TOKEN;

    if (!mapplsApiKey) {
      console.log("❌ No API key");
      return res.status(500).json({
        success: false,
        error: "Mappls API key not configured",
      });
    }

    const url = `https://apis.mappls.com/advancedmaps/v1/${mapplsApiKey}/distance_matrix/driving/${userLon},${userLat};${bankLon},${bankLat}?sources=0&destinations=1`;

    console.log("📡 Calling Mappls API with format: lon,lat;lon,lat");
    console.log("📡 User coords: " + userLon + "," + userLat);
    console.log("📡 Bank coords: " + bankLon + "," + bankLat);

    const response = await axios.get(url);
    const data = response.data;

    console.log("📦 API Response received");
    console.log("📦 Response code:", data.responseCode);
    console.log("📏 DISTANCES:", JSON.stringify(data.results.distances));
    console.log("⏱️ DURATIONS:", JSON.stringify(data.results.durations));

    if (data.results?.distances && data.results?.durations) {
      const distancesArray = data.results.distances;
      const durationsArray = data.results.durations;

      console.log("🔍 First distance element:", distancesArray[0]);
      console.log("🔍 Array length:", distancesArray[0].length);

      let distanceMeters = null;
      let durationSeconds = null;

      if (Array.isArray(distancesArray[0])) {
        if (distancesArray[0].length > 1) {
          distanceMeters = distancesArray[0][1];
          durationSeconds = durationsArray[0][1];
          console.log("✅ Using [0][1] index");
        } else if (distancesArray[0].length === 1) {
          distanceMeters = distancesArray[0][0];
          durationSeconds = durationsArray[0][0];
          console.log("⚠️ Using [0][0] index (only one value)");
        }
      }

      console.log("🔢 Distance (meters):", distanceMeters);
      console.log("🔢 Duration (seconds):", durationSeconds);

      if (
        distanceMeters === null ||
        distanceMeters === undefined ||
        distanceMeters === 0
      ) {
        console.log("❌ Invalid distance value");
        console.log("📦 FULL API RESPONSE:", JSON.stringify(data, null, 2));
        return res.json({
          success: false,
          error: "Could not parse distance",
          debug: {
            distances: distancesArray,
            durations: durationsArray,
            message: "Check if coordinates are in correct format (lon,lat)",
          },
        });
      }

      const distanceKm = parseFloat(distanceMeters) / 1000;
      const durationMinutes = parseFloat(durationSeconds) / 60;

      console.log(
        `✅ SUCCESS: ${distanceKm.toFixed(2)} km, ${durationMinutes.toFixed(1)} min`,
      );
      console.log("🚀 === CALCULATION COMPLETE ===\n");

      return res.json({
        success: true,
        distanceKm: distanceKm,
        durationMinutes: durationMinutes,
        calculationMethod: "MAPPLS_DISTANCE_MATRIX_API",
      });
    }

    console.log("⚠️ Invalid response structure");
    res.json({ success: false, error: "Invalid response from Mappls" });
  } catch (error) {
    console.error("❌ ERROR:", error.message);

    if (error.response) {
      console.error("❌ Mappls API Status:", error.response.status);
      console.error("❌ Mappls API Error:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: "Mappls API error",
        message: error.response.data.message || error.message,
        details: error.response.data,
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
});

// ==========================================
// CALCULATE AGENT-USER DISTANCE
// ==========================================
app.post("/api/calculate-agent-user-distance", async (req, res) => {
  try {
    const {
      agentLat,
      agentLon,
      userLat,
      userLon,
      agentName,
      userName,
      agentAddress,
      userAddress,
    } = req.body;

    console.log(`🗺️ [AGENT-USER] Calculating distance...`);
    console.log(`Agent: ${agentLat}, ${agentLon}`);
    console.log(`User: ${userLat}, ${userLon}`);

    if (!agentLat || !agentLon || !userLat || !userLon) {
      return res.status(400).json({
        success: false,
        error: "All coordinates are required",
      });
    }

    const mapplsToken = process.env.MAPPLS_ACCESS_TOKEN;

    if (!mapplsToken) {
      return res.status(500).json({
        success: false,
        error: "Mappls API token not configured",
      });
    }

    // Calculate straight-line distance (Haversine)
    const R = 6371;
    const toRadians = (deg) => deg * (Math.PI / 180);
    const dLat = toRadians(userLat - agentLat);
    const dLon = toRadians(userLon - agentLon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(agentLat)) *
        Math.cos(toRadians(userLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;

    let drivingDistance = null;
    let drivingDuration = null;

    try {
      const distanceUrl = `https://apis.mappls.com/advancedmaps/v1/${mapplsToken}/distance_matrix/driving/${agentLon},${agentLat};${userLon},${userLat}?rtype=0&region=ind`;

      console.log("📡 [AGENT-USER] Calling Mappls Distance Matrix API...");

      const distanceResponse = await fetch(distanceUrl);

      if (distanceResponse.ok) {
        const distanceData = await distanceResponse.json();
        const distanceMeters = distanceData.results?.distances?.[0]?.[1];
        const durationSeconds = distanceData.results?.durations?.[0]?.[1];

        if (distanceMeters) {
          drivingDistance = distanceMeters / 1000;
          drivingDuration = Math.round(durationSeconds / 60);
          console.log(
            `✅ [AGENT-USER] Driving distance: ${drivingDistance} km`,
          );
        }
      }
    } catch (err) {
      console.warn(
        "⚠️ [AGENT-USER] Could not get driving distance:",
        err.message,
      );
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
        name: agentName || "Agent",
        address: agentAddress || `${agentLat}, ${agentLon}`,
      },
      userLocation: {
        latitude: userLat,
        longitude: userLon,
        name: userName || "User",
        address: userAddress || `${userLat}, ${userLon}`,
      },
      distance: {
        km: parseFloat(finalDistance.toFixed(2)),
        meters: Math.round(finalDistance * 1000),
        miles: parseFloat((finalDistance * 0.621371).toFixed(2)),
      },
      straightLineDistance: {
        km: parseFloat(straightLineDistance.toFixed(2)),
      },
      drivingDistance: drivingDistance
        ? {
            km: parseFloat(drivingDistance.toFixed(2)),
            durationMinutes: drivingDuration,
            durationFormatted: formatDuration(drivingDuration),
          }
        : null,
      riskAnalysis: riskAnalysis,
      calculationMethod: drivingDistance
        ? "MAPPLS_DISTANCE_MATRIX_API"
        : "HAVERSINE_FORMULA",
    };

    console.log("✅ [AGENT-USER] Distance calculated successfully");

    res.json(response);
  } catch (error) {
    console.error("❌ [AGENT-USER] Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});






// ==========================================
// ✅ SAVE SDK DATA + CALCULATE DISTANCE
// ==========================================
app.post("/api/save-sdk-data", async (req, res) => {
  try {
    const { sessionId, sdkData } = req.body;

    console.log(`💾 [SDK] Saving data for session: ${sessionId}`);

   

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        sessionId,
        verified: true,
        createdAt: Date.now(),
      };
    }

    sessions[sessionId].sdkData = sdkData;
    sessions[sessionId].updatedAt = Date.now();

    console.log(`✅ [SDK] Data saved. Total events: ${sdkData?.length || 0}`);

    const deviceLocationEvent = sdkData?.find(
      (event) => event.type === "DEVICE_LOCATION",
    );
    const userLocation = deviceLocationEvent?.payload;

    if (userLocation) {
      console.log(`📍 [SDK] User location detected:`);
      console.log(
        `   Lat: ${userLocation.latitude}, Lon: ${userLocation.longitude}`,
      );
      console.log(`   Address: ${userLocation.address?.formattedAddress}`);
    }

    const agentData = sessions[sessionId].agentData;

    if (userLocation && agentData?.latitude && agentData?.longitude) {
      console.log(`📏 [DISTANCE] Calculating agent-user distance...`);
      console.log(`   Agent: ${agentData.latitude}, ${agentData.longitude}`);
      console.log(
        `   User: ${userLocation.latitude}, ${userLocation.longitude}`,
      );

      try {
        const distanceResponse = await axios.post(
          `http://localhost:${PORT}/api/calculate-agent-user-distance`,
          {
            agentLat: agentData.latitude,
            agentLon: agentData.longitude,
            agentName: agentData.customerName || "Agent",
            agentAddress: agentData.address || "Agent Location",
            userLat: userLocation.latitude,
            userLon: userLocation.longitude,
            userName: agentData.customerName || "User",
            userAddress:
              userLocation.address?.formattedAddress || "User Location",
          },
        );

        if (distanceResponse.data.success) {
          const distanceData = distanceResponse.data;

          sessions[sessionId].sdkData.push({
            type: "AGENT_USER_DISTANCE",
            payload: distanceData,
            timestamp: Date.now(),
            userId: agentData.email || sessionId,
            SDK: "Bargad-v1.0.0",
          });

          console.log(
            `✅ [DISTANCE] Distance calculated: ${distanceData.distance.km} km`,
          );
          console.log(`   Risk Level: ${distanceData.riskAnalysis.riskLevel}`);
          console.log(
            `   Recommendation: ${distanceData.riskAnalysis.recommendation}`,
          );
        }
      } catch (distanceError) {
        console.error(
          "❌ [DISTANCE] Calculation error:",
          distanceError.message,
        );
      }
    } else {
      console.warn("⚠️ [DISTANCE] Cannot calculate - missing location data");
    }

    // ✅ Submit to Scoreplex
    try {
      console.log("🔍 [SCOREPLEX] Submitting search...");

      const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;

      if (!scoreplexApiKey) {
        console.warn("⚠️ [SCOREPLEX] API key not configured");
      } else {
        const agentData = sessions[sessionId].agentData || {};

        // ✅ Format phone with country code (support phone, phoneNumber, mobileNumber)
        const rawPhone = agentData.phone || agentData.phoneNumber || agentData.mobileNumber || "";
        let formattedPhone = "";
        if (rawPhone) {
          formattedPhone = String(rawPhone).trim().startsWith("+")
            ? String(rawPhone).trim()
            : `+91${String(rawPhone).trim().replace(/^0+/, "")}`;
        }

        const emailForScoreplex = agentData.email || agentData.emailId || agentData.contactEmailId || "";

        // ✅✅✅ IP SELECTION LOGIC - PRIORITY: Global IP > IPv4 > IPv6 ✅✅✅
        let selectedIP = "";
        let globalIP = null;
        let ipv4 = null;
        let ipv6 = null;
        let localIP = null;

        // Extract all IPs from SDK data
        // ✅✅✅ FIXED: Extract IPs from SDK data (check nested fingerprint) ✅✅✅
        if (sdkData && Array.isArray(sdkData)) {
          sdkData.forEach((event) => {
            if (event.payload) {
              // ✅ NEW: Check if this is DEVICE_ID event with fingerprint
              if (
                event.type === "DEVICE_ID" &&
                event.payload.fingerprint &&
                event.payload.fingerprint.ipAddresses
              ) {
                const ipData = event.payload.fingerprint.ipAddresses;

                globalIP = globalIP || ipData.globalIP;
                ipv4 = ipv4 || ipData.ipv4;
                ipv6 = ipv6 || ipData.ipv6;
                localIP = localIP || ipData.localIP;

                console.log(
                  "✅ [IP] Found in DEVICE_ID.fingerprint.ipAddresses",
                );
              }

              // ✅ ALSO: Check direct payload fields (backward compatibility)
              if (event.payload.globalIP || event.payload.global_ip) {
                globalIP =
                  globalIP || event.payload.globalIP || event.payload.global_ip;
              }
              if (event.payload.ipv4 || event.payload.IPv4) {
                ipv4 = ipv4 || event.payload.ipv4 || event.payload.IPv4;
              }
              if (event.payload.ipv6 || event.payload.IPv6) {
                ipv6 = ipv6 || event.payload.ipv6 || event.payload.IPv6;
              }
              if (event.payload.localIP || event.payload.local_ip) {
                localIP =
                  localIP || event.payload.localIP || event.payload.local_ip;
              }

              // Also check nested ip object
              if (event.payload.ip) {
                if (typeof event.payload.ip === "string") {
                  globalIP = globalIP || event.payload.ip;
                } else if (typeof event.payload.ip === "object") {
                  globalIP =
                    globalIP ||
                    event.payload.ip.global ||
                    event.payload.ip.globalIP;
                  ipv4 = ipv4 || event.payload.ip.ipv4 || event.payload.ip.IPv4;
                  ipv6 = ipv6 || event.payload.ip.ipv6 || event.payload.ip.IPv6;
                  localIP =
                    localIP ||
                    event.payload.ip.local ||
                    event.payload.ip.localIP;
                }
              }
            }
          });

          
        }

        // ✅ Apply priority selection logic
        // 1. Try Global IP first (best for fraud detection & geolocation)
        if (
  ipv4 &&
  ipv4 !== "null" &&
  ipv4 !== "" &&
  ipv4 !== "0.0.0.0" &&
  ipv4 !== "undefined"
) {
  selectedIP = ipv4;
  sessions[sessionId].ipSource = "ipv4";
  console.log("✅ [IP SELECTED] Using IPv4:", selectedIP);
}
// 2. Fallback to Global IP
else if (
  globalIP &&
  globalIP !== "null" &&
  globalIP !== "" &&
  globalIP !== "0.0.0.0" &&
  globalIP !== "undefined"
) {
  selectedIP = globalIP;
  sessions[sessionId].ipSource = "global";
  console.log("⚠️ [IP SELECTED] Using Global IP (IPv4 not available):", selectedIP);
}
        // 3. Fallback to IPv6
        else if (
          ipv6 &&
          ipv6 !== "null" &&
          ipv6 !== "" &&
          ipv6 !== "::" &&
          ipv6 !== "undefined"
        ) {
          selectedIP = ipv6;
          sessions[sessionId].ipSource = "ipv6";
          console.log(
            "⚠️ [IP SELECTED] Using IPv6 (IPv4 not available):",
            selectedIP,
          );
        }
        // 4. Last resort: backend IP (NOT RECOMMENDED - will be localhost)
        else {
          selectedIP =
            req.ip ||
            req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            "";
          selectedIP = selectedIP.replace("::ffff:", "");
          sessions[sessionId].ipSource = "backend";
          console.warn(
            "❌ [IP SELECTED] No SDK IP found! Using backend IP:",
            selectedIP,
          );
          console.warn(
            '❌ [WARNING] Backend IP is likely "localhost" - Scoreplex will not work properly!',
          );
        }

        // Store selected IP in session
        sessions[sessionId].selectedIP = selectedIP;

   console.log(`✅ [IP SELECTED] ${selectedIP} (Source: ${sessions[sessionId].ipSource})`);

        const scoreplexPayload = {
          email: emailForScoreplex,
          phone: formattedPhone,
          ip: selectedIP, // ✅ Use selected IP with priority logic
          first_name:
            agentData.firstName || agentData.customerName?.split(" ")[0] || "",
          last_name:
            agentData.lastName ||
            agentData.customerName?.split(" ").slice(1).join(" ") ||
            "",
          verification: true,
        };

        console.log(
          "📤 [SCOREPLEX] Payload:",
          JSON.stringify(scoreplexPayload, null, 2),
        );
        console.log("📤 [SCOREPLEX] IP Source:", sessions[sessionId].ipSource);

        const scoreplexResponse = await axios.post(
          `https://api.scoreplex.io/api/v1/search`,
          scoreplexPayload,
          {
            params: {
              api_key: scoreplexApiKey,
            },
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (scoreplexResponse.data && scoreplexResponse.data.id) {
          sessions[sessionId].scoreplexTaskId = scoreplexResponse.data.id;
          console.log(
            `✅ [SCOREPLEX] Task created: ${scoreplexResponse.data.id}`,
          );
          console.log(
            `✅ [SCOREPLEX] Submitted with IP: ${selectedIP} (Source: ${sessions[sessionId].ipSource})`,
          );
        }
      }
    } catch (scoreplexError) {
      console.error("❌ [SCOREPLEX] Submit error:", scoreplexError.message);
      if (scoreplexError.response) {
        console.error("❌ [SCOREPLEX] Response:", scoreplexError.response.data);
      }
    }

    persistSessions();

    res.json({
      success: true,
      message: "SDK data saved successfully",
      sessionId: sessionId,
      hasDistance: sessions[sessionId].sdkData.some(
        (e) => e.type === "AGENT_USER_DISTANCE",
      ),
    });
  } catch (error) {
    console.error("❌ [SDK] Save error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// ✅ CHECK VERIFICATION STATUS
// ==========================================
app.get("/api/check-verification/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`🔍 [VERIFY] Checking session: ${sessionId}`);

    const session = sessions[sessionId];

    if (!session) {
      return res.json({
        verified: false,
        hasSDKData: false,
      });
    }

    res.json({
      verified: session.verified || false,
      hasSDKData: !!session.sdkData,
    });
  } catch (error) {
    console.error("❌ [VERIFY] Check error:", error.message);
    res.status(500).json({
      verified: false,
      error: error.message,
    });
  }
});

// ==========================================
// ✅ GET DASHBOARD DATA WITH SCOREPLEX
// ==========================================
app.get("/api/dashboard-data/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`📊 [DASHBOARD] Fetching data for session: ${sessionId}`);

    const session = sessions[sessionId];

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    let intelligence = {
      email: {},
      phone: {},
      ip: {},
      darknet: {},
      overallScore: 0,
      scoreplexData: null,
      sdkData: session.sdkData || [],
    };

    if (session.scoreplexTaskId) {
      try {
        console.log(
          `🔍 [SCOREPLEX] Fetching results for task: ${session.scoreplexTaskId}`,
        );

        const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;
        const maxRetries = 5;
        const retryDelayMs = 2000;
        let scoreplexResponse = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (attempt > 0) {
            console.log(`⏳ [SCOREPLEX] Report not ready, retry ${attempt}/${maxRetries} in ${retryDelayMs / 1000}s...`);
            await new Promise((r) => setTimeout(r, retryDelayMs));
          }
          scoreplexResponse = await axios.get(
            `https://api.scoreplex.io/api/v1/search/task/${session.scoreplexTaskId}`,
            {
              params: {
                api_key: scoreplexApiKey,
                report: false,
              },
            },
          );
          const report = scoreplexResponse.data?.report;
          const status = report?.status;
          if (report && status !== "processing" && status !== "pending") {
            console.log(`✅ [SCOREPLEX] Report ready on attempt ${attempt + 1}`);
            break;
          }
          if (attempt === maxRetries) {
            console.warn("⚠️ [SCOREPLEX] Report not ready after retries, returning partial data");
          }
        }

        // ✅ ADD THIS CHECK
console.log('📊 [SCOREPLEX] Task Status:', scoreplexResponse.data.report?.status);
console.log('📊 [SCOREPLEX] Data Leaks Status:', scoreplexResponse.data.report?.data_leaks_status);

        // ✅✅✅ ADD THIS DEBUG BLOCK ✅✅✅
       
        if (scoreplexResponse.data.report) {
          const report = scoreplexResponse.data.report;

          console.log("\n📦 [ALL REPORT KEYS]");
          console.log("Keys in report:", Object.keys(report));

          console.log("\n🔍 [SAMPLE OF REPORT DATA]");
          console.log("email:", report.email);
          console.log("phone:", report.phone);
          console.log("overall_score:", report.overall_score);

          console.log("\n🔎 [SEARCHING FOR DATA LEAK FIELDS]");
          Object.keys(report).forEach((key) => {
            if (
              key.toLowerCase().includes("leak") ||
              key.toLowerCase().includes("breach") ||
              key.toLowerCase().includes("pwn") ||
              key.toLowerCase().includes("compromise")
            ) {
              console.log(`  FOUND: ${key} =`, report[key]);
            }
          });
        }
       
        // ✅✅✅ END BLOCK ✅✅✅
        console.log(
          'Has "email_data_leaks_count" at root:',
          scoreplexResponse.data.email_data_leaks_count,
        );
        console.log(
          'Has "email_data_leaks_count" in report:',
          scoreplexResponse.data.report?.email_data_leaks_count,
        );
      
        // ✅✅✅ END DEBUG BLOCK ✅✅✅

        // ✅✅✅ ADD THIS TO SEE ALL REPORT KEYS ✅✅✅
        console.log("\n📦 [REPORT OBJECT KEYS]");
        if (scoreplexResponse.data.report) {
          console.log(
            "All keys in report:",
            Object.keys(scoreplexResponse.data.report),
          );
          console.log("\n📝 [CHECKING ALL DATA LEAK FIELDS]");
          const report = scoreplexResponse.data.report;

          // Check all possible field names
          const fieldsToCheck = [
            "email_data_leaks_count",
            "email_data_leaks_list",
            "data_leaks_count",
            "breaches",
            "email_breaches",
            "leaks",
            "compromised",
            "pwned",
          ];

          fieldsToCheck.forEach((field) => {
            console.log(`  ${field}:`, report[field]);
          });
        }
        console.log("🔍 [END RAW RESPONSE DEBUG]\n");
        // ✅✅✅ END ENHANCED DEBUG ✅✅✅

        const report = scoreplexResponse.data.report;

        if (report) {
          console.log("✅ [SCOREPLEX] Results fetched successfully");
            // 🚨 ADD THIS DEBUG BLOCK 🚨
  console.log('\n🔍 [BREACH DATA CHECK]');
  console.log('data_leaks_count:', report.data_leaks_count);
  console.log('email_data_leaks_count:', report.email_data_leaks_count);
  console.log('email_data_leaks_list length:', report.email_data_leaks_list?.length);
  console.log('🔍 [END BREACH CHECK]\n');
  // 🚨 END DEBUG BLOCK 🚨

           // 🚨🚨🚨 ADD THIS DEBUG BLOCK RIGHT AFTER "Results fetched" 🚨🚨🚨
  console.log('\n🔍 [SCOREPLEX IP IN RESPONSE]');
  console.log('IP from report:', report.ip);
  console.log('IP hostname:', report.ip_hostname);
  console.log('IP address:', report.ip_address);
  console.log('IP location:', report.ip_location);
  console.log('Session stored IP:', session.selectedIP);
  console.log('Session IP source:', session.ipSource);
  console.log('🔍 [END SCOREPLEX IP CHECK]\n');
  // 🚨🚨🚨 END DEBUG BLOCK 🚨🚨🚨

          // ✅✅✅ ADD THIS DEBUG BLOCK ✅✅✅
         
          

          // ==========================================
          // EMAIL INTELLIGENCE
          // ==========================================
          intelligence.email = {
            email_addresses_amount: report.email_addresses_amount || 0,
            email_disposable: report.email_disposable || false,
            email_first_name: report.email_first_name || "N/A",
            email_phone_numbers: report.email_phone_numbers || [],
            email_generic: report.email_generic || false,
            email_common: report.email_common || false,
            email_user_activity: report.email_user_activity || "N/A",
            email_spam_trap_score: report.email_spam_trap_score || 0,
            email_frequent_complainer:
              report.email_frequent_complainer || false,
            email_suspect: report.email_suspect || false,
            email_recent_abuse: report.email_recent_abuse || false,
            email_domain_age: report.email_domain_age || "N/A",
            email_domain_velocity: report.email_domain_velocity || "N/A",
            email_domain_trust: report.email_domain_trust || "N/A",
            email_suggested_domain: report.email_suggested_domain || "N/A",
            email_smtp_score: report.email_smtp_score || 0,
            email_overall_score: report.email_overall_score || 0,
            email_risky_tld: report.email_risky_tld || false,
            email_spf_record: report.email_spf_record || false,
            email_dmarc_record: report.email_dmarc_record || false,
            email_mx_records: report.email_mx_records || false,
            email_valid: report.email_valid || false,
            email_deliverability: report.email_deliverability || "N/A",
            email_google_name_valid: report.email_google_name_valid || false,
            email_format_is_bad: report.email_format_is_bad || false,
            email_has_stop_words: report.email_has_stop_words || false,
            email_account_vowels_count: report.email_account_vowels_count || 0,
            email_account_consonants_count:
              report.email_account_consonants_count || 0,
            email_account_length: report.email_account_length || 0,
            email_account_digit_count: report.email_account_digit_count || 0,
            email_social_has_profile_picture:
              report.email_social_has_profile_picture || false,
            email_addresses: report.email_addresses || [],
          };

          // ==========================================
          // ✅✅✅ PHONE INTELLIGENCE FIX #3: Updated mapping with True Caller fallbacks ✅✅✅
          // ==========================================
          intelligence.phone = {
            phone_numbers_amount:
              report.phone_numbers_amount || report.sl_data_phones?.length || 0,
            phone_valid: report.phone_valid || false,
            phone_associated_emails: report.phone_associated_emails || [],
            phone_name:
              report.phone_name || report.true_caller_fullname || "N/A",
            phone_line_type: report.phone_line_type || "N/A",
            phone_recent_abuse: report.phone_recent_abuse || false,
            phone_spammer: report.phone_spammer || false,
            phone_voip: report.phone_voip || false,
            phone_prepaid: report.phone_prepaid || false,
            phone_risky: report.phone_risky || false,
            phone_active: report.phone_active || false,
            phone_country:
              report.phone_country || report.true_caller_country_code || "N/A",
            phone_city: report.phone_city || report.true_caller_city || "N/A",
            phone_region: report.phone_region || "N/A",
            phone_zip_code:
              report.phone_zip_code || report.true_caller_zipcode || "N/A",
            phone_timezone:
              report.phone_timezone || report.true_caller_timezone || "N/A",
            phone_social_has_profile_picture:
              report.phone_social_has_profile_picture || false,
            phone_carrier:
              report.phone_carrier || report.true_caller_operator || "N/A",
            phone_numbers_list:
              report.phone_numbers_list || report.sl_data_phones || [],
          };

          // ==========================================
          // IP INTELLIGENCE - Selected IP (sent to Scoreplex) + correct location
          // ==========================================
          const selectedIP = session.selectedIP || report.ip || "N/A";
          intelligence.ip = {
            ip: report.ip || session.selectedIP || "N/A",
            ip_hostname: report.ip_hostname || "N/A",
            ip_country: report.ip_country || "N/A",
            ip_city: report.ip_city || "N/A",
            ip_region: report.ip_region || "N/A",
            ip_time_zone: report.ip_time_zone || "N/A",
            ip_connection_type: report.ip_connection_type || "N/A",
            ip_latitude: report.ip_latitude || "N/A",
            ip_longitude: report.ip_longitude || "N/A",
            ip_isp: report.ip_isp || "N/A",
            ip_organization: report.ip_organization || "N/A",
            ip_asn: report.ip_asn || "N/A",
            ip_proxy: report.ip_proxy || false,
            ip_vpn: report.ip_vpn || false,
            ip_tor: report.ip_tor || false,
            ip_recent_fraud: report.ip_recent_fraud || false,
            ip_bot_activity: report.ip_bot_activity || false,
            ip_is_crawler: report.ip_is_crawler || false,
            ip_frequent_fraud: report.ip_frequent_fraud || false,
            ip_high_risk_attacks: report.ip_high_risk_attacks || false,
            ip_shared_connection: report.ip_shared_connection || false,
            ip_dynamic_connection: report.ip_dynamic_connection || false,
            ip_trusted_network: report.ip_trusted_network || false,
          };
          // Use user's device location (SDK) for region/city/lat-long so it shows their actual location, not IP geolocation.
          const deviceLocationEvent = (session.sdkData || []).find(
            (e) => e.type === "DEVICE_LOCATION"
          );
          const userLocation = deviceLocationEvent?.payload;
          const hasDeviceLocation =
            userLocation &&
            userLocation.latitude != null &&
            userLocation.longitude != null;
          if (hasDeviceLocation) {
            intelligence.ip.ip_latitude = userLocation.latitude;
            intelligence.ip.ip_longitude = userLocation.longitude;
            if (userLocation.address) {
              intelligence.ip.ip_city =
                userLocation.address.city ||
                userLocation.address.locality ||
                userLocation.address.subDistrict ||
                intelligence.ip.ip_city;
              intelligence.ip.ip_region =
                userLocation.address.state ||
                userLocation.address.region ||
                intelligence.ip.ip_region;
              if (userLocation.address.country)
                intelligence.ip.ip_country = userLocation.address.country;
            }
          } else if (isPublicIPv4(selectedIP)) {
            // No device location: fallback to IP geolocation for the selected IP.
            const ipGeo = await getIPGeolocation(selectedIP);
            if (ipGeo) {
              intelligence.ip.ip_country = ipGeo.ip_country;
              intelligence.ip.ip_region = ipGeo.ip_region;
              intelligence.ip.ip_city = ipGeo.ip_city;
              intelligence.ip.ip_latitude = ipGeo.ip_latitude;
              intelligence.ip.ip_longitude = ipGeo.ip_longitude;
              intelligence.ip.ip_time_zone = ipGeo.ip_time_zone;
            }
          }

          // ==========================================
          // DARKNET / DATA LEAKS
          // ==========================================
          // DARKNET DATA LEAKS

          console.log('\n🚨 [BREACH DATA DEBUG - FULL REPORT CHECK]');
console.log('Has email_data_leaks_list?', !!report.email_data_leaks_list);
console.log('email_data_leaks_list type:', typeof report.email_data_leaks_list);
console.log('email_data_leaks_list length:', report.email_data_leaks_list?.length);
console.log('email_data_leaks_list (first 200 chars):', 
  typeof report.email_data_leaks_list === 'string' 
    ? report.email_data_leaks_list.substring(0, 200) 
    : report.email_data_leaks_list
);
console.log('email_data_leaks_count:', report.email_data_leaks_count);
console.log('data_leaks_count:', report.data_leaks_count);
console.log('data_leaks_first_seen:', report.data_leaks_first_seen);
console.log('data_leaks_last_seen:', report.data_leaks_last_seen);

// Check ALL fields that might contain breach data
console.log('\n🔍 [CHECKING ALL BREACH-RELATED FIELDS]');
const breachFields = [
  'email_data_leaks_list',
  'emaildataleakslist',
  'email_leaks_list',
  'emailleakslist',
  'breaches',
  'email_breaches',
  'leaks'
];
breachFields.forEach(field => {
  if (report[field]) {
    console.log(`✅ FOUND: ${field} =`, typeof report[field], report[field]?.length || report[field]);
  }
});
console.log('🚨 [END DEBUG]\n');

// 🔥 Parse breach data from email_data_leaks_list
// Helper function to parse comma-separated strings
const parseCommaSeparated = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

// 🔥 Parse email_data_leaks_list into structured array (for display only)
let parsedBreaches = [];
if (report.email_data_leaks_list) {
  const breachEntries = report.email_data_leaks_list
    .split(';')
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  breachEntries.forEach(entry => {
    // Format: "Zomato, Zomato, 2017-05-17, 16472873, https://..."
    const parts = entry.split(',').map(p => p.trim());
    
    if (parts.length >= 3) {
      parsedBreaches.push({
        name: parts[0] || 'Unknown',
        title: parts[1] || parts[0] || 'Unknown',
        breach_date: parts[2] || 'Unknown',
        breach_id: parts[3] || null,
        logo_url: parts[4] || null,
      });
    }
  });
}
// ❌ DON'T calculate breachCount - use Scoreplex's direct API count

// ✅✅✅ YOUR MANAGER'S REQUIREMENT: Use Scoreplex API counts directly ✅✅✅
intelligence.data_leaks = {
  report: {
    // ✅ Use DIRECT counts from Scoreplex API (not calculated from parsed array)
    data_leaks_count: report.data_leaks_count || 0,
    data_leaks_first_seen: report.data_leaks_first_seen || "N/A",
    data_leaks_last_seen: report.data_leaks_last_seen || "N/A",

    // ✅ Email breach count from Scoreplex API
    email_data_leaks_count: report.email_data_leaks_count || 0,
    email_data_leaks_list: parsedBreaches,  // Array of breach objects for display
    email_data_leaks_first_seen: report.email_data_leaks_first_seen || "N/A",
    email_data_leaks_last_seen: report.email_data_leaks_last_seen || "N/A",

    // ✅ Phone breach count from Scoreplex API
    phone_data_leaks_count: report.phone_data_leaks_count || 0,
    phone_data_leaks_list: report.phone_data_leaks_list || [],
    phone_data_leaks_first_seen: report.phone_data_leaks_first_seen || "N/A",
    phone_data_leaks_last_seen: report.phone_data_leaks_last_seen || "N/A",
  },

  sl_data: {
    phones: parseCommaSeparated(
      report.sl_data_phones ||
      report.phone_numbers_list ||
      report.phones
    ),
    emails: parseCommaSeparated(
      report.sl_data_emails ||
      report.email_addresses ||
      report.emails
    ),
    fullnames: parseCommaSeparated(
      report.sl_data_full_names || report.full_names
    ),
    aliases: parseCommaSeparated(
      report.sl_data_aliases || report.aliases
    ),
    accounts: parseCommaSeparated(
      report.sl_data_accounts || report.accounts_registered_list
    ),
    addresses: parseCommaSeparated(
      report.sl_data_addresses || report.addresses || report.address_list
    ),
    genders: report.sl_data_genders || report.gender || "N/A",
    birthdays:
      report.sl_data_birthdays ||
      report.birthday ||
      report.date_of_birth ||
      "N/A",
  },
};

// ✅ Backward compatibility: Keep intelligence.darknet pointing to same data
intelligence.darknet = intelligence.data_leaks;

// ✅ Console logs showing both API counts and parsed data
console.log('\n🔥 [DATA LEAKS MAPPED - FROM SCOREPLEX API]');
console.log('Data Leaks Count (Scoreplex API):', intelligence.data_leaks.report.data_leaks_count);
console.log('Data Leaks First Seen:', intelligence.data_leaks.report.data_leaks_first_seen);
console.log('Data Leaks Last Seen:', intelligence.data_leaks.report.data_leaks_last_seen);
console.log('Email Breach Count (Scoreplex API):', intelligence.data_leaks.report.email_data_leaks_count);
console.log('Email Leaks First Seen:', intelligence.data_leaks.report.email_data_leaks_first_seen);
console.log('Email Leaks Last Seen:', intelligence.data_leaks.report.email_data_leaks_last_seen);
console.log('Phone Breach Count (Scoreplex API):', intelligence.data_leaks.report.phone_data_leaks_count);
console.log('Phone Leaks First Seen:', intelligence.data_leaks.report.phone_data_leaks_first_seen);
console.log('Parsed Breaches Array (for display):', parsedBreaches.length);
console.log('Sample Breaches:', parsedBreaches.slice(0, 3).map(b => b.name));

console.log('\n📊 [DARKNET SL DATA - ASSOCIATED INFORMATION]');
console.log('Associated Phones:', intelligence.data_leaks.sl_data.phones.length);
console.log('Associated Emails:', intelligence.data_leaks.sl_data.emails.length);
console.log('Associated Names:', intelligence.data_leaks.sl_data.fullnames.length);
console.log('Associated Aliases:', intelligence.data_leaks.sl_data.aliases.length);
console.log('Associated Accounts:', intelligence.data_leaks.sl_data.accounts.length);
console.log('Associated Addresses:', intelligence.data_leaks.sl_data.addresses.length);



          intelligence.overallScore = report.overall_score || 0;
          intelligence.scoring = {
            overall: report.overall_score || 0,
            email: report.email_score || 0,
            phone: report.phone_score || 0,
            name: report.name_score || 0,
            ip: report.ip_score || 0,
          };

          intelligence.scoreplexData = report;
        }
      } catch (scoreplexError) {
        console.error("❌ [SCOREPLEX] Fetch error:", scoreplexError.message);
      }
    }

    console.log(`✅ [DASHBOARD] Data prepared for session: ${sessionId}`);

    // Normalize customerData so phone/email always available for dashboard display
    const agentData = session.agentData || {};
    const customerData = {
      ...agentData,
      phone: agentData.phone || agentData.phoneNumber || agentData.mobileNumber || agentData.phone,
      email: agentData.email || agentData.emailId || agentData.contactEmailId || agentData.email,
    };

    res.json({
      success: true,
      customerData,
      intelligence: intelligence,
      sessionInfo: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        hasScoreplex: !!session.scoreplexTaskId,
        hasSDK: !!(session.sdkData && session.sdkData.length > 0),
        // ✅ Add selected IP info
        selectedIP: session.selectedIP || "N/A",
        ipSource: session.ipSource || "unknown", // global, ipv4, ipv6, or backend
      },
    });
  } catch (error) {
    console.error("❌ [DASHBOARD] Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// ✅ SAVE AGENT DATA
// ==========================================
app.post("/api/save-agent-data", async (req, res) => {
  try {
    const { sessionId, customerData } = req.body;

    console.log(`💾 [AGENT] Saving customer data for session: ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        sessionId,
        verified: false,
        createdAt: Date.now(),
      };
    }

    sessions[sessionId].agentData = customerData;
    sessions[sessionId].updatedAt = Date.now();
    persistSessions();

    console.log(`✅ [AGENT] Customer data saved`);

    // Start Scoreplex when user clicks submit so data is ready when they open dashboard
    if (customerData && (customerData.phone || customerData.phoneNumber || customerData.mobileNumber || customerData.email || customerData.emailId || customerData.contactEmailId)) {
      await createScoreplexTask(sessionId, customerData, "");
    }

    res.json({
      success: true,
      message: "Agent data saved successfully",
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("❌ [AGENT] Save error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// 🧪 TEST SCOREPLEX ENDPOINT
// ==========================================
app.get("/api/test-scoreplex/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions[sessionId];

    if (!session || !session.scoreplexTaskId) {
      return res.json({ error: "No Scoreplex task found" });
    }

    console.log("🧪 [TEST] Fetching Scoreplex report...");

    const scoreplexApiKey = process.env.SCOREPLEX_API_KEY;

    const scoreplexResponse = await axios.get(
      `https://api.scoreplex.io/api/v1/search/task/${session.scoreplexTaskId}`,
      {
        params: {
          api_key: scoreplexApiKey,
          report: false,
        },
      },
    );

    const report = scoreplexResponse.data.report;

     console.log('✅ [SCOREPLEX] email_data_leaks_count:', report.email_data_leaks_count);
  console.log('✅ [SCOREPLEX] email_data_leaks_list:', report.email_data_leaks_list ? 'PRESENT' : 'NULL');

    console.log("📦 [FULL REPORT]:", JSON.stringify(report, null, 2));

    res.json({
      success: true,
      taskId: session.scoreplexTaskId,
      reportKeys: Object.keys(report),
      fullReport: report,
      phoneFields: {
        phone: report.phone,
        phone_valid: report.phone_valid,
        phone_active: report.phone_active,
        phone_line_type: report.phone_line_type,
        phone_carrier: report.phone_carrier,
        phone_country: report.phone_country,
        phone_city: report.phone_city,
        phone_region: report.phone_region,
        true_caller_fullname: report.true_caller_fullname,
        true_caller_city: report.true_caller_city,
        true_caller_operator: report.true_caller_operator,
      },
      customerData: session.agentData,
    });
  } catch (error) {
    console.error("❌ [TEST] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CASES MANAGER - LIST ALL CASES
// ==========================================
app.get("/api/cases", (req, res) => {
  console.log("📋 [CASES] Fetching all cases");
  console.log("📋 [CASES] Total sessions:", Object.keys(sessions).length);
  
  // Debug: Show what's in each session
  Object.entries(sessions).forEach(([sessionId, session]) => {
    console.log(`  Session ${sessionId}:`, {
      hasAgentData: !!session.agentData,
      hasSDKData: !!session.sdkData,
      agentName: session.agentData?.customerName,
      sdkEventsCount: session.sdkData?.length
    });
  });
  
  // ✅ LESS STRICT: Show cases even if only agentData exists
  const allCases = Object.entries(sessions)
    .filter(([sessionId, session]) => session.agentData) // Only need agentData
    .map(([sessionId, session], index) => {
      const caseNumber = String(index + 1).padStart(6, '0');
      return {
        caseNumber: `CASE-${caseNumber}`,
        leadNo: session.agentData.phone || session.agentData.phoneNumber || session.agentData.mobileNumber || 'N/A',
        name: session.agentData.customerName || session.agentData.name || 'Unknown',
        date: new Date(session.createdAt || Date.now()).toLocaleDateString('en-GB'),
        status: session.sdkData ? 'Completed' : 'Pending',
        sessionId: sessionId,
      };
    })
    .reverse();

  console.log(`📋 [CASES] Found ${allCases.length} cases`);
  res.json({
    success: true,
    cases: allCases,
    total: allCases.length,
  });
});

// Keep existing endpoints below...


// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log("===========================================");
  console.log("🚀 Mappls Proxy Server Started!");
  console.log("===========================================");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`✅ API key secured in environment variables`);
  console.log("===========================================");
  console.log("Available endpoints:");
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  POST http://localhost:${PORT}/api/reverse-geocode`);
  console.log(`  POST http://localhost:${PORT}/api/geocode`);
  console.log(`  POST http://localhost:${PORT}/api/calculate-distance`);
  console.log(
    `  POST http://localhost:${PORT}/api/calculate-agent-user-distance`,
  );
  console.log(`  POST http://localhost:${PORT}/api/save-sdk-data`);
  console.log(
    `  GET  http://localhost:${PORT}/api/check-verification/:sessionId`,
  );
  console.log(`  GET  http://localhost:${PORT}/api/dashboard-data/:sessionId`);
  console.log(`  GET  http://localhost:${PORT}/api/test-scoreplex/:sessionId`);
  console.log("===========================================");
});

module.exports = app;
