import logging
import os
import json
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

# Robust CORS Configuration to handle env string representations and lists cleanly
raw_origins = os.environ.get("ALLOWED_ORIGINS") or settings.ALLOWED_ORIGINS
origins = []

if isinstance(raw_origins, str):
    raw_origins = raw_origins.strip()
    if raw_origins.startswith("[") and raw_origins.endswith("]"):
        try:
            origins = json.loads(raw_origins)
        except Exception:
            # Fallback for single-quoted or unparsable arrays
            origins = [o.strip(" '\"") for o in raw_origins[1:-1].split(",") if o.strip()]
    else:
        # Check if comma-separated
        origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
elif isinstance(raw_origins, list):
    origins = list(raw_origins)

# Exclude wildcard from origins if credentials are required
origins = [o for o in origins if o != "*"]

# Guarantee production and local development origins are whitelisted
fallback_origins = [
    "https://pixit-frontend.onrender.com",
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

import socket
instance_name = os.environ.get("INSTANCE_NAME", socket.gethostname())

@app.middleware("http")
async def add_backend_header(request, call_next):
    logger.info(f"Instance '{instance_name}' handling request: {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["X-Backend-Server"] = instance_name
    return response

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
