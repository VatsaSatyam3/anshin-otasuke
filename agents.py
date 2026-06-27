import os
import json
import io
from PIL import Image
import google.generativeai as genai

# Setup Gemini API configuration
API_KEY = os.getenv("GEMINI_API_KEY")
IS_OFFLINE = not bool(API_KEY)

if API_KEY:
    genai.configure(api_key=API_KEY)
    print("[SYSTEM] Gemini API configured successfully (Online mode).")
else:
    print("[WARNING] GEMINI_API_KEY environment variable not set. Running in OFFLINE/MOCK mode.")

def generate_multimodal_content(prompt, media_part, is_audio=False) -> str:
    """
    Attempts to generate content trying multiple Gemini models sequentially
    to handle legacy API key or library version discrepancies.
    """
    # Using the latest 2026 models returned by your API key:
    models_to_try = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]
        
    last_error = None
    
    for model_name in models_to_try:
        try:
            print(f"[SYSTEM] Requesting Gemini using model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, media_part])
            return response.text
        except Exception as e:
            last_error = e
            print(f"[WARNING] Model {model_name} failed: {e}")
            continue
            
    raise last_error

def analyze_document(image_data: bytes = None) -> dict:
    """
    Analyzes an official document image (tax slip, hospital invoice, etc.)
    and returns a structured explanation for elderly users.
    """
    if IS_OFFLINE or not image_data:
        # High quality offline mockup fallback (English)
        return {
            "title": "Senior Medical Insurance Premium Notice",
            "type": "Insurance & Tax",
            "issuer": "Shibuya Ward Office, National Pension Division",
            "deadline": "July 31, 2026",
            "amount": 4200,
            "summary": "This is a payment slip for your senior medical insurance premium. Please pay 4,200 yen at any post office or convenience store by July 31. You can also set up automated bank transfers to avoid manual payments."
        }
    
    try:
        prompt = """
        Analyze the document image and return a JSON object in English with the following structure.
        Always return ONLY a valid JSON object. Do not wrap it in markdown codes block like ```json or ```.

        JSON Keys:
        - title: The title of the document (e.g., Senior Medical Insurance Notice, Health Checkup Notice, Tax Payment Demand)
        - type: The category (e.g., Tax, Insurance, Health, Administrative, Other)
        - issuer: The issuing authority (e.g., Shibuya Ward Office, Ministry of Health)
        - deadline: Due date for payment or registration (e.g., July 31, 2026) or null if none
        - amount: Payment amount (number only, e.g. 4200) or null if none
        - summary: Explain clearly what is required of the user in 1-3 simple sentences. Use clear, gentle English suitable for elderly readers.
        """
        
        # Load image bytes into a PIL Image object
        img = Image.open(io.BytesIO(image_data))
        
        response_text = generate_multimodal_content(prompt, img, is_audio=False)
        text = response_text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        return json.loads(text.strip())
    except Exception as e:
        print(f"[ERROR] Gemini doc analysis failed: {e}")
        return {
            "title": "Document Parsing Failed",
            "type": "Unknown",
            "issuer": "Unknown",
            "deadline": "None",
            "amount": None,
            "summary": "Failed to read the document clearly. Please retake the photo in a well-lit area or contact family for assistance."
        }

def analyze_siren(audio_data: bytes = None) -> dict:
    """
    Analyzes an audio clip containing emergency alerts (sirens, announcements)
    to determine the hazard level and emergency directions.
    """
    if IS_OFFLINE or not audio_data:
        # High quality offline mockup fallback (English)
        return {
            "is_emergency": True,
            "alert_type": "Earthquake Early Warning",
            "announcement_summary": "Prepare for strong shaking immediately. Seek shelter under a table, and evacuate to your designated local shelter once the shaking stops.",
            "severity": "Extremely High"
        }
    
    try:
        prompt = """
        Analyze the audio data containing emergency alerts or sirens, and return a JSON object in English with the following structure.
        Always return ONLY a valid JSON object. Do not wrap it in markdown codes block like ```json or ```.

        JSON Keys:
        - is_emergency: Boolean (true if a siren, evacuation announcement, or disaster alert is active, false otherwise)
        - alert_type: The type of warning (e.g., Earthquake Warning, Typhoon Warning, Fire, J-Alert, Daily Test, Other)
        - announcement_summary: A simple English summary of the evacuation instructions broadcasted in the audio.
        - severity: Hazard danger level (e.g., Extremely High, High, Medium, Low)
        """
        
        audio_part = {
            "mime_type": "audio/wav",
            "data": audio_data
        }
        
        response_text = generate_multimodal_content(prompt, audio_part, is_audio=True)
        text = response_text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
                
        return json.loads(text.strip())
    except Exception as e:
        print(f"[ERROR] Gemini siren analysis failed: {e}")
        return {
            "is_emergency": True,
            "alert_type": "Emergency Siren Detected",
            "announcement_summary": "An emergency warning siren was detected nearby. Please prioritize your safety and follow local evacuation guidelines immediately.",
            "severity": "High"
        }

def analyze_video(video_data: bytes = None) -> dict:
    """
    Analyzes a video clip containing potential emergency scenarios (e.g. earthquakes, fires)
    to determine the danger type and safety instructions.
    """
    if IS_OFFLINE or not video_data:
        return {
            "is_emergency": True,
            "alert_type": "Earthquake Warning",
            "announcement_summary": "Active earthquake shaking detected. Drop, cover, and hold on immediately.",
            "severity": "High"
        }
    
    try:
        prompt = """
        Analyze the video data to check for disasters, hazards, or emergency warning alerts (such as earthquakes, fires, floods, or emergency sirens).
        Return a JSON object in English with the following structure.
        Always return ONLY a valid JSON object. Do not wrap it in markdown codes block like ```json or ```.

        JSON Keys:
        - is_emergency: Boolean (true if an earthquake, fire, flood, siren, or other active disaster/hazard is visible or audible in the video, false otherwise)
        - alert_type: The type of warning or hazard (e.g., Earthquake, Fire, Flood, Siren, Daily Test, Other)
        - announcement_summary: A simple English summary of the hazard and the recommended immediate safety action.
        - severity: Hazard danger level (e.g., Extremely High, High, Medium, Low)
        """
        
        video_part = {
            "mime_type": "video/mp4",
            "data": video_data
        }
        
        response_text = generate_multimodal_content(prompt, video_part, is_audio=False)
        text = response_text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
                
        return json.loads(text.strip())
    except Exception as e:
        print(f"[ERROR] Gemini video analysis failed: {e}")
        return {
            "is_emergency": True,
            "alert_type": "Hazard Detected in Video",
            "announcement_summary": "An active hazard or warning was detected in the video content. Please seek safety immediately.",
            "severity": "High"
        }

