import React, { useState, useEffect } from 'react';
import MapView from './MapView';
import VerificationStatus from './VerificationStatus';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Send } from 'lucide-react';
import '../styles/OnboardingForm.css';

const OnboardingForm = ({ onGenerateOTP, verificationStatus, sessionData }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phoneNumber: '',
    address: '',
    location: null
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const { customerName, email, phoneNumber, address } = formData;
    const isValid = customerName && email && phoneNumber && address;
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location,
      address: location.address || prev.address
    }));
  };

  const handleGenerateOTP = () => {
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    toast.loading('Generating OTP...', { duration: 1000 });
    
    setTimeout(() => {
      onGenerateOTP(formData);
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    }, 1000);
  };

  const handleSubmit = () => {
    if (verificationStatus !== 'verified') {
      toast.error('Please wait for phone verification');
      return;
    }

    toast.success('Customer onboarded successfully! 🎉');
    // Reset form
    setTimeout(() => {
      setFormData({
        customerName: '',
        email: '',
        phoneNumber: '',
        address: '',
        location: null
      });
      setOtpSent(false);
    }, 2000);
  };

  return (
    <div className="onboarding-form-container">
      <div className="form-card">
        {/* Step Indicator */}
        <div className="steps-indicator">
          <div className="step active">
            <div className="step-number">1</div>
            <span>Customer Details</span>
          </div>
          <div className={`step ${otpSent ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Phone Verification</span>
          </div>
          <div className={`step ${verificationStatus === 'verified' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Complete</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="form-grid">
          {/* Customer Name */}
          <div className="form-group">
            <label>
              <User size={18} />
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className="form-input"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>
              <Mail size={18} />
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="customer@example.com"
              className="form-input"
            />
          </div>

          {/* Phone Number with Verification */}
          <div className="form-group phone-group">
            <label>
              <Phone size={18} />
              Phone Number *
            </label>
            <div className="phone-input-wrapper">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+91 98765 43210"
                className="form-input"
                disabled={otpSent}
              />
              {otpSent && (
                <VerificationStatus status={verificationStatus} />
              )}
            </div>
          </div>

          {/* Address */}
          <div className="form-group full-width">
            <label>
              <MapPin size={18} />
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              className="form-input"
            />
          </div>

          {/* Map View */}
          <div className="form-group full-width">
            <label>Select Location on Map</label>
            <div className="map-wrapper">
              <MapView onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          {!otpSent ? (
            <button 
              className="btn-primary btn-generate-otp"
              onClick={handleGenerateOTP}
              disabled={!isFormValid}
            >
              <Send size={20} />
              Generate OTP
            </button>
          ) : (
            <div className="verification-actions">
              <button 
                className="btn-secondary"
                onClick={() => setOtpSent(false)}
              >
                Edit Details
              </button>
              <button 
                className="btn-success"
                onClick={handleSubmit}
                disabled={verificationStatus !== 'verified'}
              >
                Complete Onboarding
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session Info */}
      {sessionData && (
        <div className="session-info">
          <p>Session ID: <code>{sessionData.sessionId}</code></p>
          <p className="info-text">Waiting for customer to verify...</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingForm;
