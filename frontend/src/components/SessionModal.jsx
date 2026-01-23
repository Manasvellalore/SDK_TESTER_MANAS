import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/SessionModal.css';

const SessionModal = ({ sessionData, onClose }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionData.verificationLink);
    toast.success('Link copied to clipboard!');
  };

  const openInNewTab = () => {
    window.open(sessionData.verificationLink, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>OTP Sent Successfully!</h2>
          <p>Share this link with the customer</p>
        </div>

        <div className="modal-body">
          {/* QR Code */}
          <div className="qr-section">
            <div className="qr-code-wrapper">
            <QRCodeCanvas 
  value={sessionData.verificationLink}
  size={200}
  level="H"
  includeMargin={true}
/>

            </div>
            <p className="qr-instruction">Scan with mobile device</p>
          </div>

          {/* Link Section */}
          <div className="link-section">
            <label>Verification Link</label>
            <div className="link-display">
              <input 
                type="text" 
                value={sessionData.verificationLink} 
                readOnly 
                className="link-input"
              />
              <button className="btn-icon" onClick={copyToClipboard} title="Copy">
                <Copy size={18} />
              </button>
              <button className="btn-icon" onClick={openInNewTab} title="Open">
                <ExternalLink size={18} />
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-summary">
            <h4>Customer Details</h4>
            <div className="summary-grid">
              <div><strong>Name:</strong> {sessionData.customerData.customerName}</div>
              <div><strong>Phone:</strong> {sessionData.customerData.phoneNumber}</div>
              <div><strong>Email:</strong> {sessionData.customerData.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
