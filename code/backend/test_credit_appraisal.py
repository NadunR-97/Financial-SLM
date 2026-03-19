import requests

# 1. Login
url_login = "http://127.0.0.1:8000/token"
data_login = {
    "username": "analyst",
    "password": "analyst123"
}
r_login = requests.post(url_login, data=data_login)
token = r_login.json().get("access_token")

# 2. Analyze Credit
url_analyze = "http://127.0.0.1:8000/analyze-credit"
headers = {"Authorization": f"Bearer {token}"}
data_analyze = {
    "customer_profile": "Test Profile",
    "loan_amount": "50000",
    "loan_tenure": "12",
    "interest_rate": "10",
    "security": "Property"
}

# dummy pdf file
files = [
    ("files", ("test.pdf", b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n", "application/pdf"))
]

try:
    r_analyze = requests.post(url_analyze, headers=headers, data=data_analyze, files=files)
    print("Status:", r_analyze.status_code)
    print("Response:", r_analyze.text)
except Exception as e:
    print("Error:", e)
