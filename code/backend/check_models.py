import google.generativeai as genai

# --- PASTE YOUR KEY HERE ---
GOOGLE_API_KEY = "AIzaSyAKJ6hSjIi22rfgyVxXknwTw_EDxHnlA08"

genai.configure(api_key=GOOGLE_API_KEY)

print("--- CHECKING AVAILABLE MODELS ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"AVAILABLE: {m.name}")
except Exception as e:
    print(f"ERROR: {e}")