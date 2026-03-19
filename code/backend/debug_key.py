import google.generativeai as genai
import os

# --- PASTE YOUR API KEY HERE ---
GOOGLE_API_KEY = "AIzaSyDlIeUqZWwvnhecPHpKbKdriEjAgGZABJA"

genai.configure(api_key=GOOGLE_API_KEY)

print(f"🔑 Testing API Key: {GOOGLE_API_KEY[:5]}... (hidden)")

try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Test")
    print("✅ SUCCESS! The key is working.")
except Exception as e:
    print("\n❌ CONNECTION FAILED.")
    print(f"Error Details: {e}")