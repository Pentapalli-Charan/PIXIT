from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from api.dependencies import get_current_user
from services.image_service import ImageService
from core.database import User

router = APIRouter()

@router.post("/")
async def upload_image(
    request: Request,
    image: UploadFile = File(...), 
    style: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image")
        
    try:
        processed_url = await ImageService.process_image(image, style, request)
        return {"processed_url": processed_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
