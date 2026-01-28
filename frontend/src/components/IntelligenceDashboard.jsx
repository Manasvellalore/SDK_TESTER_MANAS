import React, { useState } from 'react';
import '../styles/IntelligenceDashboard.css';

const IntelligenceDashboard = ({ intelligence, customerData, sessionInfo }) => {
  const [activeTab, setActiveTab] = useState('email'); // Default tab

  if (!intelligence) {
    return <div className="loading">Loading intelligence data...</div>;
  }

  // Helper function to render boolean values
  const renderBoolean = (value) => {
    if (value === true) return <span className="badge badge-success">✓ Yes</span>;
    if (value === false) return <span className="badge badge-danger">✗ No</span>;
    return <span className="badge badge-neutral">N/A</span>;
  };

  // Helper function to render value with color coding
  const renderValue = (value, type = 'default') => {
    if (value === null || value === undefined || value === 'N/A') {
      return <span className="value-na">N/A</span>;
    }
    
    if (type === 'score') {
      const score = parseInt(value);
      let className = 'value-score ';
      if (score >= 800) className += 'score-good';
      else if (score >= 600) className += 'score-medium';
      else if (score >= 400) className += 'score-low';
      else className += 'score-critical';
      return <span className={className}>{value}</span>;
    }
    
    if (type === 'count') {
      return <span className={`value-count ${value > 0 ? 'count-positive' : ''}`}>{value}</span>;
    }
    
    return <span className="value-default">{value}</span>;
  };

  // Count statistics for top cards
  const getStatistics = () => {
    return {
      accounts: intelligence.darknet?.sl_data?.accounts?.length || 0,
      names: intelligence.darknet?.sl_data?.full_names?.length || 0,
      emails: intelligence.darknet?.sl_data?.emails?.length || 0,
      phoneNumbers: intelligence.darknet?.sl_data?.phones?.length || 0,
      locations: 0, // Will be calculated from data
      aliases: intelligence.darknet?.sl_data?.aliases?.length || 0
    };
  };

  const stats = getStatistics();

  // Navigation items
  const navItems = [
    { id: 'email', icon: '📧', label: 'Email Intelligence', count: 32 },
    { id: 'phone', icon: '📱', label: 'Phone Intelligence', count: 19 },
    { id: 'ip', icon: '🌐', label: 'IP Intelligence', count: 22 },
    { id: 'darknet', icon: '🕵️', label: 'Darknet & Data Leaks', count: null },
    { id: 'social', icon: '🌐', label: 'Social Media', count: null }, // ✅ ADD THIS LINE
    { id: 'sdk', icon: '📲', label: 'SDK Data', count: null }, // NEW!
    { id: 'overview', icon: '📊', label: 'Risk Overview', count: null }
  ];

  // Render content based on active tab
  const renderContent = () => { 
  switch (activeTab) {
    case 'overview':
      return renderOverview();
    case 'email':
      return renderEmailIntelligence();
    case 'phone':
      return renderPhoneIntelligence();
    case 'ip':
      return renderIPIntelligence();
    case 'darknet':
      return renderDarknetIntelligence();
    case 'social':  // ✅ ADD THIS CASE
      return renderSocialMedia();
    case 'sdk':
      return renderSDKData();
    default:
      return <div>Select a category</div>;
  }
};

  // Email Intelligence Content
  const renderEmailIntelligence = () => (
    <div className="content-section">
      <h2 className="content-title">📧 Email Intelligence</h2>
      
      <div className="content-grid">
        {/* Email Validation */}
        <div className="content-card">
          <h3 className="card-header">Email Validation</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Valid</span>
              {renderBoolean(intelligence.email.email_valid)}
            </div>
            <div className="data-row">
              <span className="label">Email - Delivery Rate</span>
              <span className={`badge ${intelligence.email.email_deliverability === 'high' ? 'badge-success' : 'badge-warning'}`}>
                {intelligence.email.email_deliverability || 'N/A'}
              </span>
            </div>
            <div className="data-row">
              <span className="label">Email - Temporary</span>
              {renderBoolean(intelligence.email.email_disposable)}
            </div>
            <div className="data-row">
              <span className="label">Email - Generic</span>
              {renderBoolean(intelligence.email.email_generic)}
            </div>
            <div className="data-row">
              <span className="label">Email - Popular Domain</span>
              {renderBoolean(intelligence.email.email_common)}
            </div>
            <div className="data-row">
              <span className="label">Email - Google Name Valid</span>
              {renderBoolean(intelligence.email.email_google_name_valid)}
            </div>
          </div>
        </div>

        {/* Email Threats */}
        <div className="content-card">
          <h3 className="card-header">Email Threats & Risks</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Recent Abuse Activity</span>
              {renderBoolean(intelligence.email.email_recent_abuse)}
            </div>
            <div className="data-row">
              <span className="label">Email - Spam Trap Score</span>
              {renderValue(intelligence.email.email_spam_trap_score, 'score')}
            </div>
            <div className="data-row">
              <span className="label">Email - Frequent Complaint History</span>
              {renderBoolean(intelligence.email.email_frequent_complainer)}
            </div>
            <div className="data-row">
              <span className="label">Email - Suspicious</span>
              {renderBoolean(intelligence.email.email_suspect)}
            </div>
            <div className="data-row">
              <span className="label">Email - Activity</span>
              {renderValue(intelligence.email.email_user_activity)}
            </div>
          </div>
        </div>

        {/* Domain Analysis */}
        <div className="content-card">
          <h3 className="card-header">Domain Analysis</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Domain Age</span>
              {renderValue(intelligence.email.email_domain_age)}
            </div>
            <div className="data-row">
              <span className="label">Email - Domain Activity</span>
              {renderValue(intelligence.email.email_domain_velocity)}
            </div>
            <div className="data-row">
              <span className="label">Email - Domain Trust</span>
              <span className={`badge ${intelligence.email.email_domain_trust === 'trusted' ? 'badge-success' : 'badge-neutral'}`}>
                {intelligence.email.email_domain_trust || 'N/A'}
              </span>
            </div>
            <div className="data-row">
              <span className="label">Email - Sender Reputation Score</span>
              {renderValue(intelligence.email.email_smtp_score, 'score')}
            </div>
            <div className="data-row">
              <span className="label">Email - Risky Extension</span>
              {renderBoolean(intelligence.email.email_risky_tld)}
            </div>
            <div className="data-row">
              <span className="label">Email - Domain Corrected</span>
              {renderValue(intelligence.email.email_suggested_domain)}
            </div>
          </div>
        </div>

        {/* Email Security */}
        <div className="content-card">
          <h3 className="card-header">Email Security Records</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Allowed Senders List (SPF)</span>
              {renderBoolean(intelligence.email.email_spf_record)}
            </div>
            <div className="data-row">
              <span className="label">Email - Spoof Protection (DMARC)</span>
              {renderBoolean(intelligence.email.email_dmarc_record)}
            </div>
            <div className="data-row">
              <span className="label">Email - Mail Exchange Records (MX)</span>
              {renderBoolean(intelligence.email.email_mx_records)}
            </div>
          </div>
        </div>

        {/* Email Format */}
        <div className="content-card">
          <h3 className="card-header">Email Format Analysis</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Format</span>
              {renderBoolean(!intelligence.email.email_format_is_bad)}
            </div>
            <div className="data-row">
              <span className="label">Email - Contains Stop Words</span>
              {renderBoolean(intelligence.email.email_has_stop_words)}
            </div>
            <div className="data-row">
              <span className="label">Email - Username Length</span>
              {renderValue(intelligence.email.email_account_length, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Email - Vowels Counts</span>
              {renderValue(intelligence.email.email_account_vowels_count, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Email - Consonants Counts</span>
              {renderValue(intelligence.email.email_account_consonants_count, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Email - Digit Count</span>
              {renderValue(intelligence.email.email_account_digit_count, 'count')}
            </div>
          </div>
        </div>

        {/* Email Profile */}
        <div className="content-card">
          <h3 className="card-header">Email Profile & Links</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - User Name</span>
              {renderValue(intelligence.email.email_first_name)}
            </div>
            <div className="data-row">
              <span className="label">Email - Social Profile Picture</span>
              {renderBoolean(intelligence.email.email_social_has_profile_picture)}
            </div>
            <div className="data-row">
              <span className="label">Emails - Linked to this ID count</span>
              {renderValue(intelligence.email.email_addresses_amount, 'count')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Phone Intelligence Content
  const renderPhoneIntelligence = () => (
    <div className="content-section">
      <h2 className="content-title">📱 Phone Intelligence</h2>
      
      <div className="content-grid">
        {/* Phone Validation */}
        <div className="content-card">
          <h3 className="card-header">Phone Validation</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Phone No - Valid</span>
              {renderBoolean(intelligence.phone.phone_valid)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Active</span>
              {renderBoolean(intelligence.phone.phone_active)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Line Type</span>
              {renderValue(intelligence.phone.phone_line_type)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Network Carrier</span>
              {renderValue(intelligence.phone.phone_carrier)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Internet Based (VOIP)</span>
              {renderBoolean(intelligence.phone.phone_voip)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Prepaid</span>
              {renderBoolean(intelligence.phone.phone_prepaid)}
            </div>
          </div>
        </div>

        {/* Phone Risk */}
        <div className="content-card">
          <h3 className="card-header">Phone Risk Assessment</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Phone No - Risky Activity</span>
              {renderBoolean(intelligence.phone.phone_risky)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Recently Abused Activity</span>
              {renderBoolean(intelligence.phone.phone_recent_abuse)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Spam</span>
              {renderBoolean(intelligence.phone.phone_spammer)}
            </div>
          </div>
        </div>

        {/* Phone Location */}
        <div className="content-card">
          <h3 className="card-header">Phone Location</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Phone No - Country</span>
              {renderValue(intelligence.phone.phone_country)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Region</span>
              {renderValue(intelligence.phone.phone_region)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - City</span>
              {renderValue(intelligence.phone.phone_city)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Zip Code</span>
              {renderValue(intelligence.phone.phone_zip_code)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Timezone</span>
              {renderValue(intelligence.phone.phone_timezone)}
            </div>
          </div>
        </div>

        {/* Phone Profile */}
        <div className="content-card">
          <h3 className="card-header">Phone Profile</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Phone No - User Name</span>
              {renderValue(intelligence.phone.phone_name)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Social Media Profile Picture</span>
              {renderBoolean(intelligence.phone.phone_social_has_profile_picture)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Linked To This Phone No Count</span>
              {renderValue(intelligence.phone.phone_numbers_amount, 'count')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // IP Intelligence Content
  const renderIPIntelligence = () => (
    <div className="content-section">
      <h2 className="content-title">🌐 IP Intelligence</h2>
      
      <div className="content-grid">
        {/* IP Location */}
        <div className="content-card">
          <h3 className="card-header">IP Location</h3>
          <div className="card-rows">
            <div className="data-row">
  <span className="label">IP Address</span>
  <span className="value-default">
    {intelligence.ip.ip || 'N/A'}
    {sessionInfo?.selectedIP && sessionInfo?.ipSource && (
      <span style={{
        marginLeft: '10px',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75em',
        fontWeight: '600',
        backgroundColor: sessionInfo.ipSource === 'global' ? 'rgba(16, 185, 129, 0.2)' : 
                         sessionInfo.ipSource === 'ipv4' ? 'rgba(245, 158, 11, 0.2)' : 
                         sessionInfo.ipSource === 'ipv6' ? 'rgba(59, 130, 246, 0.2)' : 
                         'rgba(239, 68, 68, 0.2)',
        color: sessionInfo.ipSource === 'global' ? '#10b981' : 
               sessionInfo.ipSource === 'ipv4' ? '#f59e0b' : 
               sessionInfo.ipSource === 'ipv6' ? '#3b82f6' : 
               '#ef4444'
      }}>
        {sessionInfo.ipSource.toUpperCase()}
      </span>
    )}
  </span>
</div>

            <div className="data-row">
              <span className="label">IP - Country</span>
              {renderValue(intelligence.ip.ip_country)}
            </div>
            <div className="data-row">
              <span className="label">IP - Region</span>
              {renderValue(intelligence.ip.ip_region)}
            </div>
            <div className="data-row">
              <span className="label">IP - City</span>
              {renderValue(intelligence.ip.ip_city)}
            </div>
            <div className="data-row">
              <span className="label">IP - Timezone</span>
              {renderValue(intelligence.ip.ip_time_zone)}
            </div>
            <div className="data-row">
              <span className="label">IP - Latitude</span>
              {renderValue(intelligence.ip.ip_latitude)}
            </div>
            <div className="data-row">
              <span className="label">IP - Longitude</span>
              {renderValue(intelligence.ip.ip_longitude)}
            </div>
          </div>
        </div>

        {/* IP Network */}
        <div className="content-card">
          <h3 className="card-header">IP Network Information</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">IP - Internet Service Provider</span>
              {renderValue(intelligence.ip.ip_isp)}
            </div>
            <div className="data-row">
              <span className="label">IP - Organization</span>
              {renderValue(intelligence.ip.ip_organization)}
            </div>
            <div className="data-row">
              <span className="label">IP - ASN</span>
              {renderValue(intelligence.ip.ip_asn)}
            </div>
            <div className="data-row">
              <span className="label">IP - Connection Type</span>
              {renderValue(intelligence.ip.ip_connection_type)}
            </div>
            <div className="data-row">
              <span className="label">IP - Dynamic Connection</span>
              {renderBoolean(intelligence.ip.ip_dynamic_connection)}
            </div>
            <div className="data-row">
              <span className="label">IP - Shared by Many Users</span>
              {renderBoolean(intelligence.ip.ip_shared_connection)}
            </div>
            <div className="data-row">
              <span className="label">IP - Trusted</span>
              {renderBoolean(intelligence.ip.ip_trusted_network)}
            </div>
          </div>
        </div>

        {/* IP Security */}
        <div className="content-card">
          <h3 className="card-header">IP Security Threats</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">IP - Proxy</span>
              {renderBoolean(intelligence.ip.ip_proxy)}
            </div>
            <div className="data-row">
              <span className="label">IP - Virtual Private Network (VPN)</span>
              {renderBoolean(intelligence.ip.ip_vpn)}
            </div>
            <div className="data-row">
              <span className="label">IP - TOR Network</span>
              {renderBoolean(intelligence.ip.ip_tor)}
            </div>
            <div className="data-row">
              <span className="label">IP - Recent Fraud</span>
              {renderBoolean(intelligence.ip.ip_recent_fraud)}
            </div>
            <div className="data-row">
              <span className="label">IP - Frequent Fraud History</span>
              {renderBoolean(intelligence.ip.ip_frequent_fraud)}
            </div>
            <div className="data-row">
              <span className="label">IP - High Risk Attack Record</span>
              {renderBoolean(intelligence.ip.ip_high_risk_attacks)}
            </div>
            <div className="data-row">
              <span className="label">IP - Recent Bot Activity</span>
              {renderBoolean(intelligence.ip.ip_bot_activity)}
            </div>
            <div className="data-row">
              <span className="label">IP - Crawler Activity</span>
              {renderBoolean(intelligence.ip.ip_is_crawler)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Darknet Intelligence Content
  const renderDarknetIntelligence = () => (
    <div className="content-section">
      <h2 className="content-title">🕵️ Darknet & Data Leaks</h2>
      
      <div className="content-grid">
        {/* Overall Data Leaks */}
        <div className="content-card">
          <h3 className="card-header">Data Leak Summary</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Data Leak – Number of Breaches</span>
              <span className={`value-count ${intelligence.darknet.data_leaks_count > 0 ? 'count-danger' : ''}`}>
                {intelligence.darknet.data_leaks_count || 0}
              </span>
            </div>
            <div className="data-row">
              <span className="label">Data Leak – First Seen Date</span>
              {renderValue(intelligence.darknet.data_leaks_first_seen)}
            </div>
            <div className="data-row">
              <span className="label">Data Leak – Last Seen Date</span>
              {renderValue(intelligence.darknet.data_leaks_last_seen)}
            </div>
          </div>
        </div>

        {/* Email Data Leaks */}
        <div className="content-card">
          <h3 className="card-header">Email Data Leaks</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Email - Data Leaks Count</span>
              <span className={`value-count ${intelligence.darknet.email_data_leaks_count > 0 ? 'count-danger' : ''}`}>
                {intelligence.darknet.email_data_leaks_count || 0}
              </span>
            </div>
            <div className="data-row">
              <span className="label">Email - Leaks First Seen</span>
              {renderValue(intelligence.darknet.email_data_leaks_first_seen)}
            </div>
            <div className="data-row">
              <span className="label">Email - Leaks Last Seen</span>
              {renderValue(intelligence.darknet.email_data_leaks_last_seen)}
            </div>
          </div>
        </div>

        {/* Phone Data Leaks */}
        <div className="content-card">
          <h3 className="card-header">Phone Data Leaks</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Phone No - Data Leaks Count</span>
              <span className={`value-count ${intelligence.darknet.phone_data_leaks_count > 0 ? 'count-danger' : ''}`}>
                {intelligence.darknet.phone_data_leaks_count || 0}
              </span>
            </div>
            <div className="data-row">
              <span className="label">Phone No - First Seen Data Leaks</span>
              {renderValue(intelligence.darknet.phone_data_leaks_first_seen)}
            </div>
            <div className="data-row">
              <span className="label">Phone No - Last Seen Data Leaks</span>
              {renderValue(intelligence.darknet.phone_data_leaks_last_seen)}
            </div>
          </div>
        </div>

        {/* Darknet Profile */}
        <div className="content-card">
          <h3 className="card-header">Darknet Profile Information</h3>
          <div className="card-rows">
            <div className="data-row">
              <span className="label">Darknet - Phone Numbers</span>
              {renderValue(intelligence.darknet.sl_data?.phones?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Emails</span>
              {renderValue(intelligence.darknet.sl_data?.emails?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Full Names</span>
              {renderValue(intelligence.darknet.sl_data?.full_names?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Aliases</span>
              {renderValue(intelligence.darknet.sl_data?.aliases?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Accounts</span>
              {renderValue(intelligence.darknet.sl_data?.accounts?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Addresses</span>
              {renderValue(intelligence.darknet.sl_data?.addresses?.length || 0, 'count')}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Gender</span>
              {renderValue(intelligence.darknet.sl_data?.genders)}
            </div>
            <div className="data-row">
              <span className="label">Darknet - Date of Birth</span>
              {renderValue(intelligence.darknet.sl_data?.birthdays)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  // ✅✅✅ ADD SOCIAL MEDIA FUNCTION HERE ✅✅✅
const renderSocialMedia = () => {
  console.log('🚀 [SOCIAL] === FULL DEBUG MODE ===');
  
  const slData = intelligence?.darknet?.sl_data || {};
  
  // Show EVERYTHING in sl_data
  console.log('🔍 [FULL sl_data]:', slData);
  
  // Check each key individually
  Object.keys(slData).forEach(key => {
    console.log(`📦 [sl_data.${key}]:`, slData[key]);
    console.log(`   Type: ${Array.isArray(slData[key]) ? 'Array' : typeof slData[key]}`);
    if (Array.isArray(slData[key])) {
      console.log(`   Length: ${slData[key].length}`);
      if (slData[key].length > 0) {
        console.log(`   First item:`, slData[key][0]);
      }
    }
  });
  
  // Maybe social media is in accounts but with different structure?
  const accounts = slData.accounts || [];
  console.log('🔍 accounts:', accounts);
  
  // Check if ANY array has data that looks like social media
  const possibleSocialArrays = ['accounts', 'aliases', 'full_names', 'phones', 'emails'];
  possibleSocialArrays.forEach(arrayName => {
    if (slData[arrayName] && Array.isArray(slData[arrayName]) && slData[arrayName].length > 0) {
      console.log(`✅ ${arrayName} has data:`, slData[arrayName]);
    }
  });
  
  return (
    <div className="content-section">
      <h2 className="content-title">🌐 Social Media Profiles - FULL DEBUG</h2>
      
      <div className="content-card">
        <h3 className="card-header">🐛 Raw Data Structure</h3>
        <div className="card-rows">
          {Object.keys(slData).map(key => (
            <div key={key} className="data-row">
              <span className="label">{key}</span>
              <span className="value-default">
                {Array.isArray(slData[key]) 
                  ? `Array[${slData[key].length}]: ${JSON.stringify(slData[key]).substring(0, 100)}...`
                  : typeof slData[key] === 'object'
                  ? JSON.stringify(slData[key]).substring(0, 100) + '...'
                  : String(slData[key])}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Show each array */}
      {Object.keys(slData).map(key => {
        if (!Array.isArray(slData[key]) || slData[key].length === 0) return null;
        
        return (
          <div key={key} className="content-card">
            <h3 className="card-header">
              📋 {key} ({slData[key].length} items)
            </h3>
            <div className="card-rows">
              {slData[key].slice(0, 3).map((item, idx) => (
                <div key={idx} className="data-row">
                  <span className="label">Item {idx + 1}</span>
                  <span className="value-default">
                    {typeof item === 'object' 
                      ? JSON.stringify(item)
                      : String(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};




  // ========================================
  // NEW: SDK DATA RENDER FUNCTION
  // ========================================
  const renderSDKData = () => {
    // Get SDK data from intelligence object
    const sdkData = intelligence.sdkData || customerData?.sdkData || [];

    // Find specific event types
    const deviceLocation = sdkData.find(e => e.type === 'DEVICE_LOCATION')?.payload;
    const distanceData = sdkData.find(e => e.type === 'BANK_DISTANCE')?.payload;
    const deviceId = sdkData.find(e => e.type === 'DEVICE_ID')?.payload;
    const otpAttempt = sdkData.find(e => e.type === 'OTP_ATTEMPT')?.payload;
    const displaySettings = sdkData.find(e => e.type === 'DISPLAY_SETTINGS')?.payload;
    const touchBiometrics = sdkData.find(e => e.type === 'TOUCH_BIOMETRICS')?.payload;
    const keypress = sdkData.find(e => e.type === 'KEYPRESS')?.payload;

    return (
      <div className="content-section">
        <h2 className="content-title">📲 SDK Data & Behavior Analytics</h2>
        
        <div className="content-grid">
          {/* Distance Analysis */}
          {distanceData && (
            <div className="content-card sdk-highlight">
              <h3 className="card-header">📍 Location & Distance Analysis</h3>
              <div className="card-rows">
                <div className="data-row">
                  <span className="label">User Location</span>
                  <span className="value-default">{distanceData.userLocation?.address || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Agent Location</span>
                  <span className="value-default">{distanceData.bankLocation?.address || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Distance (KM)</span>
                  <span className="value-count">{distanceData.distance?.km?.toFixed(2) || 'N/A'} km</span>
                </div>
                <div className="data-row">
                  <span className="label">Distance (Meters)</span>
                  <span className="value-count">{distanceData.distance?.meters || 'N/A'} m</span>
                </div>
                <div className="data-row">
                  <span className="label">Estimated Travel Time</span>
                  <span className="value-default">{distanceData.duration?.formatted || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Risk Level</span>
                  <span className={`badge ${
                    distanceData.riskAnalysis?.riskLevel === 'MINIMAL' ? 'badge-success' :
                    distanceData.riskAnalysis?.riskLevel === 'LOW' ? 'badge-success' :
                    distanceData.riskAnalysis?.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {distanceData.riskAnalysis?.riskLevel || 'N/A'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="label">Recommendation</span>
                  <span className="value-default">{distanceData.riskAnalysis?.recommendation || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Device Location */}
          {deviceLocation && (
            <div className="content-card">
              <h3 className="card-header">📍 Device GPS Location</h3>
              <div className="card-rows">
                <div className="data-row">
                  <span className="label">Latitude</span>
                  <span className="value-default">{deviceLocation.latitude || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Longitude</span>
                  <span className="value-default">{deviceLocation.longitude || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Accuracy (meters)</span>
                  <span className="value-count">{deviceLocation.accuracy || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Full Address</span>
                  <span className="value-default">{deviceLocation.address?.formattedAddress || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">City</span>
                  <span className="value-default">{deviceLocation.address?.city || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">State</span>
                  <span className="value-default">{deviceLocation.address?.state || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Pincode</span>
                  <span className="value-default">{deviceLocation.address?.pincode || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* OTP Attempt Analysis */}
          {otpAttempt && (
            <div className="content-card">
              <h3 className="card-header">🔐 OTP Verification Analysis</h3>
              <div className="card-rows">
                <div className="data-row">
                  <span className="label">Total Attempts</span>
                  <span className="value-count">{otpAttempt.verificationAttempts || 0}</span>
                </div>
                <div className="data-row">
                  <span className="label">Fraud Score</span>
                  {renderValue(otpAttempt.fraudScore?.score, 'score')}
                </div>
                <div className="data-row">
                  <span className="label">Risk Level</span>
                  <span className={`badge ${
                    otpAttempt.fraudScore?.level === 'LOW_RISK' ? 'badge-success' :
                    otpAttempt.fraudScore?.level === 'MEDIUM_RISK' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {otpAttempt.fraudScore?.level || 'N/A'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="label">Typing Pattern</span>
                  <span className="value-default">{otpAttempt.typingCadence?.cadenceType || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Paste Detected</span>
                  {renderBoolean(otpAttempt.pasteDetection?.pasteDetected)}
                </div>
                <div className="data-row">
                  <span className="label">Context Switches</span>
                  <span className="value-count">{otpAttempt.contextSwitching?.focusLosses || 0}</span>
                </div>
                <div className="data-row">
                  <span className="label">Backspace Count</span>
                  <span className="value-count">{otpAttempt.correctionBehavior?.totalBackspaces || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Device Fingerprint */}
          {deviceId && (
            <div className="content-card">
              <h3 className="card-header">🆔 Device Fingerprint</h3>
              <div className="card-rows">
                <div className="data-row">
                  <span className="label">Device ID</span>
                  <span className="value-default">{deviceId.deviceID || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Session ID</span>
                  <span className="value-default">{deviceId.sessionID || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Risk Score</span>
                  {renderValue(deviceId.riskScore, 'score')}
                </div>
                <div className="data-row">
                  <span className="label">Risk Level</span>
                  <span className={`badge ${
                    deviceId.riskLevel === 'LOW' ? 'badge-success' :
                    deviceId.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {deviceId.riskLevel || 'N/A'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="label">Device Category</span>
                  <span className="value-default">{deviceId.deviceCategory || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Platform Type</span>
                  <span className="value-default">{deviceId.platformType || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Fingerprint Stability</span>
                  <span className="value-count">{deviceId.fingerprintStability || 0}%</span>
                </div>
                <div className="data-row">
                  <span className="label">Session Count</span>
                  <span className="value-count">{deviceId.sessionCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {displaySettings && (
            <div className="content-card">
              <h3 className="card-header">🖥️ Display & Screen Info</h3>
              <div className="card-rows">
                <div className="data-row">
                  <span className="label">Screen Resolution</span>
                  <span className="value-default">{displaySettings.screenWidth} x {displaySettings.screenHeight}</span>
                </div>
                <div className="data-row">
                  <span className="label">Device Category</span>
                  <span className="value-default">{displaySettings.deviceCategory || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Orientation</span>
                  <span className="value-default">{displaySettings.orientationType || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Pixel Ratio</span>
                  <span className="value-default">{displaySettings.devicePixelRatio || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Screen Size (inches)</span>
                  <span className="value-default">{displaySettings.estimatedScreenSizeInches || 'N/A'}"</span>
                </div>
                <div className="data-row">
                  <span className="label">Touch Support</span>
                  {renderBoolean(displaySettings.touchSupport?.hasTouchScreen)}
                </div>
                <div className="data-row">
                  <span className="label">Fullscreen</span>
                  {renderBoolean(displaySettings.isFullscreen)}
                </div>
              </div>
            </div>
          )}

          {/* Behavior Analytics */}
          {(touchBiometrics || keypress) && (
            <div className="content-card">
              <h3 className="card-header">🖱️ User Behavior Patterns</h3>
              <div className="card-rows">
                {touchBiometrics && (
                  <>
                    <div className="data-row">
                      <span className="label">Total Taps</span>
                      <span className="value-count">{touchBiometrics.totalTaps || 0}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Total Swipes</span>
                      <span className="value-count">{touchBiometrics.totalSwipes || 0}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Bot Probability</span>
                      <span className="value-count">{touchBiometrics.botProbability || 0}%</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Human-like Behavior</span>
                      {renderBoolean(touchBiometrics.isHumanLike)}
                    </div>
                  </>
                )}
                {keypress && (
                  <>
                    <div className="data-row">
                      <span className="label">Total Keypresses</span>
                      <span className="value-count">{keypress.totalKeypresses || 0}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Backspace Count</span>
                      <span className="value-count">{keypress.backspaceCount || 0}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Numeric Keys</span>
                      <span className="value-count">{keypress.numericKeypressCount || 0}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Alphabetic Keys</span>
                      <span className="value-count">{keypress.alphabeticKeypressCount || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Raw SDK Events - Expandable JSON Viewer */}
          <div className="content-card sdk-json-card">
            <h3 className="card-header">📋 All SDK Events (JSON)</h3>
            <div className="sdk-json-container">
              <pre className="sdk-json">
                {JSON.stringify(sdkData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Overview Content
  const renderOverview = () => (
    <div className="content-section">
      <h2 className="content-title">📊 Risk Overview</h2>
      
      <div className="overview-grid">
        <div className="overview-card score-card">
          <h3>Overall Score</h3>
          <div className="score-circle-large">
            <svg className="score-ring" width="150" height="150">
              <circle className="score-ring-bg" cx="75" cy="75" r="65" />
              <circle 
                className="score-ring-fill" 
                cx="75" 
                cy="75" 
                r="65"
                style={{
                  strokeDasharray: `${(intelligence.overallScore / 1000) * 408} 408`
                }}
              />
            </svg>
            <div className="score-text">
              <div className="score-number">{intelligence.overallScore}</div>
              <div className="score-label">Trust Score</div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Score Breakdown</h3>
          <div className="score-list">
            <div className="score-item-overview">
              <span>Email Score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(intelligence.scoring?.email / 1000) * 100}%` }}></div>
              </div>
              <span className="score-value-overview">{intelligence.scoring?.email || 0}</span>
            </div>
            <div className="score-item-overview">
              <span>Phone Score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(intelligence.scoring?.phone / 1000) * 100}%` }}></div>
              </div>
              <span className="score-value-overview">{intelligence.scoring?.phone || 0}</span>
            </div>
            <div className="score-item-overview">
              <span>IP Score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(intelligence.scoring?.ip / 1000) * 100}%` }}></div>
              </div>
              <span className="score-value-overview">{intelligence.scoring?.ip || 0}</span>
            </div>
            <div className="score-item-overview">
              <span>Name Score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(intelligence.scoring?.name / 1000) * 100}%` }}></div>
              </div>
              <span className="score-value-overview">{intelligence.scoring?.name || 0}</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Risk Indicators</h3>
          <div className="risk-indicators">
            <div className={`risk-indicator ${intelligence.email.email_recent_abuse ? 'risk-high' : 'risk-safe'}`}>
              <span className="risk-icon">{intelligence.email.email_recent_abuse ? '⚠️' : '✅'}</span>
              <span>Email Abuse</span>
            </div>
            <div className={`risk-indicator ${intelligence.phone.phone_risky ? 'risk-high' : 'risk-safe'}`}>
              <span className="risk-icon">{intelligence.phone.phone_risky ? '⚠️' : '✅'}</span>
              <span>Phone Risk</span>
            </div>
            <div className={`risk-indicator ${intelligence.ip.ip_vpn || intelligence.ip.ip_proxy ? 'risk-medium' : 'risk-safe'}`}>
              <span className="risk-icon">{intelligence.ip.ip_vpn || intelligence.ip.ip_proxy ? '⚠️' : '✅'}</span>
              <span>VPN/Proxy</span>
            </div>
            <div className={`risk-indicator ${intelligence.darknet.data_leaks_count > 0 ? 'risk-high' : 'risk-safe'}`}>
              <span className="risk-icon">{intelligence.darknet.data_leaks_count > 0 ? '⚠️' : '✅'}</span>
              <span>Data Leaks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="intelligence-dashboard-wrapper">
      {/* Fixed Top Header - Customer Profile */}
      <div className="dashboard-top-section">
        <div className="profile-header">
          <div className="profile-avatar">
            {customerData?.customerName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{customerData?.customerName || 'Customer Name'}</h1>
            <div className="profile-contact">
              <span className="contact-item">
                <span className="contact-icon">📧</span>
                {customerData?.email || 'N/A'}
              </span>
              <span className="contact-item">
                <span className="contact-icon">📱</span>
                {customerData?.phone_Number || customerData?.phone ||'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main-content">
        {/* Left Sidebar Navigation */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h3>Intelligence Categories</h3>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.count && <span className="nav-count">{item.count}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
