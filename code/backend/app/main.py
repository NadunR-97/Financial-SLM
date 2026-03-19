from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List
import uuid
import os
import asyncio
import json
from datetime import timedelta, datetime
from typing import List, Optional

from concurrent.futures import ThreadPoolExecutor
from passlib.context import CryptContext
from jose import jwt, JWTError

import shutil
import hashlib
import random
import smtplib
from email.mime.text import MIMEText

from app.config import get_settings
from app.database import engine, Base, get_db
from app.models import User, AppraisalHistory, SalesTransaction
from sqlalchemy.orm import Session

# --- CUSTOM MODULE IMPORTS ---
from app.ocr.ocr import extract_text_from_pdf_bytes

# Import all RAG and Memory functions
from app.rag.rag import (
    add_to_memory, 
    generate_answer, 
    generate_credit_appraisal,
    list_uploaded_files,      
    delete_file_from_memory   
)

# Import the new Analytics function for Excel & the Chat function
from app.analytics.sales import analyze_sales_excel, chat_about_sales, analyze_sales_data
import pandas as pd

# --- 1. DATA MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str
    department: str
    branch_code: str
    approval_limit: float

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    branch_code: Optional[str] = None
    approval_limit: Optional[float] = None
    password: Optional[str] = None

class QueryRequest(BaseModel):
    query: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class DeleteFileRequest(BaseModel):
    filename: str

# NEW: Model for the Sales Chat
class ChatRequest(BaseModel):
    question: str
    context: str

class VerifyOTPRequest(BaseModel):
    pre_auth_token: str
    otp: str

# Mock Database for 2FA tracking
# Note: In production, use Redis or a real DB
PENDING_2FA_USERS = {}

# --- SECURITY UTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET_KEY, algorithm=settings.AUTH_ALGORITHM)
    return encoded_jwt

def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

def seed_default_users(db: Session):
    # Check if admin exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin = User(
            username="admin", 
            email="admin@example.com", 
            full_name="System Admin",
            hashed_password=get_password_hash("admin123"),
            role="Admin",
            department="Executive Management",
            branch_code="HQ",
            approval_limit=1000000000.0 # 1 Billion
        )
        db.add(admin)
        
    # Check if analyst exists
    analyst_user = db.query(User).filter(User.username == "analyst").first()
    if not analyst_user:
        analyst = User(
            username="analyst", 
            email="nadunrathnayake97@gmail.com", 
            full_name="Nadun Rathnayake",
            hashed_password=get_password_hash("analyst123"),
            role="Credit_Analyst",
            department="SME Banking",
            branch_code="Colombo-Main",
            approval_limit=50000000.0 # 50 Million
        )
        db.add(analyst)
        
    db.commit()

def seed_sales_data(db: Session):
    # Check if we already seeded
    count = db.query(SalesTransaction).count()
    if count > 0:
        return
        
    print("📈 Seeding mock SalesTransaction data...")
    products = ["Personal Loans", "Mortgages", "Credit Cards", "Auto Loans", "Savings Acc."]
    regions = ["HQ", "Colombo-Main", "Kandy", "Galle", "Jaffna"]
    years = [2020, 2021, 2022, 2023, 2024]
    
    import random
    for year in years:
        for product in products:
            for region in regions:
                # Add some growth over years and randomness
                base = 1000000
                if product == "Mortgages": base *= 10
                if product == "Credit Cards": base *= 2
                
                variation = random.uniform(0.8, 1.5)
                growth_factor = 1 + ((year - 2020) * 0.15)
                
                revenue = base * variation * growth_factor
                
                record = SalesTransaction(
                    year=year,
                    product=product,
                    region=region,
                    revenue=revenue
                )
                db.add(record)
    
    db.commit()
    print("✅ Sales Data seeded successfully.")

# --- 2. APP SETUP ---
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Initializing Database & Seeding Users & Data...")
    create_db_and_tables()
    db = next(get_db())
    seed_default_users(db)
    seed_sales_data(db)
    yield
    # Shutdown
    print("🛑 Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. AUTHENTICATION ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

from app.config import get_settings

settings = get_settings()

def send_otp_email(receiver_email: str, otp: str):
    sender = settings.GMAIL_SENDER
    password = settings.GMAIL_APP_PASSWORD
    if not sender or not password:
        print(f"⚠️ SMTP Not Configured. OTP is: {otp}")
        return False
        
    try:
        msg = MIMEText(f"Your Financial SLM verification code is: {otp}")
        msg['Subject'] = 'Login Verification Code'
        msg['From'] = f"Financial SLM <{sender}>"
        msg['To'] = receiver_email
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        print(f"📧 Emailed OTP to {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ Email Failed: {e}")
        return False

# --- 4. GENERAL ROUTES ---

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user in DB
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    # OTP FLOW RE-ENABLED
    otp = str(random.randint(100000, 999999))
    pre_auth_token = str(uuid.uuid4())
    
    PENDING_2FA_USERS[pre_auth_token] = {
        "username": user.username,
        "role": user.role,
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }
    
    # Send email
    if user.email:
        send_otp_email(user.email, otp)
    else:
        print(f"⚠️ User {user.username} has no email. OTP is: {otp}")
        
    return {
        "pre_auth_token": pre_auth_token,
        "message": f"OTP sent to {user.email}" if user.email else "Check server logs for OTP.",
        "require_2fa": True
    }

@app.post("/verify-otp", response_model=Token)
async def verify_otp(request: VerifyOTPRequest):
    session = PENDING_2FA_USERS.get(request.pre_auth_token)
    
    if not session:
        raise HTTPException(status_code=400, detail="Session expired or invalid.")
        
    if session["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")
        
    username = session["username"]
    role = session["role"]
        
    # Mark as used
    del PENDING_2FA_USERS[request.pre_auth_token]
    
    # Issue real JWT/Token with ROLE embedded
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username, "role": role}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


from fastapi import BackgroundTasks

async def get_current_user_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.AUTH_ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    return {"username": username, "role": role}

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user_token)):
        if current_user["role"] not in allowed_roles:
            print(f"🛑 REJECTED: User {current_user['username']} with role {current_user['role']} attempted to access locked route.")
            raise HTTPException(status_code=403, detail="Operation not permitted")
        return current_user
    return role_checker

async def get_current_user(current_user: dict = Depends(get_current_user_token)):
    # Fallback for old routes that just asked for a string
    return current_user["username"]


# --- 3.5. ADMIN USER MANAGEMENT ROUTES ---

@app.get("/admin/users")
async def admin_get_users(current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can view users.")
        
    users = db.query(User).all()
    # Mask passwords
    out = []
    for u in users:
        out.append({
            "id": u.id, "username": u.username, "email": u.email,
            "full_name": u.full_name, "role": u.role, 
            "department": u.department, "branch_code": u.branch_code,
            "approval_limit": u.approval_limit
        })
    return out

@app.post("/admin/users")
async def admin_create_user(cfg: UserCreateRequest, current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can create users.")
        
    if db.query(User).filter(User.username == cfg.username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
        
    try:
        new_user = User(
            username=cfg.username,
            email=cfg.email,
            full_name=cfg.full_name,
            role=cfg.role,
            department=cfg.department,
            branch_code=cfg.branch_code,
            approval_limit=cfg.approval_limit,
            hashed_password=get_password_hash(cfg.password)
        )
        db.add(new_user)
        db.commit()
        return {"message": "User created successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/users/{user_id}")
async def admin_update_user(user_id: int, updates: UserUpdateRequest, current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can update users.")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if updates.email is not None: db_user.email = updates.email
    if updates.full_name is not None: db_user.full_name = updates.full_name
    if updates.role is not None: db_user.role = updates.role
    if updates.department is not None: db_user.department = updates.department
    if updates.branch_code is not None: db_user.branch_code = updates.branch_code
    if updates.approval_limit is not None: db_user.approval_limit = updates.approval_limit
    if updates.password: db_user.hashed_password = get_password_hash(updates.password)
    
    db.commit()
    return {"message": "User updated."}
    
@app.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete users.")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete the root admin.")
        
    try:
        db.delete(db_user)
        db.commit()
        return {"message": "User deleted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete user because they have associated records in the system (e.g., Appraisal History).")


@app.post("/upload")
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...), 
    current_user: str = Depends(get_current_user)
):
    """
    Handles PDF uploads ASYNCHRONOUSLY.
    Returns immediately while processing happens in the background.
    """
    print(f"📥 User {current_user} started uploading {len(files)} files...")
    
    # Read files into memory before responding (FastAPI closes them otherwise)
    # For very large files, we should save to disk first, but for now memory is okay per prototype spec.
    file_data_list = []
    for file in files:
        content = await file.read()
        file_data_list.append({
            "filename": file.filename,
            "content": content
        })
    
    # Enqueue the heavy lifting
    background_tasks.add_task(process_files_background, file_data_list)
            
    return {"message": f"Upload accepted. Processing {len(files)} files in the background..."}

async def process_files_background(file_data_list: List[dict]):
    """
    Background worker to process PDFs and add to vector DB.
    """
    print("🔄 Background Task Started...")
    results = []
    
    try:
        for data in file_data_list:
            filename = data["filename"]
            content = data["content"]
            
            print(f"   -> Processing: {filename}")
            
            # 1. Calculate Hash
            file_hash = hashlib.sha256(content).hexdigest()
            
            # 2. Extract Text
            pages_data = extract_text_from_pdf_bytes(content)
            
            # 3. Add to Memory (Async)
            # Note: add_to_memory is now async in rag.py
            count = await add_to_memory(
                filename=filename, 
                pages_data=pages_data, 
                file_hash=file_hash
            )
            
            results.append(f"{filename} ({count} chunks)")
            
        print(f"✅ Background Processing Complete: {', '.join(results)}")
        
    except Exception as e:
        print(f"❌ Background Error: {e}")

@app.post("/ask")
async def ask_question(request: QueryRequest, current_user: str = Depends(get_current_user)):
    print(f"❓ User {current_user} asked: {request.query}")
    answer = generate_answer(request.query)
    return {"answer": answer}

# --- 5. ANALYTICS & APPRAISAL ROUTES ---

@app.post("/analyze-credit")
async def analyze_credit_application(
    customer_profile: str = Form(...),
    loan_amount: str = Form(...),
    loan_tenure: str = Form(...),
    interest_rate: str = Form(...),
    security: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """
    Generates a Credit Appraisal. 
    Checks User Approval Limits and saves to AppraisalHistory for auditing.
    """
    print(f"🏦 Credit Appraisal Request by {current_user['username']}")
    
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # ENFORCE RBAC: Only Business logic roles can appraise
    if user.username == "admin":
        raise HTTPException(status_code=403, detail="System Administrators are restricted from performing Credit Appraisals.")
    
    all_extracted_text = ""
    processed_files = []

    try:
        for file in files:
            content = await file.read()
            pages_data = extract_text_from_pdf_bytes(content)
            
            file_text = f"\n--- FILE: {file.filename} ---\n"
            for page in pages_data:
                file_text += page['text'] + "\n"
            
            all_extracted_text += file_text
            processed_files.append(file.filename)

        appraisal_result = generate_credit_appraisal(
            profile=customer_profile,
            amount=loan_amount,
            tenure=loan_tenure,
            rate=interest_rate,
            security=security,
            context_text=all_extracted_text
        )

        # DELEGATION OF AUTHORITY CHECK
        try:
            requested_amount = float(loan_amount.replace(",", "").replace("LKR", "").strip())
            if requested_amount > user.approval_limit:
                appraisal_result += f"\n\n**⚠️ SYSTEM OVERRIDE**: The requested loan amount of {loan_amount} exceeds your personal approval limit of {user.approval_limit:,.2f}. **MANAGER REVIEW REQUIRED**."
        except ValueError:
            pass # Unable to parse amount, skip limit check

        # AUDIT TRAIL LOGGING
        # Extract a rough guess of rating/decision for the datatable
        rating_guess = "Pending"
        decision_guess = "Pending"
        if "Rating: 1" in appraisal_result or "Excellent" in appraisal_result: rating_guess = "1 - Excellent"
        elif "Rating: 2" in appraisal_result or "Good" in appraisal_result: rating_guess = "2 - Good"
        elif "Rating: 3" in appraisal_result or "Average" in appraisal_result: rating_guess = "3 - Average"
        elif "Rating: 4" in appraisal_result or "Poor" in appraisal_result: rating_guess = "4 - Poor"
        elif "Rating: 5" in appraisal_result or "Reject" in appraisal_result: rating_guess = "5 - Reject"
        
        if "Approve" in appraisal_result: decision_guess = "Approved"
        elif "Reject" in appraisal_result: decision_guess = "Rejected"
        if "MANAGER REVIEW REQUIRED" in appraisal_result: decision_guess = "Pending Mngr Review"
        
        history_record = AppraisalHistory(
            user_id=user.id,
            customer_profile=customer_profile[:100], # store a snippet
            loan_amount=f"{loan_amount} at {interest_rate}% for {loan_tenure}M",
            credit_rating=rating_guess,
            decision=decision_guess
        )
        db.add(history_record)
        db.commit()

        return {
            "status": "success",
            "processed_files": processed_files,
            "appraisal_report": appraisal_result
        }

    except Exception as e:
        print(f"❌ Appraisal Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sales")
async def analyze_sales_route(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """
    Analyzes Banking Product Sales Excel files for the new Dashboard.
    """
    if current_user == "admin":
        raise HTTPException(status_code=403, detail="System Administrators are restricted from viewing Product Analytics.")
        
    print(f"📊 Analyzing Sales Data: {file.filename}")
    content = await file.read()
    
    # Run the analysis logic from sales.py
    result = analyze_sales_excel(content)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@app.get("/analytics/live-sales")
async def get_live_sales_data(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetches actual enterprise sales data directly from the DB schema
    instead of requiring rigid Excel uploads.
    """
    if current_user == "admin":
        raise HTTPException(status_code=403, detail="System Administrators are restricted from viewing Product Analytics.")
        
    print(f"📊 Connecting to Live Database for {current_user}")
    
    # Query Database
    records = db.query(SalesTransaction).all()
    if not records:
        raise HTTPException(status_code=404, detail="No live data found in the system.")
        
    # Convert ORM to DataFrame
    data_dicts = [{"year": r.year, "product": r.product, "region": r.region, "revenue": r.revenue} for r in records]
    df = pd.DataFrame(data_dicts)
    
    # Run through the identical analytics pipe
    result = analyze_sales_data(df)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

# NEW: CHAT ABOUT SALES DATA ENDPOINT
@app.post("/chat-sales")
async def chat_sales_endpoint(request: ChatRequest, current_user: str = Depends(get_current_user)):
    """
    Allows the user to ask questions about the currently analyzed Excel/CSV data.
    """
    if current_user == "admin":
        raise HTTPException(status_code=403, detail="System Administrators are restricted from using the AI Data Agent.")
        
    print(f"🗣️ AI Chat triggered by {current_user}")
    return chat_about_sales(request.question, request.context)


# --- NEW: SENTIMENT ANALYSIS ENDPOINT ---
from pydantic import BaseModel
from app.rag.rag import client, ACTIVE_MODEL_NAME

class SentimentRequest(BaseModel):
    text_data: str

@app.post("/analyze-sentiment")
async def analyze_sentiment_endpoint(request: SentimentRequest, current_user: str = Depends(get_current_user)):
    """
    Dedicated Sentiment Analysis Pipeline.
    Takes qualitative loan officer notes or customer communications, and returns a structured risk sentiment.
    """
    print(f"🧠 Sentiment Analysis triggered by {current_user}")
    
    if not request.text_data or len(request.text_data.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text data too short for meaningful sentiment analysis.")

    try:
        prompt = f"""
        You are an expert Financial Risk & Sentiment Analyst for a major bank.
        Analyze the following qualitative text (e.g., loan officer interview notes or client communications).
        
        TEXT TO ANALYZE:
        "{request.text_data}"
        
        Respond ONLY with a raw JSON object containing exactly these three keys:
        - "sentiment": A single string, precisely one of: "Positive", "Neutral", "Negative".
        - "score": A float between -1.0 (extremely negative/high risk) and 1.0 (extremely positive/low risk).
        - "key_factors": A JSON array of 2 to 3 very brief strings detailing the primary risks or positive indicators found in the text.
        
        Do not include markdown formatting like ```json or any other commentary. Just the raw JSON.
        """
        
        if client:
            response = client.models.generate_content(model=ACTIVE_MODEL_NAME, contents=prompt)
            result_text = response.text.replace('```json', '').replace('```', '').strip()
            import json
            sentiment_data = json.loads(result_text)
            return sentiment_data
        else:
            raise Exception("AI Client Uninitialized")

    except Exception as e:
        print(f"❌ Sentiment Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process Sentiment Analysis.")

# --- 6. ADMIN ROUTES ---

@app.get("/admin/profile")
async def get_profile(current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """
    Returns user profile details.
    """
    user = db.query(User).filter(User.username == current_user["username"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "profile": {
            "fullName": user.full_name if user.full_name else current_user["username"].capitalize(),
            "role": user.role.replace("_", " "),
            "email": user.email,
            "department": user.department,
            "branch": user.branch_code,
            "approvalLimit": user.approval_limit,
            "lastLogin": "Just now"
        }
    }

@app.get("/admin/history")
async def get_appraisal_history(current_user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """
    Returns the user's past appraisals for the audit trail.
    """
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    history = db.query(AppraisalHistory).filter(AppraisalHistory.user_id == user.id).order_by(AppraisalHistory.timestamp.desc()).limit(20).all()
    
    return {
        "history": [
            {
                "id": h.id,
                "customer": h.customer_profile,
                "loanDetails": h.loan_amount,
                "rating": h.credit_rating,
                "decision": h.decision,
                "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M") if h.timestamp else "N/A"
            } for h in history
        ]
    }

@app.post("/admin/change-password")
async def change_password(request: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    if request.old_password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    print(f"USER {current_user} CHANGED PASSWORD TO: {request.new_password}")
    return {"message": "Password updated successfully"}

@app.get("/admin/users", dependencies=[Depends(require_role(["Admin"]))])
async def get_users():
    """
    Example of an RBAC Protected Route. Only "Admin" can access this.
    """
    return {
        "users": [
            {"id": 1, "name": "Nadun Rathnayake", "role": "Admin", "status": "Active"},
            {"id": 2, "name": "Jane Smith", "role": "Analyst", "status": "Active"},
            {"id": 3, "name": "Mike Johnson", "role": "Viewer", "status": "Inactive"}
        ]
    }

@app.get("/admin/report-data")
async def get_financial_report(current_user: str = Depends(get_current_user)):
    report_prompt = """
    Generate a Comprehensive Financial Analysis Report based on ALL uploaded documents.
    """
    ai_report = generate_answer(report_prompt)
    return {"content": ai_report}

@app.get("/admin/files")
async def get_files(current_user: str = Depends(get_current_user)):
    """Lists all unique files in AI memory."""
    files = list_uploaded_files()
    return {"files": files, "count": len(files)}

@app.post("/admin/delete-file")
async def delete_file(request: DeleteFileRequest, current_user: str = Depends(get_current_user)):
    """Deletes a file from AI memory."""
    success = delete_file_from_memory(request.filename)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file")
    return {"message": f"Successfully deleted {request.filename}"}
# Force uvicorn reload