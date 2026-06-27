# AI & Agents Documentation: Anshin Otasuke Agent

## 1. Overview
The agent layer in [agents.py](file:///Users/satyamvatsa/.gemini/antigravity-ide/scratch/anshin-otasuke-agent/agents.py) orchestrates multi-modal AI agents using the Google Gemini SDK. These agents parse low-quality document photos and noisy environmental audio to produce clean, structured, and empathetic English data for seniors and caregivers.

---

## 2. Model Fallback Chain
Due to potential variations in API keys and deprecated models, the codebase implements a resilient model-fallback loop. When `generate_multimodal_content` is triggered, it attempts to load models in the following sequence:

1.  **`gemini-3.5-flash`** (Latest, primary multimodal reasoning engine)
2.  **`gemini-2.5-flash`** (High-speed, cost-effective multimodal fallback)
3.  **`gemini-flash-latest`** (Stable production aliased endpoint)

If all model trials throw an exception (e.g. rate-limiting, permissions, or API mismatch), the error is propagated to the handler, triggering fallback user-friendly logs on the UI.

---

## 3. Document Analysis Agent (`analyze_document`)
This agent handles OCR and simplification of arbitrary paper documents photographed by the senior.

### Prompt Construction
```text
Analyze the document image and return a JSON object in English with the following structure.
Always return ONLY a valid JSON object. Do not wrap it in markdown codes block like ```json or ```.

JSON Keys:
- title: The title of the document (e.g., Senior Medical Insurance Notice, Health Checkup Notice, Tax Payment Demand)
- type: The category (e.g., Tax, Insurance, Health, Administrative, Other)
- issuer: The issuing authority (e.g., Shibuya Ward Office, Ministry of Health)
- deadline: Due date for payment or registration (e.g., July 31, 2026) or null if none
- amount: Payment amount (number only, e.g. 4200) or null if none
- summary: Explain clearly what is required of the user in 1-3 simple sentences. Use clear, gentle English suitable for elderly readers.
```

### Data Processing Strategy
*   **PIL Parsing:** The agent avoids raw mime-type issues by feeding raw image bytes into `PIL.Image.open(io.BytesIO(image_data))` before sending it to Gemini.
*   **JSON Sanitization:** Cleans any backtick enclosures (such as ` ```json ` tags) that the model occasionally outputs before parsing via Python's standard `json.loads`.

---

## 4. Emergency Siren Analysis Agent (`analyze_siren`)
This agent processes environmental audio clips recorded by the senior's device to extract danger signals.

### Prompt Construction
```text
Analyze the audio data containing emergency alerts or sirens, and return a JSON object in English with the following structure.
Always return ONLY a valid JSON object. Do not wrap it in markdown codes block like ```json or ```.

JSON Keys:
- is_emergency: Boolean (true if a siren, evacuation announcement, or disaster alert is active, false otherwise)
- alert_type: The type of warning (e.g., Earthquake Warning, Typhoon Warning, Fire, J-Alert, Daily Test, Other)
- announcement_summary: A simple English summary of the evacuation instructions broadcasted in the audio.
- severity: Hazard danger level (e.g., Extremely High, High, Medium, Low)
```

### Data Input Format
Audio files are sent to the Gemini API formatted with specific mime types:
```python
audio_part = {
    "mime_type": "audio/wav",
    "data": audio_data
}
```

---

## 5. Offline Simulation & Mock Fallback Mode
To facilitate offline hackathon testing or local runs where a valid `GEMINI_API_KEY` is not present, the agent system detects API presence:
*   **Condition:** `IS_OFFLINE = not bool(API_KEY)`
*   **Behavior:** Bypasses Gemini network requests and returns pre-populated, high-fidelity mock JSON structures representing real-world Shibuya Ward scenarios (e.g. Senior Medical Insurance notices or Earthquake warnings).
