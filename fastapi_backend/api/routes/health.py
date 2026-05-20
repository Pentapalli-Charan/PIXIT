from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "PIXIT API",
        "version": "1.0.0"
    }
