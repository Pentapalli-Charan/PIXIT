from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db

router = APIRouter()

@router.get("/")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Perform live query check against PostgreSQL
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "PIXIT API",
        "version": "1.0.0",
        "database": db_status
    }
