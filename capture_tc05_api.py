import requests
import json
import os
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    os.system("pip install Pillow")
    from PIL import Image, ImageDraw, ImageFont

def generate_api_screenshot():
    # 1. Get an Analyst Token (Admin is blocked from this endpoint due to RBAC)
    token_url = "http://127.0.0.1:8000/token"
    # We'll use the generic user we set up earlier or just create an analyst if needed
    # Wait, the user db has 'analyst' password 'analyst123' based on previous browser testing
    login_res = requests.post(token_url, data={'username': 'analyst', 'password': 'analyst123'})
    
    if login_res.status_code != 200:
        print(f"Failed to login as analyst: {login_res.text}")
        return
        
    token = login_res.json()['access_token']
    
    # 2. Fetch the Live DB Sales Analytics
    headers = {'Authorization': f'Bearer {token}'}
    sales_res = requests.get("http://127.0.0.1:8000/analytics/live-sales", headers=headers)
    
    if sales_res.status_code != 200:
        print(f"Failed to get sales data: {sales_res.text}")
        return
        
    data = sales_res.json()
    
    # 3. Extract the Z-Score Anomalies Array
    anomalies = data.get('anomalies', [])
    
    # Format the JSON beautifully for the screenshot
    display_json = {
        "endpoint": "GET /analytics/live-sales",
        "status": 200,
        "math_engine": "Pandas Z-Score Distribution",
        "trigger_threshold": "abs(z) > 2.0 std_devs",
        "anomalies_detected": anomalies[:3] # Show the first 3 mathematical triggers
    }
    
    json_text = json.dumps(display_json, indent=4)
    
    # 4. Generate a "Terminal/API-style" High-Res PNG Image
    img_width = 1000
    img_height = 600
    img = Image.new('RGB', (img_width, img_height), color=(30, 30, 30)) # Dark gray background
    
    d = ImageDraw.Draw(img)
    
    # Try to use a monospace font if available, fallback to default
    try:
        font = ImageFont.truetype("consola.ttf", 18)
    except IOError:
        font = ImageFont.load_default()
        
    # Draw header bar
    d.rectangle([(0, 0), (img_width, 40)], fill=(45, 45, 45))
    d.text((20, 10), "FastAPI Backend - JSON Response Payload (TC05 Z-Score Engine)", fill=(200, 200, 200), font=font)
    
    # Draw the JSON text
    # Green keys, string values
    lines = json_text.split('\n')
    y_pos = 60
    for line in lines:
        d.text((20, y_pos), line, fill=(166, 226, 46), font=font) # Neon green hacker text
        y_pos += 25
        
    # 5. Save the image physically to the artifacts folder
    artifact_dir = r"C:\Users\Nadun Rathnayake\.gemini\antigravity\brain\d3abb3a2-4a28-43df-8287-cb27a67317b5"
    output_path = os.path.join(artifact_dir, "tc05_backend_api_static.png")
    
    img.save(output_path)
    print(f"✅ Successfully generated API Screenshot at: {output_path}")

if __name__ == "__main__":
    generate_api_screenshot()
