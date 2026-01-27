import React, { useState } from 'react';
import '../styles/AgentDashboard.css';

function AgentDashboard({ userData }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Dummy data - will be replaced with real SDK data
  const dashboardData = {
    profile: {
      name: userData?.name || 'John Doe',
      email: userData?.email || 'john.doe@example.com',
      phone: userData?.phone || '+91 9876543210',
      profilePicture: null,
    },
    quickStats: {
      accounts: 7,
      names: 3,
      emails: 1,
      phoneNumbers: 1,
      locations: 4,
      aliases: 1,
    },
    generalInfo: {
      phoneMatched: 'full_match',
      emailMatched: 'full_match',
      googleNameValid: 'N/A',
      hasProfilePicture: true,
      firstSeen: '2 years ago',
      lastSeen: '1 day ago',
      connectedAccounts: 6,
      dataLeaks: 1,
    },
    profileDetails: {
      birthday: 'N/A',
      age: 'N/A',
      gender: 'N/A',
      education: 'N/A',
      position: 'N/A',
      company: 'N/A',
      employed: 'N/A',
      lastJobExperience: 'N/A',
      totalJobExperience: 'N/A',
    },
    scores: {
      overall: 850,
      name: 0,
      phone: 850,
      email: 870,
      ip: 850,
      riskLevel: 'High',
    },
    emailIntelligence: {
      threats: {
        emailValid: true,
        deliverability: 'low',
        disposable: false,
        recentFraud: false,
        spamTrapScore: 'none',
        frequentComplainer: false,
        suspect: false,
      },
      domainAnalysis: {
        domainAge: '30 years',
        domainVelocity: 'high',
        domainTrust: 'trusted',
        smtpScore: 2,
        riskyTLD: false,
        spfPolicy: 'true',
        dmarcPolicy: true,
        mxRecords: true,
      },
      formatAnalysis: {
        formatBad: false,
        hasOnlyOneDigit: false,
        hasStopWords: false,
        nameRiskType: 'N/A',
        accountVowelsCount: 5,
        accountConsonantsCount: 8,
        accountLength: 16,
        accountDigitCount: 3,
      },
    },
    phoneIntelligence: {
      valid: true,
      carrier: 'Airtel',
      lineType: 'Mobile',
      country: 'India',
      riskScore: 850,
      recentActivity: 'Active',
      fraud: false,
    },
    ipIntelligence: {
      address: userData?.ip || '103.45.67.89',
      country: 'India',
      city: 'Mumbai',
      isp: 'Reliance Jio',
      vpn: false,
      proxy: false,
      tor: false,
      threatLevel: 'Low',
      riskScore: 850,
    },
    sdkData: {
      // Full SDK JSON will be here
      deviceId: 'abc123xyz',
      browser: 'Chrome',
      os: 'Windows 10',
      screenResolution: '1920x1080',
      timezone: 'Asia/Kolkata',
      language: 'en-US',
      // ... more SDK fields
    },
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={dashboardData} />;
      case 'email':
        return <EmailTab data={dashboardData.emailIntelligence} />;
      case 'phone':
        return <PhoneTab data={dashboardData.phoneIntelligence} />;
      case 'ip':
        return <IPTab data={dashboardData.ipIntelligence} />;
      case 'sdk':
        return <SDKTab data={dashboardData.sdkData} />;
      default:
        return <OverviewTab data={dashboardData} />;
    }
  };

  return (
    <div className="agent-dashboard">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">B</div>
        </div>
        
        <div className="sidebar-menu">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
            title="Overview"
          >
            <i className="icon-overview">📊</i>
          </button>
          <button 
            className={activeTab === 'email' ? 'active' : ''} 
            onClick={() => setActiveTab('email')}
            title="Email Intelligence"
          >
            <i className="icon-email">📧</i>
          </button>
          <button 
            className={activeTab === 'phone' ? 'active' : ''} 
            onClick={() => setActiveTab('phone')}
            title="Phone Intelligence"
          >
            <i className="icon-phone">📱</i>
          </button>
          <button 
            className={activeTab === 'ip' ? 'active' : ''} 
            onClick={() => setActiveTab('ip')}
            title="IP Intelligence"
          >
            <i className="icon-ip">🌐</i>
          </button>
          <button 
            className={activeTab === 'sdk' ? 'active' : ''} 
            onClick={() => setActiveTab('sdk')}
            title="SDK Data"
          >
            <i className="icon-sdk">📋</i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Agent Intelligence Dashboard</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }) {
  return (
    <div className="overview-tab">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {data.profile.profilePicture ? (
            <img src={data.profile.profilePicture} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {data.profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>{data.profile.name}</h2>
          <div className="profile-details">
            <span className="detail-item">
              <i>📧</i> {data.profile.email}
            </span>
            <span className="detail-item">
              <i>📱</i> {data.profile.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <i>👤</i>
          <div>
            <span className="stat-label">Accounts</span>
            <span className="stat-value">{data.quickStats.accounts}</span>
          </div>
        </div>
        <div className="stat-card">
          <i>📝</i>
          <div>
            <span className="stat-label">Names</span>
            <span className="stat-value">{data.quickStats.names}</span>
          </div>
        </div>
        <div className="stat-card">
          <i>✉️</i>
          <div>
            <span className="stat-label">Emails</span>
            <span className="stat-value">{data.quickStats.emails}</span>
          </div>
        </div>
        <div className="stat-card">
          <i>📞</i>
          <div>
            <span className="stat-label">Phone Numbers</span>
            <span className="stat-value">{data.quickStats.phoneNumbers}</span>
          </div>
        </div>
        <div className="stat-card">
          <i>📍</i>
          <div>
            <span className="stat-label">Locations</span>
            <span className="stat-value">{data.quickStats.locations}</span>
          </div>
        </div>
        <div className="stat-card">
          <i>🔖</i>
          <div>
            <span className="stat-label">Aliases</span>
            <span className="stat-value">{data.quickStats.aliases}</span>
          </div>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="cards-grid">
        {/* General Information Card */}
        <div className="info-card">
          <h3>General Information</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Phone matched</span>
              <span className="value-highlight">{data.generalInfo.phoneMatched}</span>
            </div>
            <div className="info-item">
              <span>Email matched</span>
              <span className="value-highlight">{data.generalInfo.emailMatched}</span>
            </div>
            <div className="info-item">
              <span>Google name valid</span>
              <span>{data.generalInfo.googleNameValid}</span>
            </div>
            <div className="info-item">
              <span>Has profile picture</span>
              <span className={data.generalInfo.hasProfilePicture ? 'status-good' : 'status-bad'}>
                {data.generalInfo.hasProfilePicture ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>First seen</span>
              <span>{data.generalInfo.firstSeen}</span>
            </div>
            <div className="info-item">
              <span>Last seen</span>
              <span>{data.generalInfo.lastSeen}</span>
            </div>
            <div className="info-item">
              <span>Connected accounts</span>
              <span>{data.generalInfo.connectedAccounts}</span>
            </div>
            <div className="info-item">
              <span>Data leaks</span>
              <span className="status-warning">{data.generalInfo.dataLeaks}</span>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="info-card">
          <h3>Profile</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Birthday</span>
              <span>{data.profileDetails.birthday}</span>
            </div>
            <div className="info-item">
              <span>Age</span>
              <span>{data.profileDetails.age}</span>
            </div>
            <div className="info-item">
              <span>Gender</span>
              <span>{data.profileDetails.gender}</span>
            </div>
            <div className="info-item">
              <span>Education</span>
              <span>{data.profileDetails.education}</span>
            </div>
            <div className="info-item">
              <span>Position</span>
              <span>{data.profileDetails.position}</span>
            </div>
            <div className="info-item">
              <span>Company</span>
              <span>{data.profileDetails.company}</span>
            </div>
            <div className="info-item">
              <span>Employed</span>
              <span>{data.profileDetails.employed}</span>
            </div>
            <div className="info-item">
              <span>Last job experience</span>
              <span>{data.profileDetails.lastJobExperience}</span>
            </div>
            <div className="info-item">
              <span>Total job experience</span>
              <span>{data.profileDetails.totalJobExperience}</span>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="score-card">
          <h3>Overall Score</h3>
          <div className="score-circle">
            <svg viewBox="0 0 200 200">
  <defs>
    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#667eea" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" className="score-bg" />
  <circle 
    cx="100" 
    cy="100" 
    r="90" 
    className="score-progress"
    style={{
      strokeDasharray: `${(data.scores.overall / 1000) * 565} 565`
    }}
  />
</svg>

            <div className="score-value">
              <span className="score-number">{data.scores.overall}</span>
              <span className={`score-label ${data.scores.riskLevel.toLowerCase()}`}>
                {data.scores.riskLevel}
              </span>
            </div>
          </div>
          <div className="score-breakdown">
            <div className="score-item">
              <span>Name score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(data.scores.name / 1000) * 100}%` }}></div>
              </div>
              <span>{data.scores.name || 'N/A'}</span>
            </div>
            <div className="score-item">
              <span>Phone score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(data.scores.phone / 1000) * 100}%` }}></div>
              </div>
              <span>{data.scores.phone}</span>
            </div>
            <div className="score-item">
              <span>Email score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(data.scores.email / 1000) * 100}%` }}></div>
              </div>
              <span>{data.scores.email}</span>
            </div>
            <div className="score-item">
              <span>IP score</span>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${(data.scores.ip / 1000) * 100}%` }}></div>
              </div>
              <span>{data.scores.ip}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Email Tab Component
function EmailTab({ data }) {
  return (
    <div className="intelligence-tab">
      <h2>Email Intelligence</h2>
      
      <div className="cards-grid">
        <div className="info-card">
          <h3>Email Threats</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Email valid</span>
              <span className={data.threats.emailValid ? 'status-good' : 'status-bad'}>
                {data.threats.emailValid ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Deliverability</span>
              <span className="value-highlight">{data.threats.deliverability}</span>
            </div>
            <div className="info-item">
              <span>Disposable</span>
              <span className={!data.threats.disposable ? 'status-good' : 'status-bad'}>
                {!data.threats.disposable ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Recent fraud</span>
              <span className={!data.threats.recentFraud ? 'status-good' : 'status-bad'}>
                {!data.threats.recentFraud ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Spam trap score</span>
              <span>{data.threats.spamTrapScore}</span>
            </div>
            <div className="info-item">
              <span>Frequent complainer</span>
              <span className={!data.threats.frequentComplainer ? 'status-good' : 'status-bad'}>
                {!data.threats.frequentComplainer ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Suspect</span>
              <span className={!data.threats.suspect ? 'status-good' : 'status-bad'}>
                {!data.threats.suspect ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Domain Analysis</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Domain age</span>
              <span>{data.domainAnalysis.domainAge}</span>
            </div>
            <div className="info-item">
              <span>Domain velocity</span>
              <span className="value-highlight">{data.domainAnalysis.domainVelocity}</span>
            </div>
            <div className="info-item">
              <span>Domain trust</span>
              <span className="status-good">{data.domainAnalysis.domainTrust}</span>
            </div>
            <div className="info-item">
              <span>SMTP score</span>
              <span>{data.domainAnalysis.smtpScore}</span>
            </div>
            <div className="info-item">
              <span>Risky TLD</span>
              <span className={!data.domainAnalysis.riskyTLD ? 'status-good' : 'status-bad'}>
                {!data.domainAnalysis.riskyTLD ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>SPF policy</span>
              <span className="status-good">{data.domainAnalysis.spfPolicy}</span>
            </div>
            <div className="info-item">
              <span>DMARC policy</span>
              <span className={data.domainAnalysis.dmarcPolicy ? 'status-good' : 'status-bad'}>
                {data.domainAnalysis.dmarcPolicy ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>MX records</span>
              <span className={data.domainAnalysis.mxRecords ? 'status-good' : 'status-bad'}>
                {data.domainAnalysis.mxRecords ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Email Format Analysis</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Format is bad</span>
              <span className={!data.formatAnalysis.formatBad ? 'status-good' : 'status-bad'}>
                {!data.formatAnalysis.formatBad ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Has only one digit</span>
              <span className={!data.formatAnalysis.hasOnlyOneDigit ? 'status-good' : 'status-bad'}>
                {!data.formatAnalysis.hasOnlyOneDigit ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Has stop words</span>
              <span className={!data.formatAnalysis.hasStopWords ? 'status-good' : 'status-bad'}>
                {!data.formatAnalysis.hasStopWords ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Name risk type</span>
              <span>{data.formatAnalysis.nameRiskType}</span>
            </div>
            <div className="info-item">
              <span>Account vowels count</span>
              <span>{data.formatAnalysis.accountVowelsCount}</span>
            </div>
            <div className="info-item">
              <span>Account consonants count</span>
              <span>{data.formatAnalysis.accountConsonantsCount}</span>
            </div>
            <div className="info-item">
              <span>Account length</span>
              <span>{data.formatAnalysis.accountLength}</span>
            </div>
            <div className="info-item">
              <span>Account digit count</span>
              <span>{data.formatAnalysis.accountDigitCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Phone Tab Component
function PhoneTab({ data }) {
  return (
    <div className="intelligence-tab">
      <h2>Phone Intelligence</h2>
      
      <div className="cards-grid">
        <div className="info-card">
          <h3>Phone Analysis</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Valid</span>
              <span className={data.valid ? 'status-good' : 'status-bad'}>
                {data.valid ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Carrier</span>
              <span className="value-highlight">{data.carrier}</span>
            </div>
            <div className="info-item">
              <span>Line type</span>
              <span>{data.lineType}</span>
            </div>
            <div className="info-item">
              <span>Country</span>
              <span>{data.country}</span>
            </div>
            <div className="info-item">
              <span>Risk score</span>
              <span className="status-good">{data.riskScore}</span>
            </div>
            <div className="info-item">
              <span>Recent activity</span>
              <span>{data.recentActivity}</span>
            </div>
            <div className="info-item">
              <span>Fraud</span>
              <span className={!data.fraud ? 'status-good' : 'status-bad'}>
                {!data.fraud ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// IP Tab Component
function IPTab({ data }) {
  return (
    <div className="intelligence-tab">
      <h2>IP Intelligence</h2>
      
      <div className="cards-grid">
        <div className="info-card">
          <h3>IP Threats</h3>
          <div className="info-list">
            <div className="info-item">
              <span>IP Address</span>
              <span className="value-highlight">{data.address}</span>
            </div>
            <div className="info-item">
              <span>Country</span>
              <span>{data.country}</span>
            </div>
            <div className="info-item">
              <span>City</span>
              <span>{data.city}</span>
            </div>
            <div className="info-item">
              <span>ISP</span>
              <span>{data.isp}</span>
            </div>
            <div className="info-item">
              <span>VPN</span>
              <span className={!data.vpn ? 'status-good' : 'status-warning'}>
                {!data.vpn ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Proxy</span>
              <span className={!data.proxy ? 'status-good' : 'status-warning'}>
                {!data.proxy ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>TOR</span>
              <span className={!data.tor ? 'status-good' : 'status-bad'}>
                {!data.tor ? '✓' : '✗'}
              </span>
            </div>
            <div className="info-item">
              <span>Threat level</span>
              <span className="status-good">{data.threatLevel}</span>
            </div>
            <div className="info-item">
              <span>Risk score</span>
              <span className="status-good">{data.riskScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SDK Tab Component
function SDKTab({ data }) {
  return (
    <div className="intelligence-tab">
      <h2>SDK Data</h2>
      
      <div className="sdk-json-viewer">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

export default AgentDashboard;
