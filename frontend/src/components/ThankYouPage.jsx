import React, { useEffect } from 'react';
import '../styles/ThankYou.css';

function ThankYouPage() {
  useEffect(() => {
    // Optional: Auto-close window after 10 seconds
    const timer = setTimeout(() => {
      console.log('✅ [THANK YOU] Session complete');
      // Uncomment to auto-close: window.close();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="thank-you-page">
      <div className="thank-you-card">
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>
        
        <h1 className="thank-you-title">Thank You!</h1>
        <p className="thank-you-message">
          Your verification has been completed successfully.
        </p>
        <p className="thank-you-submessage">
          Your information has been securely submitted to the agent.
        </p>

        <div className="thank-you-details">
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Identity Verified</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Device Information Captured</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Location Verified</span>
          </div>
        </div>

        <div className="thank-you-footer">
          <p className="footer-text">
            You can now safely close this window.
          </p>
          <button 
            className="close-button" 
            onClick={() => {
              const casesUrl = `${window.location.origin}/cases`;
              window.open(casesUrl, '_blank');
              window.close();
            }}
          >
            Close Window
          </button>
        </div>

        <div className="powered-by">
          <span>Secured by</span>
          <strong>Bargad.ai</strong>
        </div>
      </div>
    </div>
  );
}

export default ThankYouPage;
