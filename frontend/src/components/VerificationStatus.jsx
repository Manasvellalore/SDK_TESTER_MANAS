import React from 'react';
import { CheckCircle, Clock, Loader } from 'lucide-react';
import '../styles/VerificationStatus.css';

const VerificationStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={20} />,
          text: 'Waiting for verification',
          className: 'status-pending'
        };
      case 'processing':
        return {
          icon: <Loader size={20} className="spinning" />,
          text: 'Verifying...',
          className: 'status-processing'
        };
      case 'verified':
        return {
          icon: <CheckCircle size={20} />,
          text: 'Verified',
          className: 'status-verified'
        };
      default:
        return {
          icon: <Clock size={20} />,
          text: 'Pending',
          className: 'status-pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`verification-status ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

export default VerificationStatus;
