// Initialize Map
const SHIBUYA_COORDS = [35.6585, 139.7013]; // Google Japan Shibuya area
let map = L.map('map').setView(SHIBUYA_COORDS, 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Custom Icons
const homeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
});

const shelterIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4315/4315445.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// Main Marker (User)
let userMarker = L.marker(SHIBUYA_COORDS).addTo(map)
    .bindPopup('<b>Hana Yamada (84)</b><br>Location: Jinnan 1-chome, Shibuya')
    .openPopup();

let shelterMarker = null;
let routeLine = null;
let lastLogIndex = 0;

// Log elements
const logOutput = document.getElementById('log-output');

function addLog(text, type = 'info') {
    const logLine = document.createElement('div');
    logLine.classList.add('log-line');
    if (type === 'success') logLine.classList.add('log-success');
    if (type === 'danger') logLine.classList.add('log-danger');
    if (type === 'warning') logLine.classList.add('log-warning');
    
    logLine.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    logOutput.appendChild(logLine);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// UI Triggers & Simulation APIs
document.getElementById('btn-sim-invoice').addEventListener('click', () => triggerSimulation('invoice'));
document.getElementById('btn-sim-siren').addEventListener('click', () => triggerSimulation('siren'));
document.getElementById('btn-sim-eew').addEventListener('click', () => triggerSimulation('eew'));
document.getElementById('btn-sim-reset').addEventListener('click', () => triggerSimulation('reset'));
document.getElementById('btn-close-emergency').addEventListener('click', () => {
    document.getElementById('emergency-overlay').style.display = 'none';
});

async function triggerSimulation(eventType) {
    try {
        addLog(`Simulator: Sending event "${eventType}"...`, 'info');
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: eventType })
        });
        const result = await response.json();
        addLog(`Response: ${result.message}`, 'success');
        pollStatus(); // Immediate poll update
    } catch (err) {
        addLog(`Simulation error: ${err.message}`, 'danger');
    }
}

// Poll Server Status
async function pollStatus() {
    try {
        const response = await fetch('/api/status');
        const state = await response.json();
        
        // Handle Logs
        if (state.logs && state.logs.length > lastLogIndex) {
            for (let i = lastLogIndex; i < state.logs.length; i++) {
                const log = state.logs[i];
                addLog(log.text, log.type);
            }
            lastLogIndex = state.logs.length;
        }

        // Handle Document Details
        const docPanel = document.getElementById('doc-details');
        if (state.document_data) {
            const doc = state.document_data;
            const isPaid = doc.status === 'paid';
            docPanel.innerHTML = `
                <div class="doc-card" style="${isPaid ? 'border-color: #2ed573; opacity: 0.85;' : ''}">
                    <div class="doc-card-title">
                        <h4>${doc.title}</h4>
                        <span class="doc-type-badge">${doc.type}</span>
                    </div>
                    ${isPaid ? `
                    <div style="background: #e3faf2; color: #2ed573; padding: 8px 12px; border-radius: 8px; font-weight: bold; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                        <i class="fa-solid fa-circle-check"></i> Paid via PayPay
                    </div>
                    ` : ''}
                    <div class="doc-field">
                        <span>Issuer:</span>
                        <span>${doc.issuer}</span>
                    </div>
                    <div class="doc-field">
                        <span>Deadline:</span>
                        <span>${doc.deadline || 'None'}</span>
                    </div>
                    <div class="doc-field">
                        <span>Amount:</span>
                        <span>¥${doc.amount ? doc.amount.toLocaleString() : 'None'}</span>
                    </div>
                    <div class="doc-alert-box" style="margin-bottom: 12px;">
                        <i class="fa-solid fa-lightbulb"></i> <strong>Agent Explanation:</strong><br>
                        ${doc.summary}
                    </div>
                    ${!isPaid ? `
                    <div class="doc-field" style="margin-top: 15px; display: flex; gap: 10px;">
                        <a href="${doc.google_calendar_link}" target="_blank" class="sim-btn" style="padding: 10px 14px; font-size: 0.8rem; background: var(--primary); text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fa-solid fa-calendar-plus"></i> Add to Calendar
                        </a>
                        <a href="https://drive.google.com" target="_blank" class="sim-btn sim-btn-secondary" style="padding: 10px 14px; font-size: 0.8rem; text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 0;">
                            <i class="fa-brands fa-google-drive"></i> Archive to Drive
                        </a>
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            docPanel.innerHTML = `
                <div class="no-doc-placeholder">
                    <i class="fa-solid fa-receipt placeholder-icon"></i>
                    <p>No documents analyzed yet.</p>
                </div>
            `;
        }

        // Handle Emergency Evacuation Mode
        const routePanel = document.getElementById('route-directions');
        if (state.emergency_mode) {
            // Display Warning Overlay if not dismissed
            if (state.show_overlay) {
                document.getElementById('emergency-overlay').style.display = 'flex';
            }
            
            // Render Route on Map if not already rendered
            if (!routeLine && state.route_coordinates) {
                const start = state.route_coordinates[0];
                const end = state.route_coordinates[state.route_coordinates.length - 1];
                
                // Reposition User Marker to emergency position
                userMarker.setLatLng(start).bindPopup('<b>Hana Emergency SOS</b>').openPopup();
                
                // Add Shelter Marker
                shelterMarker = L.marker(end).addTo(map)
                    .bindPopup('<b>Shelter: Shibuya Jinnan Elementary School</b>')
                    .openPopup();
                
                // Draw Route Polyline (blinking red/blue style)
                routeLine = L.polyline(state.route_coordinates, {
                    color: '#ff4757',
                    weight: 6,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map);
                
                // Zoom map to fit route
                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
            }

            // Fill Route steps
            if (state.route_steps) {
                const start = state.route_coordinates[0];
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=Shibuya+Jinnan+Elementary+School&travelmode=walking`;
                
                routePanel.innerHTML = `
                    <h4 style="color: var(--danger); margin-bottom: 8px;"><i class="fa-solid fa-person-running"></i> Recommended Route:</h4>
                    ${state.route_steps.map((step, idx) => `
                        <div class="route-step">
                            <strong>${idx + 1}.</strong> ${step}
                        </div>
                    `).join('')}
                    <div style="margin-top: 15px;">
                        <a href="${mapsUrl}" target="_blank" class="sim-btn sim-btn-danger" style="padding: 10px 14px; font-size: 0.8rem; text-decoration: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps Navigation
                        </a>
                    </div>
                `;
            }
        } else {
            // Reset Emergency elements
            document.getElementById('emergency-overlay').style.display = 'none';
            if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
            }
            if (shelterMarker) {
                map.removeLayer(shelterMarker);
                shelterMarker = null;
            }
            userMarker.setLatLng(SHIBUYA_COORDS).bindPopup('<b>Hana Yamada (84)</b>').openPopup();
            map.setView(SHIBUYA_COORDS, 16);
            
            routePanel.innerHTML = `
                <p class="placeholder-text"><i class="fa-solid fa-info-circle"></i> Normally displays target's current location. Evacuation route will be generated here during emergencies.</p>
            `;
        }

    } catch (err) {
        console.error('Polling error:', err);
    }
}

// Start polling
setInterval(pollStatus, 2000);
pollStatus(); // initial load
