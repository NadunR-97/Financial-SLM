from fastapi.testclient import TestClient
from app.main import app

app.dependency_overrides = {}

# Mock get_current_user to bypass auth
from app.main import get_current_user
async def mock_get_current_user():
    return "testuser"
app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

response = client.post("/analyze-sentiment", json={"text_data": "The applicant seemed highly anxious when reviewing their tax strategy and was actively evasive about their secondary income streams..."})

print("Status:", response.status_code)
print("Response:", response.text)
