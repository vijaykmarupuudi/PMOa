from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os
from typing import Optional, List, Dict, Any
import uuid
from enum import Enum

# Environment variables
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", "projecthub-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Initialize FastAPI
app = FastAPI(title="ProjectHub PMO API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.projecthub

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Test route
@app.get("/")
async def root():
    return {"message": "ProjectHub PMO API", "version": "1.0.0", "status": "active"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)