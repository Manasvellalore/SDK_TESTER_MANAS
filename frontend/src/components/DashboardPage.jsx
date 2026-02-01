import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import IntelligenceDashboard from './IntelligenceDashboard';

const DashboardPage = () => {
  const { sessionId } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [sessionId]);

  const fetchDashboardData = async () => {
    try {
      console.log(`📊 Fetching dashboard for session: ${sessionId}`);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/dashboard-data/${sessionId}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No data found</div>;
  }

  return (
    <IntelligenceDashboard
      customerData={dashboardData.customerData}
      intelligence={dashboardData.intelligence}
      sessionInfo={dashboardData.sessionInfo}
    />
  );
};

export default DashboardPage;
