// result.js

function colorJSON(json) {
    let jsonStr = JSON.stringify(json, null, 2);
    jsonStr = jsonStr.replace(/\btrue\b/g, '<span class="json-true">true</span>');
    jsonStr = jsonStr.replace(/\bfalse\b/g, '<span class="json-false">false</span>');
    return jsonStr;
}


document.addEventListener('DOMContentLoaded', function() {
    const contentDiv = document.getElementById('content');
    
    // Get data from localStorage
    const storedData = localStorage.getItem('submissionData');
    
    if (!storedData) {
        // No data found, show error and redirect
        contentDiv.innerHTML = `
            <div class="no-data">
                <h2>❌ No Submission Data Found</h2>
                <p>Please submit the form first.</p>
                <button class="btn-primary" onclick="window.location.href='index.html'">
                    Go to Form
                </button>
            </div>
        `;
        return;
    }
    
    // Parse the data
    const data = JSON.parse(storedData);
    
    // Count SDK events
    const sdkEventCount = data.sdkData ? data.sdkData.length : 0;
    
    // Generate SDK events display (same format as form page)
    let sdkEventsHTML = '';
    
    if (sdkEventCount > 0) {
        data.sdkData.forEach((event, index) => {
            const eventNumber = index + 1;
            const eventType = event.type || 'UNKNOWN';
            
            sdkEventsHTML += `
    <div class="event-item">
        <div class="event-type">Event #${eventNumber} - ${eventType}</div>
        <pre>${colorJSON(event)}</pre>
    </div>
`;
        });
    } else {
        sdkEventsHTML = '<p style="color: #999; text-align: center; padding: 20px;">No SDK events captured</p>';
    }
    
    // Build the HTML
    contentDiv.innerHTML = `
        <h1>
            Submission Results
            <span class="success-badge">✓ Success</span>
        </h1>
        <p class="timestamp">Submitted at: ${new Date(data.timestamp).toLocaleString('en-IN')}</p>
        
        <!-- Form Data Section -->
        <div class="section">
            <h2 class="section-title">
                📋 Form Data
            </h2>
            <pre>${colorJSON(data.formData)}</pre>
        </div>
        
        <!-- SDK Data Section -->
        <div class="section">
            <h2 class="section-title">
                🔍 SDK Signals
                <span class="badge">${sdkEventCount} events</span>
            </h2>
            <div class="sdk-events-container">
                ${sdkEventsHTML}
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="btn-group">
            <button class="btn-primary" onclick="window.location.href='index.html'">
                Submit Another Form
            </button>
            <button class="btn-secondary" onclick="downloadJSON()">
                Download JSON
            </button>
        </div>
    `;
});

// Function to download JSON
function downloadJSON() {
    const storedData = localStorage.getItem('submissionData');
    if (!storedData) return;
    
    const blob = new Blob([storedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
