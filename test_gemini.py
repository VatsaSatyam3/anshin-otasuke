import os
import google.generativeai as genai

# Test the API key
API_KEY = "AIzaSyB5YmIOicwJAaXUoeZlsXnuQJETthQF5Vc"
genai.configure(api_key=API_KEY)

print("Listing models...")
try:
    for m in genai.list_models():
        print(f"Model: {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

print("Generating content with gemini-3.5-flash...")
try:
    model = genai.GenerativeModel("gemini-3.5-flash")
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error generating: {e}")
