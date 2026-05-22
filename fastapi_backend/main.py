import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from api.routes import auth, upload, health
from core.config import settings
from core.database import verify_db_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pixit.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend for PIXIT standardized on PostgreSQL"
)

# CORS Configuration
# Spec: Access-Control-Allow-Origin cannot be "*" when Access-Control-Allow-Credentials is true.
# We must filter out "*" and declare explicit allowed origins.
origins = []
for origin in settings.ALLOWED_ORIGINS:
    # If the setting was read as a string representation of a list, clean it up
    cleaned = origin.strip("[]'\" ")
    if cleaned == "*":
        continue
    if cleaned:
        origins.append(cleaned)

# Fallbacks for standard local development ports
fallback_origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000", 
    "http://localhost:80"
]
for fallback in fallback_origins:
    if fallback not in origins:
        origins.append(fallback)

logger.info(f"CORS origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# Instrument with Prometheus metrics
Instrumentator().instrument(app).expose(app)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing PIXIT API Lifespan...")
    db_connected = verify_db_connection()
    if db_connected:
        logger.info("Startup Check: PostgreSQL connection verified.")
    else:
        logger.error("Startup Check: DATABASE IS OFFLINE OR UNREACHABLE. Check settings.")
