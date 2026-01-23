// main.js (SDK consumer / demo file)

import { Bargad } from "./public/sdk/bargad-bundle.js";

console.log("Initializing Bargad SDK demo...");

// ✅ WRAP IN DOMContentLoaded - This fixes INPUT_PATTERN_ANALYSIS
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM loaded, initializing Bargad SDK...');
  
  const bargad = new Bargad("test-api-key", "test-user-1");

  // ✅ NEW SDK CONFIG - Add these for new features
  

  // Enable features (EXISTING CONFIG - Keep all your settings)
  bargad.trackFormTime = {
    enabled: true,
    args: 
    [["test-form"], 
    ["form-submit-btn"]]
  };

  bargad.trackOTPAttempts = {
    enabled: true,
    args: [["otp-verify-btn"]]
  };

  bargad.trackKeypressEvents = true;
  bargad.customClipboardEvents = true;
  bargad.trackLongPressEvents = true;
  bargad.trackTapEvents = true;
  bargad.trackScreenOrientation = true;
  bargad.trackDisplaySettings = true;
  bargad.trackSwipeEvents = true; 
  bargad.trackPinchGestures = true;  
  bargad.trackAmbientLight = true;
  bargad.trackDeviceLocation = true;
  bargad.trackGyroscope = true; 
  bargad.trackProximitySensor = true;
  bargad.trackMotionEvents = true;
  bargad.trackAccelerometerEvents = true;
  bargad.trackDeviceScreenSize = true;
  bargad.trackDeviceID = true;
  bargad.trackIMEI = true;
  bargad.trackBluetoothDevices = true;
  bargad.trackCPUCores = true;

  // Start SDK (now form exists!)
  bargad.initialize();

  window.bargad = bargad;

  if (bargad.initInputPatternAnalysis) {
    bargad.initInputPatternAnalysis();
    console.log('✅ Input Pattern Analysis initialized');
  }

  // ✅ ADD THIS: Manually initialize TOUCH_BIOMETRICS
  if (bargad.initTouchBiometrics) {
    bargad.initTouchBiometrics();
    console.log('✅ Touch Biometrics initialized');
  }

  console.log("✅ Bargad SDK initialized successfully!");
});

console.log("⏳ Waiting for DOM to load...");
