# Frontend Dashboard: Anshin Otasuke Agent

## 1. SPA Architecture
The Caregiver Command Center is a Single Page Application (SPA) structured around a static layout located inside the `static` directory:
*   [index.html](file:///Users/satyamvatsa/.gemini/antigravity-ide/scratch/anshin-otasuke-agent/static/index.html) - Structural framework, linking stylesheets, scripts, fonts, and external mapping resources.
*   [style.css](file:///Users/satyamvatsa/.gemini/antigravity-ide/scratch/anshin-otasuke-agent/static/style.css) - Premium visual rules, layout, CSS grid configurations, and animations.
*   [app.js](file:///Users/satyamvatsa/.gemini/antigravity-ide/scratch/anshin-otasuke-agent/static/app.js) - Real-time state polling, UI updates, mapping triggers, and Leaflet.js polyline operations.

---

## 2. Visual Design & CSS Tokens
The user interface is designed to deliver a modern, premium experience using custom design tokens:
*   **Theme:** Deep dark-mode.
*   **Aesthetic Panels:** Glassmorphic panel cards configured with translucent background blur (`backdrop-filter: blur(12px)`), dark gradients, and thin subtle borders (`rgba(255, 255, 255, 0.08)`).
*   **Status Elements:** Integrated pulsing badges (`@keyframes pulse`) indicating active target monitoring.

---

## 3. Interactive Leaflet.js Map
*   **Initialization:** Loads OpenStreetMap tile layer centered on Shibuya, Tokyo coordinates.
*   **Custom Marker Overlays:** Features separate home/senior and emergency shelter icons.
*   **Emergency Polyline Rendering:**
    *   Once emergency status is active, the app automatically draws a polyline connecting the target's coordinates to the safe shelter.
    *   The route line uses a distinct, dashed flashing red style (`color: '#ff4757'`, `dashArray: '10, 10'`).
    *   **Auto-zoom Scaling:** Executes `map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })` to auto-adjust map levels to fit the generated escape route.

---

## 4. Components & Interactive States

### System Activity Terminal Logs
*   Simulates a console screen displaying timestamped event logs parsed from the backend state.
*   Log categories are color-coded: green for success, yellow for warnings, red for emergency danger alerts.
*   Auto-scroll logic forces the terminal interface to focus on the latest entries.

### Document Cards
*   Displays extracted metadata (Issuer, Deadline, and Amount) parsed from administrative documents.
*   Renders a lightbulb tip box showing Gemini's simplified translation.
*   Features active integration anchors for pre-filled Google Calendar additions and Drive archives.

### Emergency warning Modal Overlay
*   Triggers when `emergency_mode` and `show_overlay` evaluate to true.
*   Displays a high-priority, fullscreen dark overlay container containing a flashing caution icon (`@keyframes flashRed`), warning description, safe shelter information, and an acknowledgment dismiss button.

---

## 5. State Synchronization
*   The dashboard relies on a continuous background polling loop executed every 2000 milliseconds via:
    ```javascript
    setInterval(pollStatus, 2000);
    ```
*   This polling mechanism ensures the caregiver dashboard updates instantly when events are sent to the LINE Bot or when the demo simulator triggers new events, keeping safety status details and emergency alerts synchronized.
