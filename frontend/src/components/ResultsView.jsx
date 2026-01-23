import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Results.css';
import MapView from './MapView';


function Results() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const storedEvents = sessionStorage.getItem('bargadEvents');
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents);
      setEvents(parsedEvents);
      console.log(`📊 Loaded ${parsedEvents.length} events`);
    }
  }, []);

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert('✅ JSON copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bargad-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackToForm = () => {
    navigate('/');
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="header-content">
          <h1>📊 SDK Captured Events</h1>
          <p className="event-count-badge">Total Events: {events.length}</p>
        </div>
      </header>

      <div className="results-container">
        <div className="button-group">
          <button className="btn-copy" onClick={handleCopyJSON}>
            📋 COPY JSON
          </button>
          <button className="btn-download" onClick={handleDownloadJSON}>
            💾 DOWNLOAD JSON
          </button>
          <button className="btn-back" onClick={handleBackToForm}>
            ← BACK TO FORM
          </button>
        </div>

     <div className="events-display">
  {/* Map Visualization */}
  {(() => {
    const bankDistanceEvent = events.find(e => e.type === 'BANK_DISTANCE');
    if (bankDistanceEvent) {
      return <MapView bankDistanceEvent={bankDistanceEvent} />;
    }
    return null;
  })()}

  {/* Event Cards */}
  {events.length === 0 ? (
    <div className="empty-state">
      <p>No events captured</p>
    </div>
  ) : (
    events.map((event, index) => (
      <div key={index} className="event-card">
        <div className="event-header">
          <span className="event-number">#{index + 1}</span>
          <span className="event-type">{event.type}</span>
        </div>
        <pre className="event-json">
          {JSON.stringify(event, null, 2)}
        </pre>
      </div>
    ))
  )}
</div>

      </div>
    </div>
  );
}

export default Results;
