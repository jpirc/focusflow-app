"""
FocusFlow API - FastAPI Backend
Visual Planning App for ADHD/Neurodivergent Users
"""

from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, date, timedelta
from uuid import UUID, uuid4
import os
import json
import httpx
from enum import Enum

# ============================================
# CONFIGURATION
# ============================================

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./focusflow.db")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ============================================
# APP INITIALIZATION
# ============================================

app = FastAPI(
    title="FocusFlow API",
    description="Visual Planning App Backend",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ============================================
# ENUMS
# ============================================

class TimeBlock(str, Enum):
    ANYTIME = "anytime"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    CARRIED_OVER = "carried-over"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class EnergyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKDAYS = "weekdays"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

# ============================================
# PYDANTIC MODELS
# ============================================

class SubtaskBase(BaseModel):
    title: str
    completed: bool = False

class Subtask(SubtaskBase):
    id: UUID = Field(default_factory=uuid4)

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    date: Optional[date] = None  # None = inbox/unscheduled
    time_block: TimeBlock = TimeBlock.ANYTIME
    estimated_minutes: int = 30
    priority: Priority = Priority.MEDIUM
    energy_level: EnergyLevel = EnergyLevel.MEDIUM
    icon: str = "target"
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_days: Optional[List[int]] = None  # For custom recurrence

class TaskCreate(TaskBase):
    subtasks: Optional[List[SubtaskBase]] = []
    depends_on: Optional[List[str]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    date: Optional[date] = None
    time_block: Optional[TimeBlock] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    priority: Optional[Priority] = None
    energy_level: Optional[EnergyLevel] = None
    icon: Optional[str] = None
    status: Optional[TaskStatus] = None
    subtasks: Optional[List[Subtask]] = None
    depends_on: Optional[List[str]] = None
    notes: Optional[str] = None

class Task(TaskBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: TaskStatus = TaskStatus.PENDING
    actual_minutes: Optional[int] = None
    subtasks: List[Subtask] = []
    depends_on: List[str] = []
    dependents: List[str] = []
    carried_over_from: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    color: str = "#3b82f6"
    bg_color: str = "#dbeafe"
    icon: str = "folder"
    description: Optional[str] = None

class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIBreakdownRequest(BaseModel):
    task_title: str
    task_description: Optional[str] = None
    estimated_minutes: Optional[int] = None
    context: Optional[str] = None  # Additional context about the task

class AIBreakdownResponse(BaseModel):
    subtasks: List[dict]  # {title, estimated_minutes, energy_level, tips}
    total_estimated_minutes: int
    suggested_approach: str
    motivation_tip: str

class AIScheduleRequest(BaseModel):
    tasks: List[dict]
    date: date
    preferences: Optional[dict] = None  # energy patterns, break preferences

class MoveTaskRequest(BaseModel):
    task_id: str
    target_date: Optional[date] = None
    target_time_block: Optional[TimeBlock] = None

class LinkTasksRequest(BaseModel):
    parent_task_id: str
    dependent_task_id: str

class UserPreferences(BaseModel):
    theme: str = "light"
    default_task_duration: int = 30
    morning_start: str = "06:00"
    afternoon_start: str = "12:00"
    evening_start: str = "17:00"
    high_energy_time: TimeBlock = TimeBlock.MORNING
    enable_sounds: bool = True
    enable_animations: bool = True

# ============================================
# IN-MEMORY STORAGE (Replace with DB in production)
# ============================================

# For demo purposes - replace with SQLAlchemy in production
tasks_db: dict[str, Task] = {}
projects_db: dict[str, Project] = {}
users_db: dict[str, dict] = {}

# Initialize default projects
DEFAULT_PROJECTS = [
    {"id": "work", "name": "Work", "color": "#2563eb", "bg_color": "#dbeafe", "icon": "briefcase", "user_id": "demo"},
    {"id": "health", "name": "Health & Fitness", "color": "#059669", "bg_color": "#d1fae5", "icon": "dumbbell", "user_id": "demo"},
    {"id": "learning", "name": "Learning", "color": "#7c3aed", "bg_color": "#ede9fe", "icon": "book", "user_id": "demo"},
    {"id": "personal", "name": "Personal", "color": "#ec4899", "bg_color": "#fce7f3", "icon": "heart", "user_id": "demo"},
    {"id": "home", "name": "Home", "color": "#f59e0b", "bg_color": "#fef3c7", "icon": "home", "user_id": "demo"},
]

for p in DEFAULT_PROJECTS:
    projects_db[p["id"]] = Project(**p)

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from JWT token - simplified for demo"""
    # In production, validate JWT and extract user_id
    return "demo"

def update_dependents(task_id: str):
    """Update dependent tasks when a task changes"""
    task = tasks_db.get(task_id)
    if not task:
        return
    
    # Find all tasks that depend on this one
    for other_task in tasks_db.values():
        if task_id in other_task.depends_on:
            if task_id not in other_task.dependents:
                other_task.dependents.append(task_id)

# ============================================
# API ROUTES - TASKS
# ============================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/tasks", response_model=List[Task])
async def get_tasks(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    project_id: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    include_inbox: bool = True,
    user_id: str = Depends(get_current_user)
):
    """Get all tasks with optional filters"""
    tasks = list(tasks_db.values())
    
    if date_from:
        tasks = [t for t in tasks if t.date and t.date >= date_from]
    if date_to:
        tasks = [t for t in tasks if t.date and t.date <= date_to]
    if project_id:
        tasks = [t for t in tasks if t.project_id == project_id]
    if status:
        tasks = [t for t in tasks if t.status == status]
    if not include_inbox:
        tasks = [t for t in tasks if t.date is not None]
    
    return tasks

@app.get("/api/tasks/inbox", response_model=List[Task])
async def get_inbox_tasks(user_id: str = Depends(get_current_user)):
    """Get all unscheduled tasks (inbox)"""
    return [t for t in tasks_db.values() if t.date is None]

@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific task by ID"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, user_id: str = Depends(get_current_user)):
    """Create a new task"""
    task = Task(
        **task_data.model_dump(exclude={"subtasks", "depends_on"}),
        subtasks=[Subtask(**s.model_dump()) for s in (task_data.subtasks or [])],
        depends_on=task_data.depends_on or []
    )
    tasks_db[task.id] = task
    update_dependents(task.id)
    return task

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str, 
    task_update: TaskUpdate, 
    user_id: str = Depends(get_current_user)
):
    """Update a task"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    tasks_db[task_id] = task
    update_dependents(task_id)
    
    return task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    """Delete a task"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Remove from other tasks' dependencies
    for other_task in tasks_db.values():
        if task_id in other_task.depends_on:
            other_task.depends_on.remove(task_id)
        if task_id in other_task.dependents:
            other_task.dependents.remove(task_id)
    
    del tasks_db[task_id]

@app.post("/api/tasks/{task_id}/complete", response_model=Task)
async def complete_task(task_id: str, user_id: str = Depends(get_current_user)):
    """Mark a task as completed"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = TaskStatus.COMPLETED
    task.updated_at = datetime.utcnow()
    return task

@app.post("/api/tasks/{task_id}/start", response_model=Task)
async def start_task(task_id: str, user_id: str = Depends(get_current_user)):
    """Start working on a task"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = TaskStatus.IN_PROGRESS
    task.updated_at = datetime.utcnow()
    return task

@app.post("/api/tasks/move", response_model=Task)
async def move_task(request: MoveTaskRequest, user_id: str = Depends(get_current_user)):
    """Move a task to a different date/time block"""
    task = tasks_db.get(request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if request.target_date is not None:
        task.date = request.target_date
    if request.target_time_block is not None:
        task.time_block = request.target_time_block
    
    task.updated_at = datetime.utcnow()
    return task

@app.post("/api/tasks/link")
async def link_tasks(request: LinkTasksRequest, user_id: str = Depends(get_current_user)):
    """Create a dependency between two tasks"""
    parent = tasks_db.get(request.parent_task_id)
    dependent = tasks_db.get(request.dependent_task_id)
    
    if not parent or not dependent:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if request.parent_task_id not in dependent.depends_on:
        dependent.depends_on.append(request.parent_task_id)
    if request.dependent_task_id not in parent.dependents:
        parent.dependents.append(request.dependent_task_id)
    
    return {"status": "linked", "parent": parent.id, "dependent": dependent.id}

@app.delete("/api/tasks/link")
async def unlink_tasks(request: LinkTasksRequest, user_id: str = Depends(get_current_user)):
    """Remove a dependency between two tasks"""
    parent = tasks_db.get(request.parent_task_id)
    dependent = tasks_db.get(request.dependent_task_id)
    
    if not parent or not dependent:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if request.parent_task_id in dependent.depends_on:
        dependent.depends_on.remove(request.parent_task_id)
    if request.dependent_task_id in parent.dependents:
        parent.dependents.remove(request.dependent_task_id)
    
    return {"status": "unlinked"}

@app.post("/api/tasks/{task_id}/subtasks/{subtask_id}/toggle", response_model=Task)
async def toggle_subtask(
    task_id: str, 
    subtask_id: str, 
    user_id: str = Depends(get_current_user)
):
    """Toggle a subtask's completion status"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for subtask in task.subtasks:
        if str(subtask.id) == subtask_id:
            subtask.completed = not subtask.completed
            break
    else:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    task.updated_at = datetime.utcnow()
    return task

@app.post("/api/tasks/carry-over")
async def carry_over_tasks(
    from_date: date,
    to_date: date,
    user_id: str = Depends(get_current_user)
):
    """Carry over incomplete tasks from one day to another"""
    carried = []
    for task in tasks_db.values():
        if task.date == from_date and task.status not in [TaskStatus.COMPLETED, TaskStatus.SKIPPED]:
            task.carried_over_from = task.date
            task.date = to_date
            task.status = TaskStatus.CARRIED_OVER
            carried.append(task.id)
    
    return {"carried_over": len(carried), "task_ids": carried}

# ============================================
# API ROUTES - PROJECTS
# ============================================

@app.get("/api/projects", response_model=List[Project])
async def get_projects(user_id: str = Depends(get_current_user)):
    """Get all projects"""
    return list(projects_db.values())

@app.post("/api/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectBase, user_id: str = Depends(get_current_user)):
    """Create a new project"""
    project = Project(**project_data.model_dump(), user_id=user_id)
    projects_db[project.id] = project
    return project

@app.get("/api/projects/{project_id}/stats")
async def get_project_stats(project_id: str, user_id: str = Depends(get_current_user)):
    """Get statistics for a project"""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_tasks = [t for t in tasks_db.values() if t.project_id == project_id]
    completed = len([t for t in project_tasks if t.status == TaskStatus.COMPLETED])
    
    return {
        "project_id": project_id,
        "total_tasks": len(project_tasks),
        "completed_tasks": completed,
        "pending_tasks": len(project_tasks) - completed,
        "completion_rate": completed / len(project_tasks) if project_tasks else 0
    }

# ============================================
# API ROUTES - AI FEATURES
# ============================================

@app.post("/api/ai/breakdown", response_model=AIBreakdownResponse)
async def ai_breakdown_task(request: AIBreakdownRequest):
    """Use Claude AI to break down a task into smaller, manageable subtasks"""
    
    if not ANTHROPIC_API_KEY:
        # Return mock response if no API key
        return AIBreakdownResponse(
            subtasks=[
                {"title": f"Step 1: Get started with {request.task_title}", "estimated_minutes": 10, "energy_level": "medium", "tips": "Just open the relevant app or document"},
                {"title": "Step 2: Work on the main part", "estimated_minutes": max(15, (request.estimated_minutes or 30) - 20), "energy_level": "high", "tips": "Focus on progress, not perfection"},
                {"title": "Step 3: Review and wrap up", "estimated_minutes": 10, "energy_level": "low", "tips": "Quick check and you're done!"},
            ],
            total_estimated_minutes=request.estimated_minutes or 30,
            suggested_approach="Break it into small chunks. Start with just 5 minutes - you've got this!",
            motivation_tip="Remember: done is better than perfect. Every small step counts! 🎯"
        )
    
    # Call Claude API for intelligent breakdown
    prompt = f"""You are an ADHD-friendly task coach. Break down this task into small, actionable subtasks that reduce overwhelm and make it easy to get started.

Task: {request.task_title}
{f"Description: {request.task_description}" if request.task_description else ""}
{f"Estimated total time: {request.estimated_minutes} minutes" if request.estimated_minutes else ""}
{f"Additional context: {request.context}" if request.context else ""}

Provide a breakdown that:
1. Has a very easy first step (2-5 minutes) to overcome starting friction
2. Breaks complex parts into chunks no longer than 15-20 minutes
3. Includes natural break points
4. Suggests the energy level needed for each step (low/medium/high)
5. Adds helpful tips for ADHD brains

Respond in this exact JSON format:
{{
  "subtasks": [
    {{"title": "step description", "estimated_minutes": 10, "energy_level": "low", "tips": "helpful tip"}}
  ],
  "total_estimated_minutes": 45,
  "suggested_approach": "overall strategy in 1-2 sentences",
  "motivation_tip": "encouraging message with emoji"
}}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="AI service error")
            
            result = response.json()
            content = result["content"][0]["text"]
            
            # Parse JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                breakdown = json.loads(json_match.group())
                return AIBreakdownResponse(**breakdown)
            
    except Exception as e:
        print(f"AI breakdown error: {e}")
    
    # Fallback response
    return AIBreakdownResponse(
        subtasks=[
            {"title": f"Start: Open/prepare for {request.task_title}", "estimated_minutes": 5, "energy_level": "low", "tips": "Just get the materials ready"},
            {"title": "Do: Main work block", "estimated_minutes": max(10, (request.estimated_minutes or 30) - 10), "energy_level": "medium", "tips": "Set a timer and focus"},
            {"title": "Finish: Quick review", "estimated_minutes": 5, "energy_level": "low", "tips": "Good enough is good!"},
        ],
        total_estimated_minutes=request.estimated_minutes or 30,
        suggested_approach="Start small, build momentum. You only need to do 5 minutes to start!",
        motivation_tip="The hardest part is starting. Once you begin, momentum takes over! 💪"
    )

@app.post("/api/ai/schedule-suggestions")
async def ai_schedule_suggestions(request: AIScheduleRequest):
    """Get AI suggestions for optimal task scheduling based on energy levels"""
    
    # Simple rule-based scheduling for now
    suggestions = []
    
    high_energy_tasks = [t for t in request.tasks if t.get("energy_level") == "high" or t.get("priority") in ["high", "urgent"]]
    medium_energy_tasks = [t for t in request.tasks if t.get("energy_level") == "medium"]
    low_energy_tasks = [t for t in request.tasks if t.get("energy_level") == "low"]
    
    # Morning = high energy, Afternoon = medium, Evening = low
    for task in high_energy_tasks:
        suggestions.append({
            "task_id": task.get("id"),
            "suggested_time_block": "morning",
            "reason": "High-energy task best suited for peak morning focus"
        })
    
    for task in medium_energy_tasks:
        suggestions.append({
            "task_id": task.get("id"),
            "suggested_time_block": "afternoon",
            "reason": "Medium-energy task fits well in afternoon"
        })
    
    for task in low_energy_tasks:
        suggestions.append({
            "task_id": task.get("id"),
            "suggested_time_block": "evening",
            "reason": "Low-energy task ideal for wind-down time"
        })
    
    return {
        "date": request.date.isoformat(),
        "suggestions": suggestions,
        "tips": [
            "🌅 Schedule your most important task for morning when willpower is highest",
            "☕ Take a short break between time blocks",
            "🌙 Keep evening tasks light and enjoyable"
        ]
    }

# ============================================
# API ROUTES - SCHEDULE VIEW
# ============================================

@app.get("/api/schedule/{target_date}")
async def get_schedule(target_date: date, user_id: str = Depends(get_current_user)):
    """Get the full schedule for a specific date"""
    day_tasks = [t for t in tasks_db.values() if t.date == target_date]
    
    schedule = {
        "date": target_date.isoformat(),
        "morning": [],
        "afternoon": [],
        "evening": [],
        "anytime": []
    }
    
    for task in day_tasks:
        schedule[task.time_block.value].append(task)
    
    # Calculate stats
    total = len(day_tasks)
    completed = len([t for t in day_tasks if t.status == TaskStatus.COMPLETED])
    
    return {
        **schedule,
        "stats": {
            "total": total,
            "completed": completed,
            "progress": completed / total if total > 0 else 0
        }
    }

@app.get("/api/schedule/range")
async def get_schedule_range(
    start_date: date,
    end_date: date,
    user_id: str = Depends(get_current_user)
):
    """Get schedule for a date range"""
    schedules = {}
    current = start_date
    
    while current <= end_date:
        day_tasks = [t.model_dump() for t in tasks_db.values() if t.date == current]
        schedules[current.isoformat()] = {
            "tasks": day_tasks,
            "total": len(day_tasks),
            "completed": len([t for t in day_tasks if t["status"] == "completed"])
        }
        current += timedelta(days=1)
    
    return schedules

# ============================================
# API ROUTES - UNDO/REDO (Action History)
# ============================================

action_history: List[dict] = []
redo_stack: List[dict] = []

@app.post("/api/undo")
async def undo_action(user_id: str = Depends(get_current_user)):
    """Undo the last action"""
    if not action_history:
        raise HTTPException(status_code=400, detail="Nothing to undo")
    
    last_action = action_history.pop()
    redo_stack.append(last_action)
    
    # Restore previous state based on action type
    if last_action["type"] == "update_task":
        task_id = last_action["task_id"]
        if task_id in tasks_db:
            for key, value in last_action["previous_state"].items():
                setattr(tasks_db[task_id], key, value)
    
    return {"undone": last_action["type"], "task_id": last_action.get("task_id")}

@app.post("/api/redo")
async def redo_action(user_id: str = Depends(get_current_user)):
    """Redo the last undone action"""
    if not redo_stack:
        raise HTTPException(status_code=400, detail="Nothing to redo")
    
    action = redo_stack.pop()
    action_history.append(action)
    
    # Re-apply the action
    if action["type"] == "update_task":
        task_id = action["task_id"]
        if task_id in tasks_db:
            for key, value in action["new_state"].items():
                setattr(tasks_db[task_id], key, value)
    
    return {"redone": action["type"], "task_id": action.get("task_id")}

# ============================================
# STARTUP & DEMO DATA
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize with demo data"""
    today = date.today()
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)
    
    demo_tasks = [
        Task(
            id="t1", title="Morning Standup", description="Daily team sync", project_id="work",
            date=today, time_block=TimeBlock.MORNING, estimated_minutes=30, status=TaskStatus.COMPLETED,
            priority=Priority.MEDIUM, energy_level=EnergyLevel.MEDIUM, icon="briefcase",
            dependents=["t2"]
        ),
        Task(
            id="t2", title="Q4 Planning Document", description="Draft quarterly objectives", project_id="work",
            date=today, time_block=TimeBlock.MORNING, estimated_minutes=120, status=TaskStatus.IN_PROGRESS,
            priority=Priority.HIGH, energy_level=EnergyLevel.HIGH, icon="briefcase",
            subtasks=[
                Subtask(id=uuid4(), title="Review Q3 metrics", completed=True),
                Subtask(id=uuid4(), title="Draft objectives", completed=False),
                Subtask(id=uuid4(), title="Get stakeholder input", completed=False),
            ],
            depends_on=["t1"], dependents=["t5"]
        ),
        Task(
            id="t3", title="Gym - Upper Body", description="Chest, shoulders, triceps", project_id="health",
            date=today, time_block=TimeBlock.AFTERNOON, estimated_minutes=60, status=TaskStatus.PENDING,
            priority=Priority.MEDIUM, energy_level=EnergyLevel.HIGH, icon="dumbbell"
        ),
        Task(
            id="t4", title="Read AI Research Paper", project_id="learning",
            date=today, time_block=TimeBlock.EVENING, estimated_minutes=45, status=TaskStatus.PENDING,
            priority=Priority.LOW, energy_level=EnergyLevel.LOW, icon="book"
        ),
        Task(
            id="t5", title="Present Q4 Plan", description="Leadership review", project_id="work",
            date=tomorrow, time_block=TimeBlock.MORNING, estimated_minutes=60, status=TaskStatus.PENDING,
            priority=Priority.URGENT, energy_level=EnergyLevel.HIGH, icon="briefcase",
            depends_on=["t2"]
        ),
        Task(
            id="t6", title="Dentist Appointment", project_id="personal",
            date=tomorrow, time_block=TimeBlock.AFTERNOON, estimated_minutes=60, status=TaskStatus.PENDING,
            priority=Priority.HIGH, energy_level=EnergyLevel.LOW, icon="heart"
        ),
        Task(
            id="t7", title="Online Course Module 3", description="React Advanced Patterns", project_id="learning",
            date=tomorrow, time_block=TimeBlock.EVENING, estimated_minutes=90, status=TaskStatus.PENDING,
            priority=Priority.MEDIUM, energy_level=EnergyLevel.MEDIUM, icon="book",
            subtasks=[
                Subtask(id=uuid4(), title="Watch lecture videos", completed=False),
                Subtask(id=uuid4(), title="Complete exercises", completed=False),
            ],
            dependents=["t9"]
        ),
        Task(
            id="t8", title="Grocery Shopping", project_id="home",
            date=day_after, time_block=TimeBlock.MORNING, estimated_minutes=45, status=TaskStatus.PENDING,
            priority=Priority.MEDIUM, energy_level=EnergyLevel.MEDIUM, icon="home"
        ),
        Task(
            id="t9", title="Course Quiz", description="Module 3 assessment", project_id="learning",
            date=day_after, time_block=TimeBlock.AFTERNOON, estimated_minutes=30, status=TaskStatus.PENDING,
            priority=Priority.HIGH, energy_level=EnergyLevel.HIGH, icon="book",
            depends_on=["t7"]
        ),
        # Inbox tasks
        Task(
            id="t10", title="Research vacation destinations", project_id="personal",
            date=None, time_block=TimeBlock.ANYTIME, estimated_minutes=30, status=TaskStatus.PENDING,
            priority=Priority.LOW, energy_level=EnergyLevel.LOW, icon="heart"
        ),
        Task(
            id="t11", title="Update LinkedIn profile", project_id="work",
            date=None, time_block=TimeBlock.ANYTIME, estimated_minutes=20, status=TaskStatus.PENDING,
            priority=Priority.LOW, energy_level=EnergyLevel.LOW, icon="briefcase"
        ),
        Task(
            id="t12", title="Call mom", project_id="personal",
            date=None, time_block=TimeBlock.ANYTIME, estimated_minutes=30, status=TaskStatus.PENDING,
            priority=Priority.MEDIUM, energy_level=EnergyLevel.LOW, icon="heart"
        ),
    ]
    
    for task in demo_tasks:
        tasks_db[task.id] = task
    
    print(f"✅ Loaded {len(demo_tasks)} demo tasks")
    print(f"✅ Loaded {len(projects_db)} projects")

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
