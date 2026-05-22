from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, Query
from api.dependencies import get_current_user
from services.image_service import ImageService
from core.database import get_db, User, Project, Stylization
from sqlalchemy.orm import Session, joinedload
import json
import os

router = APIRouter()

@router.post("/")
async def upload_image(
    request: Request,
    image: UploadFile = File(...), 
    style: str = Form(...),
    settings: str = Form(None), # Optional JSON string of settings (intensity, brightness, contrast)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image")
        
    # Parse optional settings JSON
    parsed_settings = None
    if settings:
        try:
            parsed_settings = json.loads(settings)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid settings JSON format")

    try:
        # Process image using OpenCV/PIL
        original_url, processed_url = await ImageService.process_image(image, style, request, parsed_settings)
        
        # Save to database
        new_project = Project(
            user_id=current_user.id,
            title=f"Stylized {style.capitalize()}",
            original_url=original_url
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        new_stylization = Stylization(
            project_id=new_project.id,
            style_applied=style,
            processed_url=processed_url,
            settings_json=parsed_settings,
            is_public=False
        )
        db.add(new_stylization)
        db.commit()
        db.refresh(new_stylization)

        return {
            "project_id": new_project.id,
            "stylization_id": new_stylization.id,
            "title": new_project.title,
            "original_url": original_url,
            "processed_url": processed_url,
            "style": style,
            "settings": parsed_settings,
            "is_public": new_stylization.is_public
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/project/{project_id}/stylize")
async def restylize_project(
    project_id: int,
    request: Request,
    style: str = Form(...),
    settings: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch project
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    parsed_settings = None
    if settings:
        try:
            parsed_settings = json.loads(settings)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid settings JSON format")

    try:
        # Load the original file content dynamically to re-process
        # Get path on local filesystem
        orig_filename = project.original_url.split("/static/")[-1]
        orig_path = os.path.join("uploads", orig_filename)
        
        if not os.path.exists(orig_path):
            raise HTTPException(status_code=404, detail="Original image file not found on disk")

        # Mock UploadFile class for local files
        class LocalUploadFile:
            def __init__(self, path, filename):
                self.path = path
                self.filename = filename
                self.content_type = "image/jpeg" if filename.endswith(("jpg", "jpeg")) else "image/png"
            async def read(self):
                with open(self.path, "rb") as f:
                    return f.read()

        local_file = LocalUploadFile(orig_path, orig_filename)
        
        # Apply stylization
        _, processed_url = await ImageService.process_image(local_file, style, request, parsed_settings)

        # Create new stylization in DB
        new_stylization = Stylization(
            project_id=project.id,
            style_applied=style,
            processed_url=processed_url,
            settings_json=parsed_settings,
            is_public=False
        )
        db.add(new_stylization)
        db.commit()
        db.refresh(new_stylization)

        return {
            "project_id": project.id,
            "stylization_id": new_stylization.id,
            "title": project.title,
            "original_url": project.original_url,
            "processed_url": processed_url,
            "style": style,
            "settings": parsed_settings,
            "is_public": new_stylization.is_public
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id)\
        .options(joinedload(Project.stylizations))\
        .order_by(Project.updated_at.desc())\
        .all()
    
    output = []
    for proj in projects:
        stylizations_list = []
        for sty in proj.stylizations:
            stylizations_list.append({
                "id": sty.id,
                "style_applied": sty.style_applied,
                "processed_url": sty.processed_url,
                "settings": sty.settings_json,
                "is_public": sty.is_public,
                "created_at": sty.created_at
            })
        
        output.append({
            "project_id": proj.id,
            "title": proj.title,
            "original_url": proj.original_url,
            "created_at": proj.created_at,
            "updated_at": proj.updated_at,
            "stylizations": sorted(stylizations_list, key=lambda x: x["id"], reverse=True)
        })
        
    return output

@router.get("/gallery")
def get_public_gallery(db: Session = Depends(get_db)):
    # Returns public stylizations with user info
    stylizations = db.query(Stylization)\
        .join(Project)\
        .join(User)\
        .filter(Stylization.is_public == True)\
        .options(joinedload(Stylization.project).joinedload(Project.owner))\
        .order_by(Stylization.created_at.desc())\
        .all()
        
    output = []
    for sty in stylizations:
        output.append({
            "stylization_id": sty.id,
            "style_applied": sty.style_applied,
            "processed_url": sty.processed_url,
            "original_url": sty.project.original_url,
            "settings": sty.settings_json,
            "username": sty.project.owner.username,
            "project_title": sty.project.title,
            "created_at": sty.created_at
        })
    return output

@router.patch("/stylization/{stylization_id}/public")
def toggle_public(
    stylization_id: int,
    is_public: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stylization = db.query(Stylization)\
        .join(Project)\
        .filter(Stylization.id == stylization_id, Project.user_id == current_user.id)\
        .first()
        
    if not stylization:
        raise HTTPException(status_code=404, detail="Stylization not found or access denied")
        
    stylization.is_public = is_public
    db.commit()
    return {"message": "Visibility updated successfully", "is_public": stylization.is_public}

@router.delete("/project/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
        
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
