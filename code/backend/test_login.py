import requests

url = "http://127.0.0.1:8000/token"
data = {
    "username": "analyst",
    "password": "analyst123"
}

try:
    response = requests.post(url, data=data) # OAuth2 uses data (form-encoded), not json
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
