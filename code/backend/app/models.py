from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Credit_Analyst") # "Admin" or "Credit_Analyst"
    department = Column(String, default="Retail Banking")
    branch_code = Column(String, default="HQ")
    approval_limit = Column(Float, default=0.0)

class AppraisalHistory(Base):
    __tablename__ = "appraisal_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_profile = Column(String)
    loan_amount = Column(String)
    credit_rating = Column(String)
    decision = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SalesTransaction(Base):
    __tablename__ = "sales_transactions"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)
    product = Column(String, index=True)
    revenue = Column(Float)
    region = Column(String, index=True)
