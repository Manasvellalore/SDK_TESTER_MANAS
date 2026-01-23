const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get MapmyIndia route between two points
router.post('/get-route', async (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon } = req.body;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const accessToken = process.env.MAPPLS_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ MAPPLS_ACCESS_TOKEN not found in .env');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // MapmyIndia Direction API
    const url = `https://apis.mappls.com/advancedmaps/v1/${accessToken}/route_adv/driving/${startLon},${startLat};${endLon},${endLat}?geometries=polyline&overview=full`;

    console.log('🗺️ Fetching route from MapmyIndia...');
    const response = await axios.get(url);

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      res.json({
        success: true,
        route: {
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration
        }
      });

      console.log('✅ Route fetched:', {
        distance: (route.distance / 1000).toFixed(2) + ' km',
        duration: Math.round(route.duration / 60) + ' min'
      });
    } else {
      res.json({
        success: false,
        message: 'No route found'
      });
    }
  } catch (error) {
    console.error('❌ MapmyIndia route error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
