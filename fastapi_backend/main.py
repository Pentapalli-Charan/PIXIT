from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from api.routes import auth, upload, health

from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend for PIXIT"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
