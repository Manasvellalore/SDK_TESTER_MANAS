// frontend/src/hooks/useBargadSDK.js
import { useEffect, useState } from 'react';

export const useBargadSDK = (userId) => {
  const [bargadInstance, setBargadInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('🚀 Loading Bargad SDK...');
        
        // Check if already loaded
        if (window.Bargad) {
          console.log('✅ SDK already loaded');
          initializeBargad();
          return;
        }
        
        // Load SDK script from public folder
        const script = document.createElement('script');
        script.src = `${process.env.PUBLIC_URL}/sdk/bargad-bundle.js`;  // ← FIX: Add PUBLIC_URL
        script.async = true;
        script.type = 'text/javascript';  // ← FIX: Change to text/javascript
        
        script.onload = () => {
          console.log('✅ SDK script loaded');
          
          // Wait for Bargad to be available
          const checkBargad = setInterval(() => {
            if (window.Bargad) {
              clearInterval(checkBargad);
              console.log('✅ Bargad found on window');
              initializeBargad();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkBargad);
            if (!window.Bargad) {
              setError('Bargad SDK timeout');
              setIsLoading(false);
            }
          }, 5000);
        };

        script.onerror = (e) => {
          console.error('❌ Failed to load SDK script', e);
          setError('Failed to load Bargad SDK script');
          setIsLoading(false);
        };

        // Add script to document
        document.body.appendChild(script);
        
        function initializeBargad() {
          try {
            // Initialize Bargad SDK
            const instance = new window.Bargad('test-api-key', userId || 'test-user-1');
            
            // Enable all tracking features
            instance.trackFormTime = { enabled: true, args: [['loan-form'], ['submit-button']] };
            instance.trackKeypressEvents = true;
            instance.customClipboardEvents = true;
            instance.trackOTPAttempts = { enabled: true, args: [['verify-otp-button']] };
            instance.trackLongPressEvents = true;
            instance.trackTapEvents = true;
            instance.trackScreenOrientation = true;
            instance.trackDisplaySettings = true;
            instance.trackSwipeEvents = true;
            instance.trackPinchGestures = true;
            instance.trackAmbientLight = true;
            instance.trackDeviceLocation = true;
            instance.trackGyroscope = true;
            instance.trackProximitySensor = true;
            instance.trackMotionEvents = true;
            instance.trackAccelerometerEvents = true;
            instance.trackDeviceScreenSize = true;
            instance.trackDeviceID = true;
            instance.trackIMEI = true;
            instance.trackBluetoothDevices = true;
            instance.trackCPUCores = true;

            // Initialize SDK
            instance.initialize();
            
            console.log('✅ Bargad SDK initialized successfully');
            setBargadInstance(instance);
            setIsLoading(false);
          } catch (err) {
            console.error('❌ Bargad initialization error:', err);
            setError(err.message);
            setIsLoading(false);
          }
        }
        
      } catch (err) {
        console.error('❌ SDK loading error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeSDK();
    
  }, [userId]);

  return { bargadInstance, isLoading, error };
};
