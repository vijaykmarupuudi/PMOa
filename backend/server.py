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

# CORS middleware - Allow all origins for preview environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permissive for preview environment
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

# PMO Module Models

# Project Charter Model
class ProjectCharterBase(BaseModel):
    project_id: str
    project_purpose: str
    project_description: str
    project_objectives: List[str] = []
    success_criteria: List[str] = []
    scope_inclusions: List[str] = []
    scope_exclusions: List[str] = []
    assumptions: List[str] = []
    constraints: List[str] = []
    estimated_budget: Optional[float] = 0.0
    estimated_timeline: Optional[str] = None
    key_milestones: List[Dict[str, Any]] = []
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None

class ProjectCharter(ProjectCharterBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    status: str = "draft"  # draft, approved, rejected

# Business Case Model
class BusinessCaseBase(BaseModel):
    project_id: str
    problem_statement: str
    proposed_solution: str
    business_need: str
    expected_benefits: List[str] = []
    cost_benefit_analysis: Dict[str, Any] = {}
    risk_assessment: List[str] = []
    alternatives_considered: List[str] = []
    recommendation: str
    return_on_investment: Optional[str] = None

class BusinessCase(BusinessCaseBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    status: str = "draft"  # draft, approved, rejected

# Stakeholder Register Model
class StakeholderBase(BaseModel):
    project_id: str
    name: str
    title: str
    organization: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    role_in_project: str
    influence_level: str = "medium"  # low, medium, high
    interest_level: str = "medium"  # low, medium, high
    communication_preference: str = "email"  # email, phone, meetings
    expectations: List[str] = []
    concerns: List[str] = []

class Stakeholder(StakeholderBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

# Project Setup Wizard Model
class ProjectSetupWizardBase(BaseModel):
    project_name: str
    project_type: str = "standard"  # standard, agile, waterfall
    industry: Optional[str] = None
    complexity_level: str = "medium"  # low, medium, high
    team_size: Optional[int] = None
    duration_estimate: Optional[str] = None
    budget_range: Optional[str] = None
    methodology: str = "hybrid"  # agile, waterfall, hybrid

# Template Models
class TemplateType(str, Enum):
    PROJECT_CHARTER = "project_charter"
    BUSINESS_CASE = "business_case"

class TemplateBase(BaseModel):
    name: str
    description: str
    template_type: TemplateType
    industry: Optional[str] = None
    project_type: Optional[str] = None
    template_data: Dict[str, Any] = {}
    is_default: bool = False

class Template(TemplateBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    usage_count: int = 0

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

async def init_default_templates():
    """Initialize default project charter and business case templates"""
    default_templates = [
        # Project Charter Templates
        {
            "id": str(uuid.uuid4()),
            "name": "Standard Project Charter",
            "description": "A comprehensive project charter template for standard projects",
            "template_type": "project_charter",
            "industry": "General",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "project_purpose": "Define the purpose and justification for this project",
                "project_description": "Provide a high-level description of the project deliverables and approach",
                "project_objectives": [
                    "Achieve specific, measurable objective 1",
                    "Deliver quantifiable outcome 2",
                    "Establish improved process/system 3"
                ],
                "success_criteria": [
                    "Project completed within approved timeline",
                    "Budget adherence within 5% variance",
                    "Quality standards met per acceptance criteria",
                    "Stakeholder satisfaction rating above 85%"
                ],
                "scope_inclusions": [
                    "Define what is included in project scope",
                    "Specify deliverables and work packages",
                    "List systems, processes, or areas affected"
                ],
                "scope_exclusions": [
                    "Clearly state what is NOT included",
                    "Identify future phase activities",
                    "List assumptions and constraints"
                ],
                "assumptions": [
                    "Resource availability as planned",
                    "Stakeholder engagement and support",
                    "Technology/infrastructure readiness",
                    "Regulatory environment stability"
                ],
                "constraints": [
                    "Budget limitations and approval levels",
                    "Timeline restrictions and key dates",
                    "Resource constraints and dependencies",
                    "Technical or regulatory constraints"
                ],
                "key_milestones": [
                    {"name": "Project Initiation Complete", "target_date": "", "description": "Charter approved and team assembled"},
                    {"name": "Planning Phase Complete", "target_date": "", "description": "Detailed plans approved and baselined"},
                    {"name": "Mid-project Review", "target_date": "", "description": "Progress assessment and course correction"},
                    {"name": "Project Delivery", "target_date": "", "description": "Final deliverables completed and accepted"}
                ]
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Agile Project Charter",
            "description": "Project charter template optimized for Agile methodology projects",
            "template_type": "project_charter",
            "industry": "Technology",
            "project_type": "agile",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "project_purpose": "Deliver value through iterative development and continuous customer collaboration",
                "project_description": "Agile development project with regular sprints and stakeholder feedback loops",
                "project_objectives": [
                    "Deliver working software in iterative cycles",
                    "Maintain high customer satisfaction through collaboration",
                    "Adapt to changing requirements effectively",
                    "Foster team collaboration and continuous improvement"
                ],
                "success_criteria": [
                    "Sprint goals consistently achieved",
                    "Customer satisfaction maintained above 90%",
                    "Team velocity stable and predictable",
                    "Product backlog efficiently managed"
                ],
                "scope_inclusions": [
                    "Product development and enhancement",
                    "Sprint planning and execution",
                    "Regular stakeholder demonstrations",
                    "Continuous integration and testing"
                ],
                "scope_exclusions": [
                    "Detailed upfront documentation",
                    "Fixed scope and timeline commitments",
                    "Waterfall methodology practices"
                ],
                "assumptions": [
                    "Product Owner availability for regular collaboration",
                    "Development team co-location or effective remote setup",
                    "Agile tooling and infrastructure in place",
                    "Stakeholder buy-in for Agile approach"
                ],
                "constraints": [
                    "Sprint duration fixed at 2-4 weeks",
                    "Team size limitations",
                    "Technology stack constraints",
                    "Compliance and regulatory requirements"
                ],
                "key_milestones": [
                    {"name": "Sprint 0 Complete", "target_date": "", "description": "Team formation and initial setup"},
                    {"name": "MVP Release", "target_date": "", "description": "Minimum viable product delivered"},
                    {"name": "Mid-project Retrospective", "target_date": "", "description": "Process improvement assessment"},
                    {"name": "Product Launch", "target_date": "", "description": "Final product release"}
                ]
            }
        },
        # Business Case Templates
        {
            "id": str(uuid.uuid4()),
            "name": "Standard Business Case",
            "description": "Comprehensive business case template for project justification",
            "template_type": "business_case",
            "industry": "General",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "problem_statement": "Clearly articulate the business problem or opportunity that requires attention",
                "business_need": "Explain the business need and urgency for addressing this problem",
                "proposed_solution": "Describe the recommended solution approach and key components",
                "expected_benefits": [
                    "Quantified cost savings or revenue increase",
                    "Process efficiency improvements",
                    "Risk reduction or compliance benefits",
                    "Strategic alignment and competitive advantage"
                ],
                "cost_benefit_analysis": {
                    "implementation_costs": {
                        "personnel": "Internal resource costs",
                        "technology": "Software, hardware, infrastructure",
                        "external_services": "Consultants, vendors, contractors",
                        "training": "Staff training and change management",
                        "other": "Travel, facilities, miscellaneous"
                    },
                    "ongoing_costs": {
                        "maintenance": "System maintenance and support",
                        "operations": "Ongoing operational expenses",
                        "licenses": "Software licensing and subscriptions"
                    },
                    "benefits": {
                        "cost_savings": "Annual cost reduction",
                        "revenue_increase": "Additional revenue generation",
                        "productivity_gains": "Efficiency improvements",
                        "risk_avoidance": "Risk mitigation value"
                    },
                    "roi_calculation": "Net Present Value and Return on Investment analysis"
                },
                "risk_assessment": [
                    "Implementation risks and mitigation strategies",
                    "Technology risks and contingencies",
                    "Resource availability risks",
                    "Change management and adoption risks",
                    "Market or regulatory risks"
                ],
                "alternatives_considered": [
                    "Do nothing - maintain status quo",
                    "Alternative solution approaches",
                    "Phased implementation options",
                    "Third-party service options"
                ],
                "recommendation": "Recommended course of action based on analysis",
                "return_on_investment": "Expected ROI timeline and break-even analysis"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Technology Investment Business Case",
            "description": "Business case template focused on technology investments and digital transformation",
            "template_type": "business_case",
            "industry": "Technology",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "problem_statement": "Current technology limitations impacting business performance and growth",
                "business_need": "Digital transformation required to maintain competitive position and operational efficiency",
                "proposed_solution": "Implementation of modern technology platform with enhanced capabilities",
                "expected_benefits": [
                    "Improved system performance and reliability",
                    "Enhanced user experience and productivity",
                    "Better data analytics and decision-making capabilities",
                    "Reduced operational costs through automation",
                    "Increased scalability and future-readiness"
                ],
                "cost_benefit_analysis": {
                    "implementation_costs": {
                        "software_licenses": "Platform licensing and subscriptions",
                        "hardware_infrastructure": "Servers, network, storage equipment",
                        "implementation_services": "Professional services and consulting",
                        "data_migration": "Legacy system migration costs",
                        "training_change_mgmt": "User training and change management"
                    },
                    "ongoing_costs": {
                        "annual_licensing": "Recurring software costs",
                        "support_maintenance": "Technical support and maintenance",
                        "cloud_operations": "Cloud hosting and operations"
                    },
                    "benefits": {
                        "productivity_gains": "User efficiency improvements",
                        "operational_savings": "Reduced manual processes",
                        "infrastructure_savings": "Legacy system retirement",
                        "revenue_enablement": "New capability-driven revenue"
                    }
                },
                "risk_assessment": [
                    "Technical implementation complexity",
                    "Data migration and integration challenges",
                    "User adoption and change resistance",
                    "Vendor dependency and support risks",
                    "Security and compliance considerations"
                ],
                "alternatives_considered": [
                    "Continue with legacy systems",
                    "Phased modernization approach",
                    "Cloud-first vs hybrid solutions",
                    "Build vs buy analysis"
                ],
                "recommendation": "Proceed with recommended technology investment for competitive advantage",
                "return_on_investment": "Expected 18-24 month payback period with 150% ROI over 3 years"
            }
        }
    ]
    
    for template in default_templates:
        existing = await db.templates.find_one({"name": template["name"]})
        if not existing:
            await db.templates.insert_one(template)
            print(f"Default template created: {template['name']}")

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

# PMO Module Routes

# Project Charter Routes
@app.post("/api/project-charter", response_model=ProjectCharter)
async def create_project_charter(
    charter_data: ProjectCharterBase,
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if project exists
    project = await db.projects.find_one({"id": charter_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    charter_dict = charter_data.dict()
    charter_dict["id"] = str(uuid.uuid4())
    charter_dict["created_by"] = current_user.id
    charter_dict["created_at"] = datetime.now(timezone.utc)
    charter_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.project_charters.insert_one(charter_dict)
    charter_dict["_id"] = str(charter_dict.get("_id"))
    
    return ProjectCharter(**charter_dict)

@app.get("/api/project-charter/project/{project_id}", response_model=ProjectCharter)
async def get_project_charter(project_id: str, current_user: User = Depends(get_current_user)):
    charter = await db.project_charters.find_one({"project_id": project_id})
    
    if not charter:
        raise HTTPException(status_code=404, detail="Project charter not found")
    
    charter["_id"] = str(charter["_id"])
    return ProjectCharter(**charter)

@app.put("/api/project-charter/{charter_id}", response_model=ProjectCharter)
async def update_project_charter(
    charter_id: str,
    charter_update: ProjectCharterBase,
    current_user: User = Depends(get_current_user)
):
    charter = await db.project_charters.find_one({"id": charter_id})
    
    if not charter:
        raise HTTPException(status_code=404, detail="Project charter not found")
    
    # Check permissions
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = charter_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.project_charters.update_one(
        {"id": charter_id},
        {"$set": update_dict}
    )
    
    updated_charter = await db.project_charters.find_one({"id": charter_id})
    updated_charter["_id"] = str(updated_charter["_id"])
    
    return ProjectCharter(**updated_charter)

# Business Case Routes
@app.post("/api/business-case", response_model=BusinessCase)
async def create_business_case(
    case_data: BusinessCaseBase,
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if project exists
    project = await db.projects.find_one({"id": case_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    case_dict = case_data.dict()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["created_by"] = current_user.id
    case_dict["created_at"] = datetime.now(timezone.utc)
    case_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.business_cases.insert_one(case_dict)
    case_dict["_id"] = str(case_dict.get("_id"))
    
    return BusinessCase(**case_dict)

@app.get("/api/business-case/project/{project_id}", response_model=BusinessCase)
async def get_business_case(project_id: str, current_user: User = Depends(get_current_user)):
    case = await db.business_cases.find_one({"project_id": project_id})
    
    if not case:
        raise HTTPException(status_code=404, detail="Business case not found")
    
    case["_id"] = str(case["_id"])
    return BusinessCase(**case)

# Stakeholder Register Routes
@app.post("/api/stakeholders", response_model=Stakeholder)
async def create_stakeholder(
    stakeholder_data: StakeholderBase,
    current_user: User = Depends(get_current_user)
):
    # Check if project exists
    project = await db.projects.find_one({"id": stakeholder_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stakeholder_dict = stakeholder_data.dict()
    stakeholder_dict["id"] = str(uuid.uuid4())
    stakeholder_dict["created_by"] = current_user.id
    stakeholder_dict["created_at"] = datetime.now(timezone.utc)
    stakeholder_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.stakeholders.insert_one(stakeholder_dict)
    stakeholder_dict["_id"] = str(stakeholder_dict.get("_id"))
    
    return Stakeholder(**stakeholder_dict)

@app.get("/api/stakeholders/project/{project_id}", response_model=List[Stakeholder])
async def get_project_stakeholders(project_id: str, current_user: User = Depends(get_current_user)):
    stakeholders = []
    cursor = db.stakeholders.find({"project_id": project_id})
    
    async for stakeholder in cursor:
        stakeholder["_id"] = str(stakeholder["_id"])
        stakeholders.append(Stakeholder(**stakeholder))
    
    return stakeholders

@app.put("/api/stakeholders/{stakeholder_id}", response_model=Stakeholder)
async def update_stakeholder(
    stakeholder_id: str,
    stakeholder_update: StakeholderBase,
    current_user: User = Depends(get_current_user)
):
    stakeholder = await db.stakeholders.find_one({"id": stakeholder_id})
    
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    update_dict = stakeholder_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.stakeholders.update_one(
        {"id": stakeholder_id},
        {"$set": update_dict}
    )
    
    updated_stakeholder = await db.stakeholders.find_one({"id": stakeholder_id})
    updated_stakeholder["_id"] = str(updated_stakeholder["_id"])
    
    return Stakeholder(**updated_stakeholder)

@app.delete("/api/stakeholders/{stakeholder_id}")
async def delete_stakeholder(stakeholder_id: str, current_user: User = Depends(get_current_user)):
    stakeholder = await db.stakeholders.find_one({"id": stakeholder_id})
    
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    await db.stakeholders.delete_one({"id": stakeholder_id})
    return {"message": "Stakeholder deleted successfully"}

# Project Setup Wizard Route
@app.post("/api/project-wizard", response_model=Project)
async def create_project_from_wizard(
    wizard_data: ProjectSetupWizardBase,
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Create project from wizard data
    project_dict = {
        "id": str(uuid.uuid4()),
        "name": wizard_data.project_name,
        "description": f"Project created using {wizard_data.project_type} methodology",
        "status": ProjectStatus.INITIATION,
        "priority": Priority.MEDIUM,
        "start_date": None,
        "end_date": None,
        "budget": 0.0,
        "stakeholders": [],
        "tags": [wizard_data.project_type, wizard_data.methodology],
        "project_manager_id": current_user.id,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "completion_percentage": 0.0,
        # Additional wizard fields
        "project_type": wizard_data.project_type,
        "industry": wizard_data.industry,
        "complexity_level": wizard_data.complexity_level,
        "team_size": wizard_data.team_size,
        "duration_estimate": wizard_data.duration_estimate,
        "budget_range": wizard_data.budget_range,
        "methodology": wizard_data.methodology
    }
    
    await db.projects.insert_one(project_dict)
    project_dict["_id"] = str(project_dict.get("_id"))
    
    return Project(**project_dict)

# Template Routes
@app.get("/api/templates", response_model=List[Template])
async def get_templates(
    template_type: Optional[TemplateType] = None,
    industry: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all templates with optional filtering"""
    filter_query = {}
    
    if template_type:
        filter_query["template_type"] = template_type
    if industry:
        filter_query["industry"] = industry
    
    templates = []
    cursor = db.templates.find(filter_query).sort("is_default", -1)  # Default templates first
    
    async for template in cursor:
        template["_id"] = str(template["_id"])
        templates.append(Template(**template))
    
    return templates

@app.get("/api/templates/{template_id}", response_model=Template)
async def get_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific template by ID"""
    template = await db.templates.find_one({"id": template_id})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template["_id"] = str(template["_id"])
    return Template(**template)

@app.post("/api/templates", response_model=Template)
async def create_template(
    template_data: TemplateBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new template"""
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    template_dict = template_data.dict()
    template_dict["id"] = str(uuid.uuid4())
    template_dict["created_by"] = current_user.id
    template_dict["created_at"] = datetime.now(timezone.utc)
    template_dict["updated_at"] = datetime.now(timezone.utc)
    template_dict["usage_count"] = 0
    
    await db.templates.insert_one(template_dict)
    template_dict["_id"] = str(template_dict.get("_id"))
    
    return Template(**template_dict)

@app.post("/api/templates/{template_id}/use")
async def use_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Mark template as used (increment usage count)"""
    template = await db.templates.find_one({"id": template_id})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment usage count
    await db.templates.update_one(
        {"id": template_id},
        {"$inc": {"usage_count": 1}}
    )
    
    return {"message": "Template usage recorded", "template_id": template_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)