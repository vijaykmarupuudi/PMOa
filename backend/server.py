from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import motor.motor_asyncio
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os
from typing import Optional, List, Dict, Any
import uuid
from bson import ObjectId
import json
from enum import Enum

# Environment variables
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", "projecthub-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Initialize FastAPI
app = FastAPI(title="ProjectHub PMO API", version="1.0.0")

# CORS middleware
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://portfolio-pulse-68.preview.emergentagent.com",
    "https://*.preview.emergentagent.com",
    "https://*.emergentagent.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.projecthub

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Enums
class UserRole(str, Enum):
    PROJECT_MANAGER = "project_manager"
    TEAM_MEMBER = "team_member"
    STAKEHOLDER = "stakeholder"
    EXECUTIVE = "executive"

class ProjectStatus(str, Enum):
    INITIATION = "initiation"
    PLANNING = "planning"
    EXECUTION = "execution"
    MONITORING = "monitoring"
    CLOSURE = "closure"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ProjectBase(BaseModel):
    name: str
    description: str
    status: ProjectStatus = ProjectStatus.INITIATION
    priority: Priority = Priority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = 0.0
    stakeholders: List[str] = []
    tags: List[str] = []

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str
    project_manager_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    completion_percentage: float = 0.0

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    
    user["_id"] = str(user["_id"])
    return User(**user)

# Database initialization with demo users
async def init_demo_users():
    """Initialize demo users for testing"""
    demo_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "pm@projecthub.com",
            "username": "project_manager",
            "full_name": "Sarah Johnson",
            "role": UserRole.PROJECT_MANAGER,
            "department": "PMO",
            "password": get_password_hash("demo123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "exec@projecthub.com",
            "username": "executive",
            "full_name": "Michael Chen",
            "role": UserRole.EXECUTIVE,
            "department": "Executive",
            "password": get_password_hash("demo123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "dev@projecthub.com",
            "username": "developer",
            "full_name": "Emma Rodriguez",
            "role": UserRole.TEAM_MEMBER,
            "department": "Engineering",
            "password": get_password_hash("demo123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "stakeholder@projecthub.com",
            "username": "stakeholder",
            "full_name": "David Park",
            "role": UserRole.STAKEHOLDER,
            "department": "Business",
            "password": get_password_hash("demo123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for user in demo_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"Demo user created: {user['email']}")

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    await init_demo_users()
    print("ProjectHub PMO API started successfully!")

# Routes

@app.get("/")
async def root():
    return {"message": "ProjectHub PMO API", "version": "1.0.0", "status": "active"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Authentication Routes
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user_data.email},
            {"username": user_data.username}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"
        )
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict["id"]}, expires_delta=access_token_expires
    )
    
    # Remove password from response
    user_dict.pop("password")
    user_dict["_id"] = str(user_dict.get("_id"))
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user_dict)
    )

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user by email or username
    user = await db.users.find_one({
        "$or": [
            {"email": form_data.username},
            {"username": form_data.username}
        ]
    })
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    # Remove password from response
    user.pop("password")
    user["_id"] = str(user.get("_id"))
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user)
    )

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/auth/demo-users")
async def get_demo_users():
    """Get demo user credentials for easy login"""
    return {
        "demo_users": [
            {"email": "pm@projecthub.com", "password": "demo123", "role": "Project Manager"},
            {"email": "exec@projecthub.com", "password": "demo123", "role": "Executive"},
            {"email": "dev@projecthub.com", "password": "demo123", "role": "Team Member"},
            {"email": "stakeholder@projecthub.com", "password": "demo123", "role": "Stakeholder"}
        ]
    }

# Project Routes
@app.post("/api/projects", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    project_dict = project_data.dict()
    project_dict["id"] = str(uuid.uuid4())
    project_dict["project_manager_id"] = current_user.id
    project_dict["created_by"] = current_user.id
    project_dict["created_at"] = datetime.now(timezone.utc)
    project_dict["updated_at"] = datetime.now(timezone.utc)
    project_dict["completion_percentage"] = 0.0
    
    await db.projects.insert_one(project_dict)
    project_dict["_id"] = str(project_dict.get("_id"))
    
    return Project(**project_dict)

@app.get("/api/projects", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_user)):
    # Get projects based on user role
    if current_user.role == UserRole.EXECUTIVE:
        # Executives can see all projects
        cursor = db.projects.find({})
    elif current_user.role == UserRole.PROJECT_MANAGER:
        # PMs can see projects they manage or are involved in
        cursor = db.projects.find({
            "$or": [
                {"project_manager_id": current_user.id},
                {"stakeholders": current_user.id},
                {"created_by": current_user.id}
            ]
        })
    else:
        # Team members and stakeholders see projects they're involved in
        cursor = db.projects.find({
            "$or": [
                {"stakeholders": current_user.id},
                {"created_by": current_user.id}
            ]
        })
    
    projects = []
    async for project in cursor:
        project["_id"] = str(project["_id"])
        projects.append(Project(**project))
    
    return projects

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project["_id"] = str(project["_id"])
    return Project(**project)

@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectBase,
    current_user: User = Depends(get_current_user)
):
    project = await db.projects.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE] and 
        project["project_manager_id"] != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = project_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": update_dict}
    )
    
    updated_project = await db.projects.find_one({"id": project_id})
    updated_project["_id"] = str(updated_project["_id"])
    
    return Project(**updated_project)

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only project managers and executives can delete projects
    if (current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE] and 
        project["project_manager_id"] != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await db.projects.delete_one({"id": project_id})
    return {"message": "Project deleted successfully"}

# Dashboard Routes
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Get project statistics based on user role
    if current_user.role == UserRole.EXECUTIVE:
        total_projects = await db.projects.count_documents({})
        active_projects = await db.projects.count_documents({"status": {"$nin": ["completed", "cancelled"]}})
        completed_projects = await db.projects.count_documents({"status": "completed"})
    else:
        # Filter by user involvement
        user_filter = {
            "$or": [
                {"project_manager_id": current_user.id},
                {"stakeholders": current_user.id},
                {"created_by": current_user.id}
            ]
        }
        total_projects = await db.projects.count_documents(user_filter)
        active_projects = await db.projects.count_documents({
            **user_filter,
            "status": {"$nin": ["completed", "cancelled"]}
        })
        completed_projects = await db.projects.count_documents({
            **user_filter,
            "status": "completed"
        })
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "completion_rate": round((completed_projects / max(total_projects, 1)) * 100, 1)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)