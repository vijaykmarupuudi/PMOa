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
    STAKEHOLDER_REGISTER = "stakeholder_register"
    RISK_LOG = "risk_log"
    FEASIBILITY_STUDY = "feasibility_study"

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

# Module 2: Planning Models

# Work Breakdown Structure (WBS) Models
class WBSTaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class WBSTaskBase(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    parent_id: Optional[str] = None  # For hierarchical structure
    level: int = 1  # WBS level (1 = top level, 2 = sub-task, etc.)
    wbs_code: str  # e.g., "1.1.2"
    status: WBSTaskStatus = WBSTaskStatus.NOT_STARTED
    assigned_to: Optional[str] = None
    estimated_hours: Optional[float] = 0.0
    actual_hours: Optional[float] = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    dependencies: List[str] = []  # List of task IDs this task depends on
    deliverables: List[str] = []
    notes: Optional[str] = ""

class WBSTask(WBSTaskBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    completion_percentage: float = 0.0

# Risk Management Models
class RiskProbability(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class RiskImpact(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class RiskStatus(str, Enum):
    IDENTIFIED = "identified"
    ASSESSED = "assessed"
    MITIGATED = "mitigated"
    CLOSED = "closed"
    OCCURRED = "occurred"

class RiskBase(BaseModel):
    project_id: str
    title: str
    description: str
    category: str  # Technical, Schedule, Budget, Resource, etc.
    probability: RiskProbability
    impact: RiskImpact
    status: RiskStatus = RiskStatus.IDENTIFIED
    owner: Optional[str] = None
    mitigation_strategy: Optional[str] = ""
    contingency_plan: Optional[str] = ""
    target_date: Optional[datetime] = None
    actual_date: Optional[datetime] = None

class Risk(RiskBase):
    id: str
    risk_score: float  # Calculated: probability * impact
    created_by: str
    created_at: datetime
    updated_at: datetime

# Budget Planning Models
class BudgetCategory(str, Enum):
    LABOR = "labor"
    EQUIPMENT = "equipment"
    MATERIALS = "materials"
    TRAVEL = "travel"
    TRAINING = "training"
    SOFTWARE = "software"
    CONTINGENCY = "contingency"
    OTHER = "other"

class BudgetItemBase(BaseModel):
    project_id: str
    category: BudgetCategory
    item_name: str
    description: Optional[str] = ""
    estimated_cost: float
    actual_cost: Optional[float] = 0.0
    vendor: Optional[str] = ""
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = ""

class BudgetItem(BudgetItemBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

# Communication Plan Models
class CommunicationFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    AS_NEEDED = "as_needed"

class CommunicationMethod(str, Enum):
    EMAIL = "email"
    MEETING = "meeting"
    REPORT = "report"
    DASHBOARD = "dashboard"
    PHONE = "phone"
    CHAT = "chat"

class CommunicationPlanBase(BaseModel):
    project_id: str
    stakeholder_group: str
    information_type: str
    method: CommunicationMethod
    frequency: CommunicationFrequency
    responsible_person: str
    audience: List[str] = []
    purpose: str
    format: Optional[str] = ""
    delivery_date: Optional[datetime] = None

class CommunicationPlan(CommunicationPlanBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

# Quality & Procurement Models
class QualityStandard(str, Enum):
    ISO_9001 = "iso_9001"
    SIX_SIGMA = "six_sigma"
    CMMI = "cmmi"
    AGILE_TESTING = "agile_testing"
    CUSTOM = "custom"

class ProcurementType(str, Enum):
    SOFTWARE = "software"
    HARDWARE = "hardware"
    SERVICES = "services"
    CONSULTING = "consulting"
    TRAINING = "training"
    OTHER = "other"

class ProcurementStatus(str, Enum):
    PLANNED = "planned"
    RFQ_SENT = "rfq_sent"
    EVALUATION = "evaluation"
    APPROVED = "approved"
    ORDERED = "ordered"
    RECEIVED = "received"
    COMPLETED = "completed"

class QualityRequirementBase(BaseModel):
    project_id: str
    requirement_name: str
    description: str
    standard: QualityStandard
    acceptance_criteria: List[str] = []
    testing_approach: str
    responsible_party: str
    target_date: Optional[datetime] = None
    status: str = "planned"  # planned, in_progress, completed, failed
    priority: str = "medium"  # low, medium, high, critical

class QualityRequirement(QualityRequirementBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

class ProcurementItemBase(BaseModel):
    project_id: str
    item_name: str
    description: str
    procurement_type: ProcurementType
    vendor: Optional[str] = None
    estimated_cost: float
    actual_cost: Optional[float] = 0.0
    quantity: int = 1
    unit: Optional[str] = "each"
    required_date: Optional[datetime] = None
    status: ProcurementStatus = ProcurementStatus.PLANNED
    approval_required: bool = True
    approved_by: Optional[str] = None
    notes: Optional[str] = ""

class ProcurementItem(ProcurementItemBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

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
        },
        # Stakeholder Register Templates
        {
            "id": str(uuid.uuid4()),
            "name": "Standard Stakeholder Register",
            "description": "Comprehensive stakeholder management template for project stakeholder identification and engagement planning",
            "template_type": "stakeholder_register",
            "industry": "General",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "stakeholder_categories": [
                    "Internal Stakeholders",
                    "External Stakeholders",
                    "Primary Stakeholders",
                    "Secondary Stakeholders"
                ],
                "sample_stakeholders": [
                    {
                        "name": "Project Sponsor",
                        "title": "Executive Sponsor",
                        "organization": "Internal - Executive Team",
                        "contact_email": "sponsor@company.com",
                        "contact_phone": "+1-555-0100",
                        "role_in_project": "Project authorization and high-level decision making",
                        "influence_level": "high",
                        "interest_level": "high",
                        "communication_preference": "email",
                        "expectations": [
                            "Project delivered on time and within budget",
                            "Regular status updates and escalation of major issues",
                            "Achievement of business objectives and ROI"
                        ],
                        "concerns": [
                            "Budget overruns",
                            "Timeline delays",
                            "Resource conflicts with other initiatives"
                        ]
                    },
                    {
                        "name": "End Users Representative",
                        "title": "Department Manager",
                        "organization": "Internal - Operations",
                        "contact_email": "users@company.com",
                        "contact_phone": "+1-555-0200",
                        "role_in_project": "User requirements definition and acceptance testing",
                        "influence_level": "medium",
                        "interest_level": "high",
                        "communication_preference": "meetings",
                        "expectations": [
                            "Solution meets operational needs",
                            "Adequate training and support",
                            "Minimal disruption to daily operations"
                        ],
                        "concerns": [
                            "Learning curve for new processes",
                            "System reliability and performance",
                            "Impact on current workflows"
                        ]
                    }
                ],
                "engagement_strategies": [
                    "Regular stakeholder meetings and updates",
                    "Involvement in key decision points",
                    "Feedback collection and incorporation",
                    "Training and change management support",
                    "Clear communication channels and escalation paths"
                ],
                "communication_matrix": {
                    "high_influence_high_interest": "Manage closely - weekly updates, direct involvement",
                    "high_influence_low_interest": "Keep satisfied - monthly updates, informed of major changes",
                    "low_influence_high_interest": "Keep informed - regular communication, project newsletter",
                    "low_influence_low_interest": "Monitor - quarterly updates, general communications"
                }
            }
        },
        # Risk Log Templates
        {
            "id": str(uuid.uuid4()),
            "name": "Comprehensive Risk Log",
            "description": "Complete risk management template with risk identification, assessment, and mitigation planning",
            "template_type": "risk_log",
            "industry": "General",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "risk_categories": [
                    "Technical Risk",
                    "Schedule Risk",
                    "Budget Risk",
                    "Resource Risk",
                    "External Risk",
                    "Organizational Risk",
                    "Quality Risk",
                    "Regulatory/Compliance Risk"
                ],
                "probability_scale": {
                    "very_low": "1 - Very Low (0-10% chance)",
                    "low": "2 - Low (11-30% chance)",
                    "medium": "3 - Medium (31-50% chance)",
                    "high": "4 - High (51-80% chance)",
                    "very_high": "5 - Very High (81-100% chance)"
                },
                "impact_scale": {
                    "very_low": "1 - Very Low (Minimal impact)",
                    "low": "2 - Low (Minor impact, easily manageable)",
                    "medium": "3 - Medium (Moderate impact, requires management attention)",
                    "high": "4 - High (Major impact, significant management required)",
                    "very_high": "5 - Very High (Severe impact, may jeopardize project success)"
                },
                "sample_risks": [
                    {
                        "title": "Key Team Member Unavailability",
                        "description": "Critical team members may become unavailable due to competing priorities or departure",
                        "category": "Resource Risk",
                        "probability": "medium",
                        "impact": "high",
                        "risk_score": 12,
                        "mitigation_strategy": "Cross-training team members, maintaining detailed documentation, identifying backup resources",
                        "contingency_plan": "Engage external consultants or reassign project tasks to available team members",
                        "owner": "Project Manager",
                        "status": "identified"
                    },
                    {
                        "title": "Technology Integration Issues",
                        "description": "Difficulties in integrating new technology with existing systems",
                        "category": "Technical Risk",
                        "probability": "medium",
                        "impact": "high",
                        "risk_score": 12,
                        "mitigation_strategy": "Conduct thorough technical assessment, prototype integration approach, engage vendor support",
                        "contingency_plan": "Implement phased integration approach or consider alternative technology solutions",
                        "owner": "Technical Lead",
                        "status": "identified"
                    }
                ],
                "risk_management_process": [
                    "Risk Identification: Systematic identification of potential risks",
                    "Risk Analysis: Assess probability and impact of each risk",
                    "Risk Prioritization: Rank risks by risk score (probability × impact)",
                    "Risk Response Planning: Develop mitigation and contingency strategies",
                    "Risk Monitoring: Regular review and update of risk status",
                    "Risk Communication: Report risks to stakeholders and management"
                ]
            }
        },
        # Feasibility Study Templates
        {
            "id": str(uuid.uuid4()),
            "name": "Project Feasibility Study",
            "description": "Comprehensive feasibility analysis template covering technical, economic, operational, and schedule feasibility",
            "template_type": "feasibility_study",
            "industry": "General",
            "project_type": "standard",
            "is_default": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "usage_count": 0,
            "template_data": {
                "executive_summary": "Provide a high-level overview of the feasibility study findings and recommendations",
                "project_overview": {
                    "project_description": "Detailed description of the proposed project",
                    "objectives": [
                        "Primary objective 1",
                        "Primary objective 2",
                        "Primary objective 3"
                    ],
                    "scope": "Define what is included and excluded from the project scope",
                    "success_criteria": [
                        "Measurable success criteria 1",
                        "Measurable success criteria 2",
                        "Measurable success criteria 3"
                    ]
                },
                "technical_feasibility": {
                    "technology_requirements": "Required technologies, systems, and infrastructure",
                    "technical_risks": [
                        "Risk 1: Description and mitigation approach",
                        "Risk 2: Description and mitigation approach"
                    ],
                    "resource_requirements": {
                        "hardware": "Required hardware specifications",
                        "software": "Required software and licensing",
                        "personnel": "Technical expertise and skill requirements",
                        "infrastructure": "Network, security, and facility requirements"
                    },
                    "technical_assessment": "Overall technical feasibility rating and justification"
                },
                "economic_feasibility": {
                    "cost_analysis": {
                        "initial_investment": "One-time project costs",
                        "ongoing_costs": "Annual operational and maintenance costs",
                        "total_cost_of_ownership": "3-5 year total cost projection"
                    },
                    "benefit_analysis": {
                        "quantified_benefits": "Measurable financial benefits",
                        "intangible_benefits": "Non-financial benefits and value",
                        "cost_savings": "Expected cost reductions and efficiencies"
                    },
                    "financial_metrics": {
                        "roi": "Return on Investment calculation",
                        "payback_period": "Expected payback timeline",
                        "npv": "Net Present Value analysis",
                        "break_even_point": "Break-even analysis"
                    },
                    "economic_assessment": "Overall economic feasibility rating and justification"
                },
                "operational_feasibility": {
                    "organizational_readiness": "Assessment of organizational capability to implement and operate the solution",
                    "process_impact": "Impact on existing business processes and workflows",
                    "user_acceptance": "Expected user adoption and change management requirements",
                    "operational_requirements": {
                        "staffing": "Required operational staff and roles",
                        "training": "Training requirements and programs",
                        "support": "Ongoing support and maintenance needs",
                        "procedures": "New procedures and documentation needed"
                    },
                    "operational_risks": [
                        "Risk 1: User adoption challenges",
                        "Risk 2: Process disruption during implementation",
                        "Risk 3: Ongoing operational complexity"
                    ],
                    "operational_assessment": "Overall operational feasibility rating and justification"
                },
                "schedule_feasibility": {
                    "project_timeline": "High-level project schedule and major milestones",
                    "critical_path": "Key dependencies and critical path activities",
                    "resource_availability": "Assessment of resource availability and scheduling",
                    "external_dependencies": "External factors that could impact timeline",
                    "schedule_risks": [
                        "Risk 1: Resource conflicts with other initiatives",
                        "Risk 2: External vendor dependencies",
                        "Risk 3: Regulatory approval timelines"
                    ],
                    "schedule_assessment": "Overall schedule feasibility rating and justification"
                },
                "alternative_analysis": [
                    {
                        "alternative": "Do Nothing",
                        "description": "Maintain current state",
                        "pros": ["No investment required", "No disruption"],
                        "cons": ["Continued inefficiencies", "Competitive disadvantage"]
                    },
                    {
                        "alternative": "Phased Implementation",
                        "description": "Implement in multiple phases",
                        "pros": ["Lower initial investment", "Reduced risk"],
                        "cons": ["Longer timeline", "Potential integration issues"]
                    }
                ],
                "recommendations": {
                    "feasibility_rating": "Overall feasibility assessment (High/Medium/Low)",
                    "recommendation": "Recommended course of action",
                    "justification": "Rationale for the recommendation",
                    "next_steps": [
                        "Immediate next step 1",
                        "Immediate next step 2",
                        "Immediate next step 3"
                    ],
                    "success_factors": [
                        "Critical success factor 1",
                        "Critical success factor 2",
                        "Critical success factor 3"
                    ]
                }
            }
        }
    ]
    
    for template in default_templates:
        existing = await db.templates.find_one({"name": template["name"]})
        if not existing:
            await db.templates.insert_one(template)
            print(f"Default template created: {template['name']}")

async def init_sample_projects():
    """Initialize comprehensive sample projects for all phases"""
    sample_projects = [
        # PLANNING PHASE PROJECT
        {
            "id": str(uuid.uuid4()),
            "name": "Customer Portal Redesign",
            "description": "Modernize the customer portal with improved UX/UI, mobile responsiveness, and enhanced security features. Focus on user experience optimization and performance improvements.",
            "status": ProjectStatus.PLANNING,
            "priority": Priority.HIGH,
            "start_date": datetime(2025, 2, 1, 0, 0, 0, tzinfo=timezone.utc),
            "end_date": datetime(2025, 8, 31, 0, 0, 0, tzinfo=timezone.utc),
            "budget": 250000.0,
            "stakeholders": ["Sarah Johnson", "Michael Chen", "UX Team", "Security Team"],
            "tags": ["web_development", "ux_design", "security", "mobile"],
            "project_manager_id": "",  # Will be set to PM demo user
            "created_by": "",  # Will be set to PM demo user
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completion_percentage": 25.0,
            "project_type": "agile",
            "industry": "Technology",
            "complexity_level": "high",
            "team_size": 8,
            "duration_estimate": "7 months",
            "budget_range": "$200K - $300K",
            "methodology": "agile"
        },
        # EXECUTION PHASE PROJECT
        {
            "id": str(uuid.uuid4()),
            "name": "ERP System Integration",
            "description": "Integrate new ERP system with existing CRM and financial systems to streamline operations. Includes data migration, user training, and process optimization.",
            "status": ProjectStatus.EXECUTION,
            "priority": Priority.CRITICAL,
            "start_date": datetime(2024, 11, 1, 0, 0, 0, tzinfo=timezone.utc),
            "end_date": datetime(2025, 5, 30, 0, 0, 0, tzinfo=timezone.utc),
            "budget": 450000.0,
            "stakeholders": ["IT Director", "Finance Team", "Operations Manager", "External Vendor"],
            "tags": ["erp", "integration", "systems", "automation"],
            "project_manager_id": "",  # Will be set to PM demo user
            "created_by": "",  # Will be set to PM demo user
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completion_percentage": 65.0,
            "project_type": "waterfall",
            "industry": "Manufacturing",
            "complexity_level": "high",
            "team_size": 12,
            "duration_estimate": "7 months",
            "budget_range": "$400K - $500K",
            "methodology": "waterfall"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Office Space Renovation",
            "description": "Renovate headquarters office space to support hybrid work model with collaborative spaces and updated technology",
            "status": ProjectStatus.INITIATION,
            "priority": Priority.MEDIUM,
            "start_date": datetime(2025, 3, 15, 0, 0, 0, tzinfo=timezone.utc),
            "end_date": datetime(2025, 7, 15, 0, 0, 0, tzinfo=timezone.utc),
            "budget": 150000.0,
            "stakeholders": [],
            "tags": ["renovation", "facilities", "hybrid_work", "collaboration"],
            "project_manager_id": "",  # Will be set to PM demo user
            "created_by": "",  # Will be set to PM demo user
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completion_percentage": 5.0,
            "project_type": "standard",
            "industry": "General",
            "complexity_level": "medium",
            "team_size": 6,
            "duration_estimate": "4 months",
            "budget_range": "$100K - $200K",
            "methodology": "hybrid"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mobile App Development",
            "description": "Develop native mobile applications for iOS and Android to extend our services to mobile users",
            "status": ProjectStatus.COMPLETED,
            "priority": Priority.HIGH,
            "start_date": datetime(2024, 6, 1, 0, 0, 0, tzinfo=timezone.utc),
            "end_date": datetime(2024, 12, 31, 0, 0, 0, tzinfo=timezone.utc),
            "budget": 320000.0,
            "stakeholders": [],
            "tags": ["mobile", "ios", "android", "app_development"],
            "project_manager_id": "",  # Will be set to PM demo user
            "created_by": "",  # Will be set to PM demo user
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completion_percentage": 100.0,
            "project_type": "agile",
            "industry": "Technology",
            "complexity_level": "high",
            "team_size": 10,
            "duration_estimate": "7 months",
            "budget_range": "$300K - $350K",
            "methodology": "agile"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Data Migration Project",
            "description": "Migrate legacy data from multiple systems to new cloud-based data warehouse with improved analytics capabilities",
            "status": ProjectStatus.MONITORING,
            "priority": Priority.HIGH,
            "start_date": datetime(2024, 9, 1, 0, 0, 0, tzinfo=timezone.utc),
            "end_date": datetime(2025, 3, 31, 0, 0, 0, tzinfo=timezone.utc),
            "budget": 280000.0,
            "stakeholders": [],
            "tags": ["data_migration", "cloud", "analytics", "warehouse"],
            "project_manager_id": "",  # Will be set to PM demo user
            "created_by": "",  # Will be set to PM demo user
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completion_percentage": 80.0,
            "project_type": "waterfall",
            "industry": "Technology",
            "complexity_level": "high",
            "team_size": 8,
            "duration_estimate": "7 months",
            "budget_range": "$250K - $300K",
            "methodology": "waterfall"
        }
    ]
    
    # Get the PM demo user ID
    pm_user = await db.users.find_one({"email": "pm@projecthub.com"})
    if not pm_user:
        print("PM demo user not found, skipping sample projects")
        return
    
    pm_id = pm_user["id"]
    
    # Set PM as project manager and creator for all sample projects
    for project in sample_projects:
        project["project_manager_id"] = pm_id
        project["created_by"] = pm_id
        
        # Check if project already exists
        existing = await db.projects.find_one({"name": project["name"]})
        if not existing:
            await db.projects.insert_one(project)
            print(f"Sample project created: {project['name']}")

async def init_sample_timeline_data():
    """Initialize sample timeline tasks and milestones for demonstration"""
    
    # Get sample projects
    sample_projects = await db.projects.find({}).to_list(5)
    if not sample_projects:
        print("No projects found, skipping timeline data initialization")
        return
    
    for project in sample_projects[:2]:  # Add timeline data to first 2 projects
        project_id = project["id"]
        
        # Sample Timeline Tasks
        sample_tasks = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Project Kickoff & Requirements Gathering",
                "description": "Initiate project, gather requirements, and establish team communication",
                "start_date": datetime(2025, 1, 15, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 1, 25, 0, 0, 0, tzinfo=timezone.utc),
                "status": "completed",
                "assigned_to": "Project Manager",
                "priority": "high",
                "progress": 100,
                "estimated_hours": 40.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "System Architecture & Design",
                "description": "Design system architecture, create technical specifications, and review with stakeholders",
                "start_date": datetime(2025, 1, 26, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 2, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "pending",
                "assigned_to": "Technical Architect",
                "priority": "high",
                "progress": 75,
                "estimated_hours": 80.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Frontend Development",
                "description": "Develop user interface components, implement responsive design, and integrate with backend APIs",
                "start_date": datetime(2025, 2, 16, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 4, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "not_started",
                "assigned_to": "Frontend Team",
                "priority": "medium",
                "progress": 0,
                "estimated_hours": 240.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Backend API Development",
                "description": "Implement REST APIs, database integration, authentication, and business logic",
                "start_date": datetime(2025, 2, 1, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 4, 30, 0, 0, 0, tzinfo=timezone.utc),
                "status": "pending",
                "assigned_to": "Backend Team",
                "priority": "high",
                "progress": 45,
                "estimated_hours": 320.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Database Setup & Migration",
                "description": "Set up production database, create migration scripts, and establish backup procedures",
                "start_date": datetime(2025, 2, 1, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 2, 28, 0, 0, 0, tzinfo=timezone.utc),
                "status": "completed",
                "assigned_to": "DevOps Engineer",
                "priority": "critical",
                "progress": 100,
                "estimated_hours": 60.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Quality Assurance & Testing",
                "description": "Comprehensive testing including unit tests, integration tests, and user acceptance testing",
                "start_date": datetime(2025, 4, 16, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 5, 30, 0, 0, 0, tzinfo=timezone.utc),
                "status": "not_started",
                "assigned_to": "QA Team",
                "priority": "high",
                "progress": 0,
                "estimated_hours": 160.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Security Review & Penetration Testing",
                "description": "Security assessment, vulnerability testing, and implementation of security measures",
                "start_date": datetime(2025, 5, 1, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 5, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "not_started",
                "assigned_to": "Security Team",
                "priority": "high",
                "progress": 0,
                "estimated_hours": 80.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Deployment & Production Setup",
                "description": "Deploy to production environment, configure monitoring, and establish support procedures",
                "start_date": datetime(2025, 6, 1, 0, 0, 0, tzinfo=timezone.utc),
                "end_date": datetime(2025, 6, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "not_started",
                "assigned_to": "DevOps Team",
                "priority": "critical",
                "progress": 0,
                "estimated_hours": 40.0,
                "dependencies": [],
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]
        
        # Sample Milestones
        sample_milestones = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Project Charter Approved",
                "description": "Project charter reviewed and approved by stakeholders",
                "due_date": datetime(2025, 1, 25, 0, 0, 0, tzinfo=timezone.utc),
                "type": "checkpoint",
                "status": "completed",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Technical Design Complete",
                "description": "System architecture and technical specifications finalized",
                "due_date": datetime(2025, 2, 15, 0, 0, 0, tzinfo=timezone.utc),
                "type": "deliverable",
                "status": "pending",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Alpha Release",
                "description": "Initial working version ready for internal testing",
                "due_date": datetime(2025, 4, 30, 0, 0, 0, tzinfo=timezone.utc),
                "type": "deliverable",
                "status": "pending",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Security Clearance",
                "description": "Security review completed and clearance obtained",
                "due_date": datetime(2025, 5, 15, 0, 0, 0, tzinfo=timezone.utc),
                "type": "checkpoint",
                "status": "pending",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Production Launch",
                "description": "System deployed to production and available to end users",
                "due_date": datetime(2025, 6, 15, 0, 0, 0, tzinfo=timezone.utc),
                "type": "deadline",
                "status": "pending",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]
        
        # Insert timeline tasks
        for task in sample_tasks:
            existing_task = await db.timeline_tasks.find_one({
                "project_id": project_id, 
                "name": task["name"]
            })
            if not existing_task:
                await db.timeline_tasks.insert_one(task)
                print(f"Sample timeline task created: {task['name']} for project {project['name']}")
        
        # Insert milestones
        for milestone in sample_milestones:
            existing_milestone = await db.milestones.find_one({
                "project_id": project_id, 
                "name": milestone["name"]
            })
            if not existing_milestone:
                await db.milestones.insert_one(milestone)
                print(f"Sample milestone created: {milestone['name']} for project {project['name']}")

        # Sample Communication Plans
        sample_communication_plans = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "stakeholder_group": "Project Team",
                "information_type": "Daily Standup Updates",
                "method": "meeting",
                "frequency": "daily",
                "responsible_person": "Scrum Master",
                "audience": ["Development Team", "Product Owner", "QA Team"],
                "purpose": "Synchronize team activities, identify blockers, and plan daily work",
                "format": "15-minute standup meeting",
                "delivery_date": datetime(2025, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "stakeholder_group": "Executive Sponsors",
                "information_type": "Project Status Report",
                "method": "report",
                "frequency": "weekly",
                "responsible_person": "Project Manager",
                "audience": ["Executive Team", "Department Heads", "Key Stakeholders"],
                "purpose": "Provide high-level project status, risks, and key decisions needed",
                "format": "Executive summary document with dashboard metrics",
                "delivery_date": datetime(2025, 1, 19, 17, 0, 0, tzinfo=timezone.utc),
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "stakeholder_group": "End Users",
                "information_type": "Feature Demonstrations",
                "method": "meeting",
                "frequency": "biweekly",
                "responsible_person": "Product Owner",
                "audience": ["Business Users", "Department Representatives", "Training Team"],
                "purpose": "Demonstrate completed features and gather user feedback",
                "format": "Interactive demo sessions with Q&A",
                "delivery_date": datetime(2025, 2, 1, 14, 0, 0, tzinfo=timezone.utc),
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]

        # Sample Quality Requirements
        sample_quality_requirements = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "requirement_name": "Performance Testing Standards",
                "description": "System must handle concurrent users and respond within acceptable timeframes",
                "standard": "custom",
                "acceptance_criteria": [
                    "Response time under 2 seconds for 95% of requests",
                    "System supports 1000+ concurrent users",
                    "Database queries optimized for performance",
                    "Page load times under 3 seconds"
                ],
                "testing_approach": "Automated performance testing using JMeter and LoadRunner",
                "responsible_party": "QA Team Lead",
                "target_date": datetime(2025, 5, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "planned",
                "priority": "high",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "requirement_name": "Security Compliance",
                "description": "Application must meet security standards and data protection requirements",
                "standard": "iso_9001",
                "acceptance_criteria": [
                    "Data encryption at rest and in transit",
                    "User authentication and authorization implemented",
                    "Input validation and sanitization",
                    "Security audit and penetration testing completed"
                ],
                "testing_approach": "Security testing with automated scans and manual penetration testing",
                "responsible_party": "Security Team",
                "target_date": datetime(2025, 5, 30, 0, 0, 0, tzinfo=timezone.utc),
                "status": "planned",
                "priority": "critical",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "requirement_name": "User Experience Standards",
                "description": "Application must provide intuitive and accessible user experience",
                "standard": "agile_testing",
                "acceptance_criteria": [
                    "Responsive design for desktop, tablet, and mobile",
                    "Accessibility compliance (WCAG 2.1 AA)",
                    "User acceptance testing with >85% satisfaction",
                    "Intuitive navigation with minimal learning curve"
                ],
                "testing_approach": "User acceptance testing, accessibility audits, and usability studies",
                "responsible_party": "UX Team",
                "target_date": datetime(2025, 4, 15, 0, 0, 0, tzinfo=timezone.utc),
                "status": "in_progress",
                "priority": "medium",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]

        # Sample Procurement Items
        sample_procurement_items = [
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "item_name": "Development Tools & Software Licenses",
                "description": "Professional development tools and IDE licenses for the development team",
                "procurement_type": "software",
                "vendor": "JetBrains",
                "estimated_cost": 5000.0,
                "actual_cost": 4800.0,
                "quantity": 10,
                "unit": "licenses",
                "required_date": datetime(2025, 1, 30, 0, 0, 0, tzinfo=timezone.utc),
                "status": "ordered",
                "approval_required": True,
                "approved_by": "IT Director",
                "notes": "Annual licenses for IntelliJ IDEA Ultimate and WebStorm",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "item_name": "Cloud Infrastructure Services",
                "description": "AWS cloud services for development, staging, and production environments",
                "procurement_type": "services",
                "vendor": "Amazon Web Services",
                "estimated_cost": 15000.0,
                "actual_cost": 0.0,
                "quantity": 12,
                "unit": "months",
                "required_date": datetime(2025, 2, 1, 0, 0, 0, tzinfo=timezone.utc),
                "status": "approved",
                "approval_required": True,
                "approved_by": "CTO",
                "notes": "EC2 instances, RDS, S3, CloudFront, and monitoring services",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "item_name": "Security Testing Services",
                "description": "Professional penetration testing and security audit services",
                "procurement_type": "consulting",
                "vendor": "SecureIT Solutions",
                "estimated_cost": 25000.0,
                "actual_cost": 0.0,
                "quantity": 1,
                "unit": "project",
                "required_date": datetime(2025, 5, 1, 0, 0, 0, tzinfo=timezone.utc),
                "status": "rfq_sent",
                "approval_required": True,
                "approved_by": None,
                "notes": "Comprehensive security assessment including penetration testing and code review",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "item_name": "Project Management Training",
                "description": "Agile and Scrum training for project team members",
                "procurement_type": "training",
                "vendor": "Agile Academy",
                "estimated_cost": 8000.0,
                "actual_cost": 0.0,
                "quantity": 15,
                "unit": "participants",
                "required_date": datetime(2025, 3, 1, 0, 0, 0, tzinfo=timezone.utc),
                "status": "planned",
                "approval_required": True,
                "approved_by": None,
                "notes": "2-day intensive Scrum Master and Product Owner certification training",
                "created_by": project["created_by"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]

        # Insert communication plans
        for plan in sample_communication_plans:
            existing_plan = await db.communication_plans.find_one({
                "project_id": project_id, 
                "stakeholder_group": plan["stakeholder_group"],
                "information_type": plan["information_type"]
            })
            if not existing_plan:
                await db.communication_plans.insert_one(plan)
                print(f"Sample communication plan created: {plan['information_type']} for {plan['stakeholder_group']}")

        # Insert quality requirements
        for requirement in sample_quality_requirements:
            existing_requirement = await db.quality_requirements.find_one({
                "project_id": project_id, 
                "requirement_name": requirement["requirement_name"]
            })
            if not existing_requirement:
                await db.quality_requirements.insert_one(requirement)
                print(f"Sample quality requirement created: {requirement['requirement_name']}")

        # Insert procurement items
        for item in sample_procurement_items:
            existing_item = await db.procurement_items.find_one({
                "project_id": project_id, 
                "item_name": item["item_name"]
            })
            if not existing_item:
                await db.procurement_items.insert_one(item)
                print(f"Sample procurement item created: {item['item_name']}")


# Enhanced Resource Management endpoints
@app.get("/api/projects/{project_id}/resources")
async def get_project_resources(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all resources for a project"""
    resources = []
    cursor = db.resources.find({"project_id": project_id})
    
    async for resource in cursor:
        resource["_id"] = str(resource["_id"])
        resources.append(resource)
    
    return resources

@app.post("/api/projects/{project_id}/resources")
async def create_resource(
    project_id: str,
    resource_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new resource"""
    resource_dict = resource_data.copy()
    resource_dict.update({
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "current_allocation": 0.0
    })
    
    await db.resources.insert_one(resource_dict)
    resource_dict["_id"] = str(resource_dict["_id"])
    return resource_dict

# Critical Path Analysis endpoint
@app.get("/api/projects/{project_id}/critical-path")
async def get_critical_path_analysis(project_id: str, current_user: User = Depends(get_current_user)):
    """Get critical path analysis for a project"""
    # Get all timeline tasks
    tasks_cursor = db.timeline_tasks.find({"project_id": project_id})
    tasks = []
    async for task in tasks_cursor:
        task["_id"] = str(task["_id"])
        tasks.append(task)
    
    if not tasks:
        return {"critical_path_tasks": [], "project_duration": 0, "recommendations": []}
    
    # Simple critical path calculation (in a real implementation, this would be more sophisticated)
    critical_tasks = [task for task in tasks if task.get("is_critical_path", False)]
    
    # Calculate project duration
    if tasks:
        start_dates = [task.get("start_date") for task in tasks if task.get("start_date")]
        end_dates = [task.get("end_date") for task in tasks if task.get("end_date")]
        
        if start_dates and end_dates:
            earliest_start = min([datetime.fromisoformat(d.replace('Z', '+00:00')) if isinstance(d, str) else d for d in start_dates])
            latest_end = max([datetime.fromisoformat(d.replace('Z', '+00:00')) if isinstance(d, str) else d for d in end_dates])
            project_duration = (latest_end - earliest_start).days
        else:
            project_duration = 0
    else:
        project_duration = 0
    
    recommendations = []
    if len(critical_tasks) > len(tasks) * 0.7:
        recommendations.append("High number of critical path tasks - consider resource optimization")
    if project_duration > 365:
        recommendations.append("Long project duration - consider breaking into phases")
    
    return {
        "critical_path_tasks": [task["id"] for task in critical_tasks],
        "project_duration": project_duration,
        "earliest_start": min([task.get("start_date") for task in tasks if task.get("start_date")], default=None),
        "latest_finish": max([task.get("end_date") for task in tasks if task.get("end_date")], default=None),
        "recommendations": recommendations,
        "analysis_date": datetime.now(timezone.utc)
    }

# Resource Utilization endpoint
@app.get("/api/projects/{project_id}/resource-utilization")
async def get_resource_utilization(project_id: str, current_user: User = Depends(get_current_user)):
    """Get resource utilization analysis for a project"""
    # Get all timeline tasks with resources
    tasks_cursor = db.timeline_tasks.find({"project_id": project_id})
    resource_utilization = {}
    
    async for task in tasks_cursor:
        if task.get("resources"):
            for resource in task["resources"]:
                resource_name = resource.get("resource_name", "Unknown")
                allocation = resource.get("allocation_percentage", 0)
                cost_per_hour = resource.get("cost_per_hour", 0)
                
                if resource_name not in resource_utilization:
                    resource_utilization[resource_name] = {
                        "total_allocation": 0,
                        "total_cost": 0,
                        "tasks": [],
                        "resource_type": resource.get("resource_type", "human"),
                        "skills": resource.get("skills", [])
                    }
                
                resource_utilization[resource_name]["total_allocation"] += allocation
                resource_utilization[resource_name]["total_cost"] += (allocation / 100) * cost_per_hour * task.get("estimated_hours", 0)
                resource_utilization[resource_name]["tasks"].append({
                    "task_id": task["id"],
                    "task_name": task["name"],
                    "allocation": allocation
                })
    
    # Calculate utilization status
    for resource_name, data in resource_utilization.items():
        if data["total_allocation"] > 100:
            data["status"] = "overallocated"
        elif data["total_allocation"] > 80:
            data["status"] = "high_utilization"
        elif data["total_allocation"] > 50:
            data["status"] = "moderate_utilization"
        else:
            data["status"] = "low_utilization"
    
    return {
        "resource_utilization": resource_utilization,
        "summary": {
            "total_resources": len(resource_utilization),
            "overallocated": len([r for r in resource_utilization.values() if r.get("status") == "overallocated"]),
            "total_cost": sum([r["total_cost"] for r in resource_utilization.values()])
        }
    }

# Enhanced milestone endpoints
@app.get("/api/projects/{project_id}/milestones")
async def get_project_milestones(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all milestones for a project"""
    milestones = []
    cursor = db.milestones.find({"project_id": project_id})
    
    async for milestone in cursor:
        milestone["_id"] = str(milestone["_id"])
        milestones.append(milestone)
    
    return milestones

@app.post("/api/projects/{project_id}/milestones")
async def create_milestone(
    project_id: str,
    milestone_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new milestone"""
    milestone_dict = milestone_data.copy()
    milestone_dict.update({
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })
    
    await db.milestones.insert_one(milestone_dict)
    milestone_dict["_id"] = str(milestone_dict["_id"])
    return milestone_dict
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    await init_demo_users()
    await init_default_templates()
    await init_sample_projects()
    await init_sample_timeline_data()
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
async def get_projects(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get projects for the authenticated user, optionally filtered by status"""
    try:
        # Build base query based on user role
        if current_user.role in ["project_manager", "executive"]:
            # Project managers and executives can see all projects
            base_query = {}
        else:
            # Team members and stakeholders see projects where they are involved
            base_query = {
                "$or": [
                    {"project_manager_id": current_user.id},
                    {"stakeholders": current_user.id},
                    {"created_by": current_user.id}
                ]
            }
        
        # Add status filter if provided
        if status:
            base_query["status"] = status
        
        projects_cursor = db.projects.find(base_query)
        
        projects = []
        async for project_doc in projects_cursor:
            project_doc["id"] = project_doc["_id"]
            del project_doc["_id"]
            projects.append(project_doc)
        
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@app.get("/api/projects/by-module/{module_name}", response_model=List[Project])
async def get_projects_by_module(
    module_name: str,
    current_user: User = Depends(get_current_user)
):
    """Get projects relevant to a specific PMO module"""
    try:
        # Define which project statuses are relevant for each module
        module_status_mapping = {
            "initiation": ["initiation"],
            "planning": ["initiation", "planning"],  # Can plan projects that completed initiation
            "execution": ["planning", "execution"],  # Can execute projects that completed planning
            "monitoring": ["execution", "monitoring", "closure"],
            "closure": ["closure", "completed"]
        }
        
        relevant_statuses = module_status_mapping.get(module_name, [])
        if not relevant_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid module name: {module_name}")
        
        # Build query based on user role
        if current_user.role in ["project_manager", "executive"]:
            base_query = {"status": {"$in": relevant_statuses}}
        else:
            base_query = {
                "$and": [
                    {"status": {"$in": relevant_statuses}},
                    {
                        "$or": [
                            {"project_manager_id": current_user.id},
                            {"stakeholders": current_user.id},
                            {"created_by": current_user.id}
                        ]
                    }
                ]
            }
        
        projects_cursor = db.projects.find(base_query)
        
        projects = []
        async for project_doc in projects_cursor:
            project_doc["id"] = project_doc["_id"]
            del project_doc["_id"]
            projects.append(project_doc)
        
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects by module: {str(e)}")

@app.put("/api/projects/{project_id}/status")
async def update_project_status(
    project_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update project status with workflow validation"""
    try:
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        # Validate status transition workflow
        valid_transitions = {
            "initiation": ["planning", "cancelled"],
            "planning": ["execution", "initiation", "cancelled"],
            "execution": ["monitoring", "planning", "cancelled"],
            "monitoring": ["closure", "execution", "cancelled"],
            "closure": ["completed", "monitoring", "cancelled"],
            "completed": [],  # Final state
            "cancelled": ["initiation"]  # Can restart cancelled projects
        }
        
        # Get current project
        project_doc = await db.projects.find_one({"_id": project_id})
        if not project_doc:
            raise HTTPException(status_code=404, detail="Project not found")
        
        current_status = project_doc.get("status", "initiation")
        
        # Check if transition is valid
        if new_status not in valid_transitions.get(current_status, []):
            allowed = ", ".join(valid_transitions.get(current_status, []))
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {current_status} to {new_status}. Allowed: {allowed}"
            )
        
        # Update project status
        result = await db.projects.update_one(
            {"_id": project_id},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Project not found or not updated")
        
        return {"message": "Project status updated successfully", "new_status": new_status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project status: {str(e)}")

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

# Enhanced Project Setup Wizard Model
class ProjectSetupWizardExtended(ProjectSetupWizardBase):
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    tags: List[str] = []
    stakeholders: List[str] = []

# Project Setup Wizard Route
@app.post("/api/project-wizard", response_model=Project)
async def create_project_from_wizard(
    wizard_data: ProjectSetupWizardExtended,
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Create comprehensive project from wizard data
    project_dict = {
        "id": str(uuid.uuid4()),
        "name": wizard_data.project_name,
        "description": wizard_data.description or f"Project created using {wizard_data.project_type} methodology",
        "status": ProjectStatus.INITIATION,
        "priority": wizard_data.priority,
        "start_date": wizard_data.start_date,
        "end_date": wizard_data.end_date,
        "budget": wizard_data.budget or 0.0,
        "stakeholders": wizard_data.stakeholders,
        "tags": wizard_data.tags + [wizard_data.project_type, wizard_data.methodology] if wizard_data.tags else [wizard_data.project_type, wizard_data.methodology],
        "project_manager_id": current_user.id,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "completion_percentage": 0.0,
        # Additional wizard fields for enhanced project metadata
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

@app.post("/api/projects/{project_id}/apply-template/{template_id}")
async def apply_template_to_project(
    project_id: str,
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Apply a template to create project documents (Charter, Business Case, etc.)"""
    # Verify project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify template exists
    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permissions
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    template_type = template["template_type"]
    template_data = template["template_data"]
    
    result = {"applied": [], "errors": []}
    
    try:
        if template_type == "project_charter":
            # Create or update project charter
            existing_charter = await db.project_charters.find_one({"project_id": project_id})
            
            charter_doc = {
                "project_id": project_id,
                "project_purpose": template_data.get("project_purpose", ""),
                "project_description": template_data.get("project_description", ""),
                "project_objectives": template_data.get("project_objectives", []),
                "success_criteria": template_data.get("success_criteria", []),
                "scope_inclusions": template_data.get("scope_inclusions", []),
                "scope_exclusions": template_data.get("scope_exclusions", []),
                "assumptions": template_data.get("assumptions", []),
                "constraints": template_data.get("constraints", []),
                "estimated_budget": project.get("budget", 0.0),
                "estimated_timeline": f"{project.get('start_date', '')} to {project.get('end_date', '')}",
                "key_milestones": template_data.get("key_milestones", []),
                "updated_at": datetime.now(timezone.utc)
            }
            
            if existing_charter:
                await db.project_charters.update_one(
                    {"project_id": project_id},
                    {"$set": charter_doc}
                )
                result["applied"].append("Project Charter updated")
            else:
                charter_doc.update({
                    "id": str(uuid.uuid4()),
                    "created_by": current_user.id,
                    "created_at": datetime.now(timezone.utc),
                    "status": "draft"
                })
                await db.project_charters.insert_one(charter_doc)
                result["applied"].append("Project Charter created")
        
        elif template_type == "business_case":
            # Create or update business case
            existing_case = await db.business_cases.find_one({"project_id": project_id})
            
            case_doc = {
                "project_id": project_id,
                "problem_statement": template_data.get("problem_statement", ""),
                "business_need": template_data.get("business_need", ""),
                "proposed_solution": template_data.get("proposed_solution", ""),
                "expected_benefits": template_data.get("expected_benefits", []),
                "cost_benefit_analysis": template_data.get("cost_benefit_analysis", {}),
                "risk_assessment": template_data.get("risk_assessment", []),
                "alternatives_considered": template_data.get("alternatives_considered", []),
                "recommendation": template_data.get("recommendation", ""),
                "return_on_investment": template_data.get("return_on_investment", ""),
                "updated_at": datetime.now(timezone.utc)
            }
            
            if existing_case:
                await db.business_cases.update_one(
                    {"project_id": project_id},
                    {"$set": case_doc}
                )
                result["applied"].append("Business Case updated")
            else:
                case_doc.update({
                    "id": str(uuid.uuid4()),
                    "created_by": current_user.id,
                    "created_at": datetime.now(timezone.utc),
                    "status": "draft"
                })
                await db.business_cases.insert_one(case_doc)
                result["applied"].append("Business Case created")
        
        elif template_type == "stakeholder_register":
            # Create stakeholders from template
            sample_stakeholders = template_data.get("sample_stakeholders", [])
            created_count = 0
            
            for stakeholder_template in sample_stakeholders:
                stakeholder_doc = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "name": stakeholder_template.get("name", ""),
                    "title": stakeholder_template.get("title", ""),
                    "organization": stakeholder_template.get("organization", ""),
                    "contact_email": stakeholder_template.get("contact_email", "example@company.com"),
                    "contact_phone": stakeholder_template.get("contact_phone", ""),
                    "role_in_project": stakeholder_template.get("role_in_project", ""),
                    "influence_level": stakeholder_template.get("influence_level", "medium"),
                    "interest_level": stakeholder_template.get("interest_level", "medium"),
                    "communication_preference": stakeholder_template.get("communication_preference", "email"),
                    "expectations": stakeholder_template.get("expectations", []),
                    "concerns": stakeholder_template.get("concerns", []),
                    "created_by": current_user.id,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                await db.stakeholders.insert_one(stakeholder_doc)
                created_count += 1
            
            result["applied"].append(f"Created {created_count} stakeholders from template")
        
        elif template_type in ["risk_log", "feasibility_study"]:
            # For risk log and feasibility study, we'll create a generic document
            # This could be expanded to create specific collections later
            result["applied"].append(f"Template data prepared for {template_type.replace('_', ' ').title()}")
        
        # Increment template usage count
        await db.templates.update_one(
            {"id": template_id},
            {"$inc": {"usage_count": 1}}
        )
        
        return {
            "message": "Template applied successfully",
            "template_name": template["name"],
            "template_type": template_type,
            "project_name": project["name"],
            "results": result
        }
        
    except Exception as e:
        return {
            "message": "Error applying template",
            "error": str(e),
            "template_name": template["name"],
            "template_type": template_type,
            "results": result
        }

# Module 2: Planning API Endpoints

# Work Breakdown Structure (WBS) Routes
@app.get("/api/projects/{project_id}/wbs", response_model=List[WBSTask])
async def get_project_wbs(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all WBS tasks for a project"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get WBS tasks ordered by WBS code
    wbs_tasks = await db.wbs_tasks.find({"project_id": project_id}).sort("wbs_code", 1).to_list(None)
    
    # Convert ObjectId to string
    for task in wbs_tasks:
        task["_id"] = str(task["_id"])
    
    return [WBSTask(**task) for task in wbs_tasks]

@app.post("/api/projects/{project_id}/wbs", response_model=WBSTask)
async def create_wbs_task(
    project_id: str,
    task_data: WBSTaskBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new WBS task"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Ensure project_id matches
    task_data.project_id = project_id
    
    # Generate unique ID
    task_id = str(uuid.uuid4())
    
    # Create task document
    task_doc = {
        "id": task_id,
        **task_data.dict(),
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "completion_percentage": 0.0
    }
    
    # Insert into database
    await db.wbs_tasks.insert_one(task_doc)
    
    # Return created task
    task_doc["_id"] = str(task_doc.get("_id"))
    return WBSTask(**task_doc)

@app.put("/api/wbs/{task_id}", response_model=WBSTask)
async def update_wbs_task(
    task_id: str,
    task_data: WBSTaskBase,
    current_user: User = Depends(get_current_user)
):
    """Update a WBS task"""
    # Check if task exists
    existing_task = await db.wbs_tasks.find_one({"id": task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="WBS task not found")
    
    # Update task
    update_data = {
        **task_data.dict(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.wbs_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    # Return updated task
    updated_task = await db.wbs_tasks.find_one({"id": task_id})
    updated_task["_id"] = str(updated_task["_id"])
    return WBSTask(**updated_task)

@app.delete("/api/wbs/{task_id}")
async def delete_wbs_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a WBS task"""
    # Check if task exists
    existing_task = await db.wbs_tasks.find_one({"id": task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="WBS task not found")
    
    # Delete task
    await db.wbs_tasks.delete_one({"id": task_id})
    
    return {"message": "WBS task deleted successfully"}

# Timeline & Gantt Chart Models
class TimelineTaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class TimelineTaskBase(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    status: TimelineTaskStatus = TimelineTaskStatus.NOT_STARTED
    progress: int = 0  # 0-100
    dependencies: List[str] = []  # List of task IDs
    priority: Priority = Priority.MEDIUM
    estimated_hours: float = 0.0

class TimelineTask(TimelineTaskBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

class MilestoneType(str, Enum):
    DELIVERABLE = "deliverable"
    CHECKPOINT = "checkpoint"
    DEADLINE = "deadline"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class MilestoneBase(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    due_date: datetime
    type: MilestoneType = MilestoneType.DELIVERABLE
    status: MilestoneStatus = MilestoneStatus.PENDING

class Milestone(MilestoneBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

# Risk Management Routes
@app.get("/api/projects/{project_id}/risks", response_model=List[Risk])
async def get_project_risks(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all risks for a project"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get risks
    risks = await db.risks.find({"project_id": project_id}).to_list(None)
    
    # Convert ObjectId to string and calculate risk score
    for risk in risks:
        risk["_id"] = str(risk["_id"])
        # Calculate risk score (simple 1-5 scale)
        prob_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
        impact_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
        risk["risk_score"] = prob_score.get(risk["probability"], 3) * impact_score.get(risk["impact"], 3)
    
    return [Risk(**risk) for risk in risks]

@app.post("/api/projects/{project_id}/risks", response_model=Risk)
async def create_risk(
    project_id: str,
    risk_data: RiskBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new risk"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Ensure project_id matches
    risk_data.project_id = project_id
    
    # Generate unique ID
    risk_id = str(uuid.uuid4())
    
    # Calculate risk score
    prob_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    impact_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    risk_score = prob_score.get(risk_data.probability, 3) * impact_score.get(risk_data.impact, 3)
    
    # Create risk document
    risk_doc = {
        "id": risk_id,
        **risk_data.dict(),
        "risk_score": risk_score,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Insert into database
    await db.risks.insert_one(risk_doc)
    
    # Return created risk
    risk_doc["_id"] = str(risk_doc.get("_id"))
    return Risk(**risk_doc)

# Budget Planning Routes
@app.get("/api/projects/{project_id}/budget", response_model=List[BudgetItem])
async def get_project_budget(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all budget items for a project"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get budget items
    budget_items = await db.budget_items.find({"project_id": project_id}).to_list(None)
    
    # Convert ObjectId to string
    for item in budget_items:
        item["_id"] = str(item["_id"])
    
    return [BudgetItem(**item) for item in budget_items]

@app.post("/api/projects/{project_id}/budget", response_model=BudgetItem)
async def create_budget_item(
    project_id: str,
    budget_data: BudgetItemBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new budget item"""
    # Verify project access
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Ensure project_id matches
    budget_data.project_id = project_id
    
    # Generate unique ID
    budget_id = str(uuid.uuid4())
    
    # Create budget document
    budget_doc = {
        "id": budget_id,
        **budget_data.dict(),
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Insert into database
    await db.budget_items.insert_one(budget_doc)
    
    # Return created budget item
    budget_doc["_id"] = str(budget_doc.get("_id"))
    return BudgetItem(**budget_doc)

# Risk Management Routes
@app.post("/api/risks", response_model=Risk)
async def create_risk(
    risk_data: RiskBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new project risk"""
    # Check if project exists
    project = await db.projects.find_one({"id": risk_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Calculate risk score
    probability_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    impact_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    
    prob_score = probability_score.get(risk_data.probability, 3)
    imp_score = impact_score.get(risk_data.impact, 3)
    calculated_risk_score = prob_score * imp_score

    risk_dict = risk_data.dict()
    risk_dict["id"] = str(uuid.uuid4())
    risk_dict["risk_score"] = calculated_risk_score
    risk_dict["created_by"] = current_user.id
    risk_dict["created_at"] = datetime.now(timezone.utc)
    risk_dict["updated_at"] = datetime.now(timezone.utc)

    await db.risks.insert_one(risk_dict)
    risk_dict["_id"] = str(risk_dict.get("_id"))

    return Risk(**risk_dict)

@app.get("/api/risks/project/{project_id}", response_model=List[Risk])
async def get_project_risks(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all risks for a project"""
    risks = []
    cursor = db.risks.find({"project_id": project_id})

    async for risk in cursor:
        risk["_id"] = str(risk["_id"])
        risks.append(Risk(**risk))

    return risks

@app.put("/api/risks/{risk_id}", response_model=Risk)
async def update_risk(
    risk_id: str,
    risk_update: RiskBase,
    current_user: User = Depends(get_current_user)
):
    """Update a project risk"""
    risk = await db.risks.find_one({"id": risk_id})

    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")

    # Recalculate risk score
    probability_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    impact_score = {"very_low": 1, "low": 2, "medium": 3, "high": 4, "very_high": 5}
    
    prob_score = probability_score.get(risk_update.probability, 3)
    imp_score = impact_score.get(risk_update.impact, 3)
    calculated_risk_score = prob_score * imp_score

    update_dict = risk_update.dict(exclude_unset=True)
    update_dict["risk_score"] = calculated_risk_score
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.risks.update_one(
        {"id": risk_id},
        {"$set": update_dict}
    )

    updated_risk = await db.risks.find_one({"id": risk_id})
    updated_risk["_id"] = str(updated_risk["_id"])

    return Risk(**updated_risk)

# Project Phase Management Routes

@app.get("/api/projects/by-phase/{phase}", response_model=List[Project])
async def get_projects_by_phase(
    phase: ProjectStatus,
    current_user: User = Depends(get_current_user)
):
    """Get all projects in a specific phase"""
    try:
        projects = await db.projects.find({"status": phase}).to_list(100)
        return [Project(**project) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/projects/{project_id}/transition/{new_phase}")
async def transition_project_phase(
    project_id: str,
    new_phase: ProjectStatus,
    current_user: User = Depends(get_current_user)
):
    """Transition a project to a new phase"""
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        # Get current project
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update project status
        result = await db.projects.update_one(
            {"id": project_id},
            {
                "$set": {
                    "status": new_phase,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get updated project
        updated_project = await db.projects.find_one({"id": project_id})
        return {"message": f"Project transitioned to {new_phase}", "project": Project(**updated_project)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/available-for-phase/{target_phase}", response_model=List[Project])
async def get_projects_available_for_phase(
    target_phase: ProjectStatus,
    current_user: User = Depends(get_current_user)
):
    """Get projects available to transition to a target phase"""
    try:
        # Define valid previous phases for each target phase
        valid_previous_phases = {
            ProjectStatus.INITIATION: [],  # New projects start here
            ProjectStatus.PLANNING: [ProjectStatus.INITIATION],
            ProjectStatus.EXECUTION: [ProjectStatus.PLANNING],
            ProjectStatus.MONITORING: [ProjectStatus.EXECUTION],
            ProjectStatus.CLOSURE: [ProjectStatus.MONITORING, ProjectStatus.EXECUTION],
            ProjectStatus.COMPLETED: [ProjectStatus.CLOSURE],
            ProjectStatus.CANCELLED: [ProjectStatus.INITIATION, ProjectStatus.PLANNING, ProjectStatus.EXECUTION]
        }
        
        previous_phases = valid_previous_phases.get(target_phase, [])
        if not previous_phases:
            return []
        
        projects = await db.projects.find({"status": {"$in": previous_phases}}).to_list(100)
        return [Project(**project) for project in projects]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Timeline & Gantt Chart Routes
@app.get("/api/projects/{project_id}/timeline/tasks")
async def get_project_timeline_tasks(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all timeline tasks for a project"""
    tasks = []
    cursor = db.timeline_tasks.find({"project_id": project_id})

    async for task in cursor:
        task["_id"] = str(task["_id"])
        # Fix status if needed
        if task.get("status") == "pending":
            task["status"] = "not_started"
        tasks.append(task)

    return tasks

@app.post("/api/projects/{project_id}/timeline/tasks", response_model=TimelineTask)
async def create_timeline_task(
    project_id: str,
    task_data: TimelineTaskBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new timeline task"""
    # Ensure project_id matches
    task_data.project_id = project_id

    task_dict = task_data.dict()
    task_dict["id"] = str(uuid.uuid4())
    task_dict["created_by"] = current_user.id
    task_dict["created_at"] = datetime.now(timezone.utc)
    task_dict["updated_at"] = datetime.now(timezone.utc)

    await db.timeline_tasks.insert_one(task_dict)
    task_dict["_id"] = str(task_dict.get("_id"))

    return TimelineTask(**task_dict)

@app.put("/api/projects/{project_id}/timeline/tasks/{task_id}", response_model=TimelineTask)
async def update_timeline_task(
    project_id: str,
    task_id: str,
    task_update: TimelineTaskBase,
    current_user: User = Depends(get_current_user)
):
    """Update a timeline task"""
    task = await db.timeline_tasks.find_one({"id": task_id, "project_id": project_id})

    if not task:
        raise HTTPException(status_code=404, detail="Timeline task not found")

    update_dict = task_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.timeline_tasks.update_one(
        {"id": task_id},
        {"$set": update_dict}
    )

    updated_task = await db.timeline_tasks.find_one({"id": task_id})
    updated_task["_id"] = str(updated_task["_id"])

    return TimelineTask(**updated_task)

@app.delete("/api/projects/{project_id}/timeline/tasks/{task_id}")
async def delete_timeline_task(
    project_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a timeline task"""
    task = await db.timeline_tasks.find_one({"id": task_id, "project_id": project_id})

    if not task:
        raise HTTPException(status_code=404, detail="Timeline task not found")

    await db.timeline_tasks.delete_one({"id": task_id})
    return {"message": "Timeline task deleted successfully"}

# Milestone Routes
@app.get("/api/projects/{project_id}/timeline/milestones", response_model=List[Milestone])
async def get_project_milestones(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all milestones for a project"""
    milestones = []
    cursor = db.milestones.find({"project_id": project_id})

    async for milestone in cursor:
        milestone["_id"] = str(milestone["_id"])
        milestones.append(Milestone(**milestone))

    return milestones

@app.post("/api/projects/{project_id}/timeline/milestones", response_model=Milestone)
async def create_milestone(
    project_id: str,
    milestone_data: MilestoneBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new milestone"""
    # Ensure project_id matches
    milestone_data.project_id = project_id

    milestone_dict = milestone_data.dict()
    milestone_dict["id"] = str(uuid.uuid4())
    milestone_dict["created_by"] = current_user.id
    milestone_dict["created_at"] = datetime.now(timezone.utc)
    milestone_dict["updated_at"] = datetime.now(timezone.utc)

    await db.milestones.insert_one(milestone_dict)
    milestone_dict["_id"] = str(milestone_dict.get("_id"))

    return Milestone(**milestone_dict)

@app.put("/api/projects/{project_id}/timeline/milestones/{milestone_id}", response_model=Milestone)
async def update_milestone(
    project_id: str,
    milestone_id: str,
    milestone_update: MilestoneBase,
    current_user: User = Depends(get_current_user)
):
    """Update a milestone"""
    milestone = await db.milestones.find_one({"id": milestone_id, "project_id": project_id})

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_dict = milestone_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.milestones.update_one(
        {"id": milestone_id},
        {"$set": update_dict}
    )

    updated_milestone = await db.milestones.find_one({"id": milestone_id})
    updated_milestone["_id"] = str(updated_milestone["_id"])

    return Milestone(**updated_milestone)

@app.delete("/api/projects/{project_id}/timeline/milestones/{milestone_id}")
async def delete_milestone(
    project_id: str,
    milestone_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a milestone"""
    milestone = await db.milestones.find_one({"id": milestone_id, "project_id": project_id})

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    await db.milestones.delete_one({"id": milestone_id})
    return {"message": "Milestone deleted successfully"}

# Communication Plan Routes
@app.get("/api/projects/{project_id}/communication-plans", response_model=List[CommunicationPlan])
async def get_project_communication_plans(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all communication plans for a project"""
    communication_plans = []
    cursor = db.communication_plans.find({"project_id": project_id})
    
    async for plan in cursor:
        plan["_id"] = str(plan["_id"])
        communication_plans.append(CommunicationPlan(**plan))
    
    return communication_plans

@app.post("/api/projects/{project_id}/communication-plans", response_model=CommunicationPlan)
async def create_communication_plan(
    project_id: str,
    plan_data: CommunicationPlanBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new communication plan"""
    # Ensure project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plan_data.project_id = project_id
    
    plan_dict = plan_data.dict()
    plan_dict["id"] = str(uuid.uuid4())
    plan_dict["created_by"] = current_user.id
    plan_dict["created_at"] = datetime.now(timezone.utc)
    plan_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.communication_plans.insert_one(plan_dict)
    plan_dict["_id"] = str(plan_dict.get("_id"))
    
    return CommunicationPlan(**plan_dict)

@app.put("/api/projects/{project_id}/communication-plans/{plan_id}", response_model=CommunicationPlan)
async def update_communication_plan(
    project_id: str,
    plan_id: str,
    plan_update: CommunicationPlanBase,
    current_user: User = Depends(get_current_user)
):
    """Update a communication plan"""
    plan = await db.communication_plans.find_one({"id": plan_id, "project_id": project_id})
    
    if not plan:
        raise HTTPException(status_code=404, detail="Communication plan not found")
    
    update_dict = plan_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.communication_plans.update_one(
        {"id": plan_id},
        {"$set": update_dict}
    )
    
    updated_plan = await db.communication_plans.find_one({"id": plan_id})
    updated_plan["_id"] = str(updated_plan["_id"])
    
    return CommunicationPlan(**updated_plan)

@app.delete("/api/projects/{project_id}/communication-plans/{plan_id}")
async def delete_communication_plan(
    project_id: str,
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a communication plan"""
    plan = await db.communication_plans.find_one({"id": plan_id, "project_id": project_id})
    
    if not plan:
        raise HTTPException(status_code=404, detail="Communication plan not found")
    
    await db.communication_plans.delete_one({"id": plan_id})
    return {"message": "Communication plan deleted successfully"}

# Quality Requirements Routes
@app.get("/api/projects/{project_id}/quality-requirements", response_model=List[QualityRequirement])
async def get_project_quality_requirements(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all quality requirements for a project"""
    quality_requirements = []
    cursor = db.quality_requirements.find({"project_id": project_id})
    
    async for requirement in cursor:
        requirement["_id"] = str(requirement["_id"])
        quality_requirements.append(QualityRequirement(**requirement))
    
    return quality_requirements

@app.post("/api/projects/{project_id}/quality-requirements", response_model=QualityRequirement)
async def create_quality_requirement(
    project_id: str,
    requirement_data: QualityRequirementBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new quality requirement"""
    # Ensure project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    requirement_data.project_id = project_id
    
    requirement_dict = requirement_data.dict()
    requirement_dict["id"] = str(uuid.uuid4())
    requirement_dict["created_by"] = current_user.id
    requirement_dict["created_at"] = datetime.now(timezone.utc)
    requirement_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.quality_requirements.insert_one(requirement_dict)
    requirement_dict["_id"] = str(requirement_dict.get("_id"))
    
    return QualityRequirement(**requirement_dict)

@app.put("/api/projects/{project_id}/quality-requirements/{requirement_id}", response_model=QualityRequirement)
async def update_quality_requirement(
    project_id: str,
    requirement_id: str,
    requirement_update: QualityRequirementBase,
    current_user: User = Depends(get_current_user)
):
    """Update a quality requirement"""
    requirement = await db.quality_requirements.find_one({"id": requirement_id, "project_id": project_id})
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Quality requirement not found")
    
    update_dict = requirement_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.quality_requirements.update_one(
        {"id": requirement_id},
        {"$set": update_dict}
    )
    
    updated_requirement = await db.quality_requirements.find_one({"id": requirement_id})
    updated_requirement["_id"] = str(updated_requirement["_id"])
    
    return QualityRequirement(**updated_requirement)

@app.delete("/api/projects/{project_id}/quality-requirements/{requirement_id}")
async def delete_quality_requirement(
    project_id: str,
    requirement_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a quality requirement"""
    requirement = await db.quality_requirements.find_one({"id": requirement_id, "project_id": project_id})
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Quality requirement not found")
    
    await db.quality_requirements.delete_one({"id": requirement_id})
    return {"message": "Quality requirement deleted successfully"}

# Procurement Items Routes
@app.get("/api/projects/{project_id}/procurement-items", response_model=List[ProcurementItem])
async def get_project_procurement_items(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all procurement items for a project"""
    procurement_items = []
    cursor = db.procurement_items.find({"project_id": project_id})
    
    async for item in cursor:
        item["_id"] = str(item["_id"])
        procurement_items.append(ProcurementItem(**item))
    
    return procurement_items

@app.post("/api/projects/{project_id}/procurement-items", response_model=ProcurementItem)
async def create_procurement_item(
    project_id: str,
    item_data: ProcurementItemBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new procurement item"""
    # Ensure project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    item_data.project_id = project_id
    
    item_dict = item_data.dict()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["created_by"] = current_user.id
    item_dict["created_at"] = datetime.now(timezone.utc)
    item_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.procurement_items.insert_one(item_dict)
    item_dict["_id"] = str(item_dict.get("_id"))
    
    return ProcurementItem(**item_dict)

@app.put("/api/projects/{project_id}/procurement-items/{item_id}", response_model=ProcurementItem)
async def update_procurement_item(
    project_id: str,
    item_id: str,
    item_update: ProcurementItemBase,
    current_user: User = Depends(get_current_user)
):
    """Update a procurement item"""
    item = await db.procurement_items.find_one({"id": item_id, "project_id": project_id})
    
    if not item:
        raise HTTPException(status_code=404, detail="Procurement item not found")
    
    update_dict = item_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.procurement_items.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )
    
    updated_item = await db.procurement_items.find_one({"id": item_id})
    updated_item["_id"] = str(updated_item["_id"])
    
    return ProcurementItem(**updated_item)

@app.delete("/api/projects/{project_id}/procurement-items/{item_id}")
async def delete_procurement_item(
    project_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a procurement item"""
    item = await db.procurement_items.find_one({"id": item_id, "project_id": project_id})
    
    if not item:
        raise HTTPException(status_code=404, detail="Procurement item not found")
    
    await db.procurement_items.delete_one({"id": item_id})
    return {"message": "Procurement item deleted successfully"}

# Feasibility Study Models
class FeasibilityStudyBase(BaseModel):
    project_id: str
    executive_summary: str = ""
    project_description: str = ""
    objectives: List[str] = []
    scope: str = ""
    success_criteria: List[str] = []
    technical_feasibility: Dict[str, Any] = {}
    economic_feasibility: Dict[str, Any] = {}
    operational_feasibility: Dict[str, Any] = {}
    schedule_feasibility: Dict[str, Any] = {}
    alternative_analysis: List[Dict[str, Any]] = []
    recommendations: Dict[str, Any] = {}

class FeasibilityStudy(FeasibilityStudyBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    status: str = "draft"

# Feasibility Study Routes
@app.post("/api/feasibility-study", response_model=FeasibilityStudy)
async def create_feasibility_study(
    study_data: FeasibilityStudyBase,
    current_user: User = Depends(get_current_user)
):
    """Create a new feasibility study"""
    # Check if user has permission
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if project exists
    project = await db.projects.find_one({"id": study_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    study_dict = study_data.dict()
    study_dict["id"] = str(uuid.uuid4())
    study_dict["created_by"] = current_user.id
    study_dict["created_at"] = datetime.now(timezone.utc)
    study_dict["updated_at"] = datetime.now(timezone.utc)

    await db.feasibility_studies.insert_one(study_dict)
    study_dict["_id"] = str(study_dict.get("_id"))

    return FeasibilityStudy(**study_dict)

@app.get("/api/feasibility-study/project/{project_id}", response_model=FeasibilityStudy)
async def get_feasibility_study(project_id: str, current_user: User = Depends(get_current_user)):
    """Get feasibility study for a project"""
    study = await db.feasibility_studies.find_one({"project_id": project_id})

    if not study:
        raise HTTPException(status_code=404, detail="Feasibility study not found")

    study["_id"] = str(study["_id"])
    return FeasibilityStudy(**study)

@app.put("/api/feasibility-study/{study_id}", response_model=FeasibilityStudy)
async def update_feasibility_study(
    study_id: str,
    study_update: FeasibilityStudyBase,
    current_user: User = Depends(get_current_user)
):
    """Update a feasibility study"""
    study = await db.feasibility_studies.find_one({"id": study_id})

    if not study:
        raise HTTPException(status_code=404, detail="Feasibility study not found")

    # Check permissions
    if current_user.role not in [UserRole.PROJECT_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = study_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.feasibility_studies.update_one(
        {"id": study_id},
        {"$set": update_dict}
    )

    updated_study = await db.feasibility_studies.find_one({"id": study_id})
    updated_study["_id"] = str(updated_study["_id"])

    return FeasibilityStudy(**updated_study)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)