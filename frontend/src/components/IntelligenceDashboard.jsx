import React, { useState } from 'react';
import '../styles/IntelligenceDashboard.css';

const IntelligenceDashboard = ({ intelligence, customerData }) => {
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
    { id: 'overview', icon: '📊', label: 'Risk Overview', count: null }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'email':
        return renderEmailIntelligence();
      case 'phone':
        return renderPhoneIntelligence();
      case 'ip':
        return renderIPIntelligence();
      case 'darknet':
        return renderDarknetIntelligence();
      case 'overview':
        return renderOverview();
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
              {renderValue(intelligence.ip.ip_hostname)}
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

  // Overview Content
  const renderOverview = () => (
    <div className="content-section">
      <h2 className="content-title">📊 Risk Overview</h2>
      
      <div className="overview-grid">
        <div className="overview-card score-card">
          <h3>Overall Score</h3>
          <div className="score-circle-large">
            <svg className="score-ring" width="160" height="160">
              <circle className="score-ring-bg" cx="80" cy="80" r="70" />
              <circle 
                className="score-ring-fill" 
                cx="80" 
                cy="80" 
                r="70"
                style={{
                  strokeDasharray: `${(intelligence.overallScore / 1000) * 440} 440`
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
                {customerData?.phoneNumber || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.accounts}</div>
            <div className="stat-label">Accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.names}</div>
            <div className="stat-label">Names</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-value">{stats.emails}</div>
            <div className="stat-label">Emails</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-value">{stats.phoneNumbers}</div>
            <div className="stat-label">Phone Numbers</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-value">{stats.locations}</div>
            <div className="stat-label">Locations</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎭</div>
            <div className="stat-value">{stats.aliases}</div>
            <div className="stat-label">Aliases</div>
          </div>
        </div>
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
