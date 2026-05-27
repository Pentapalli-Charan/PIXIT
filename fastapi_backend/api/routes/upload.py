from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, Query
from api.dependencies import get_current_user
from services.image_service import ImageService
from core.database import get_db, User, Project, Stylization, UserLike
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
import json
import os

router = APIRouter()

def map_prompt_to_style(prompt: str, default_style: str) -> str:
    if not prompt:
        return default_style
    p_lower = prompt.lower()
    if "cyberpunk" in p_lower or "neon" in p_lower:
        return "cyberpunk"
    elif "pixar" in p_lower or "clay" in p_lower or "3d" in p_lower:
        return "pixar"
    elif "anime" in p_lower or "manga" in p_lower:
        return "anime"
    elif "sketch" in p_lower or "pencil" in p_lower or "drawing" in p_lower:
        return "pencil"
    elif "watercolor" in p_lower or "paint" in p_lower:
        return "watercolor"
    elif "oil" in p_lower:
        return "oil"
    elif "cinematic" in p_lower or "movie" in p_lower or "dramatic" in p_lower:
        return "cinematic"
    elif "enhance" in p_lower or "hd" in p_lower:
        return "enhance"
    elif "sharpen" in p_lower:
        return "sharpen"
    elif "denoise" in p_lower or "noise" in p_lower:
        return "denoise"
    elif "upscale" in p_lower or "resize" in p_lower or "resolution" in p_lower:
        return "upscale"
    elif "face" in p_lower or "portrait" in p_lower or "smooth" in p_lower:
        return "face_enhance"
    elif "bg" in p_lower or "background" in p_lower or "remove" in p_lower:
        return "background_removal"
    return default_style

@router.post("/")
async def upload_image(
    request: Request,
    image: UploadFile = File(...), 
    style: str = Form("cartoon"),
    settings: str = Form(None), 
    prompt: str = Form(None),
    tags: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image")

    # Credit system verification
    is_premium = current_user.subscription and current_user.subscription.plan_name != "Free"
    if current_user.credits <= 0 and not is_premium:
        raise HTTPException(
            status_code=402, 
            detail="Credit depletion! Please upgrade to Pro/Enterprise for unlimited generations."
        )

    # Prompt-based stylization mapping
    mapped_style = map_prompt_to_style(prompt, style)
        
    parsed_settings = None
    if settings:
        try:
            parsed_settings = json.loads(settings)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid settings JSON format")

    try:
        # Process image using OpenCV/PIL
        original_url, processed_url = await ImageService.process_image(image, mapped_style, request, parsed_settings)
        
        # Save to database
        new_project = Project(
            user_id=current_user.id,
            title=f"Stylized {mapped_style.capitalize()}",
            original_url=original_url
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        new_stylization = Stylization(
            project_id=new_project.id,
            style_applied=mapped_style,
            processed_url=processed_url,
            settings_json=parsed_settings,
            is_public=False,
            likes_count=0,
            tags=tags,
            prompt=prompt
        )
        db.add(new_stylization)
        
        # Credit updates
        if current_user.credits > 0 and not is_premium:
            current_user.credits -= 1
        current_user.total_generations += 1
        
        db.commit()
        db.refresh(new_stylization)
        db.refresh(current_user)

        return {
            "project_id": new_project.id,
            "stylization_id": new_stylization.id,
            "title": new_project.title,
            "original_url": original_url,
            "processed_url": processed_url,
            "style": mapped_style,
            "settings": parsed_settings,
            "is_public": new_stylization.is_public,
            "credits_remaining": current_user.credits,
            "total_generations": current_user.total_generations
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
    prompt: str = Form(None),
    tags: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_premium = current_user.subscription and current_user.subscription.plan_name != "Free"
    if current_user.credits <= 0 and not is_premium:
        raise HTTPException(status_code=402, detail="Credit depletion!")

    mapped_style = map_prompt_to_style(prompt, style)

    parsed_settings = None
    if settings:
        try:
            parsed_settings = json.loads(settings)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid settings JSON format")

    try:
        orig_filename = project.original_url.split("/static/")[-1]
        orig_path = os.path.join("uploads", orig_filename)
        
        if not os.path.exists(orig_path):
            raise HTTPException(status_code=404, detail="Original image file not found on disk")

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
        _, processed_url = await ImageService.process_image(local_file, mapped_style, request, parsed_settings)

        # Create new stylization in DB
        new_stylization = Stylization(
            project_id=project.id,
            style_applied=mapped_style,
            processed_url=processed_url,
            settings_json=parsed_settings,
            is_public=False,
            likes_count=0,
            tags=tags,
            prompt=prompt
        )
        db.add(new_stylization)
        
        # Update user stats
        if current_user.credits > 0 and not is_premium:
            current_user.credits -= 1
        current_user.total_generations += 1
        
        db.commit()
        db.refresh(new_stylization)
        db.refresh(current_user)

        return {
            "project_id": project.id,
            "stylization_id": new_stylization.id,
            "title": project.title,
            "original_url": project.original_url,
            "processed_url": processed_url,
            "style": mapped_style,
            "settings": parsed_settings,
            "is_public": new_stylization.is_public,
            "credits_remaining": current_user.credits,
            "total_generations": current_user.total_generations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def upload_batch_images(
    request: Request,
    images: list[UploadFile] = File(...), 
    style: str = Form("cartoon"),
    settings: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="Maximum batch size is 5 images")
        
    is_premium = current_user.subscription and current_user.subscription.plan_name != "Free"
    needed_credits = len(images)
    
    if current_user.credits < needed_credits and not is_premium:
        raise HTTPException(status_code=402, detail="Insufficient credits for this batch size. Please upgrade.")
        
    parsed_settings = None
    if settings:
        try:
            parsed_settings = json.loads(settings)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid settings JSON")
            
    results = []
    for image in images:
        if not image.content_type.startswith("image/"):
            continue
            
        try:
            original_url, processed_url = await ImageService.process_image(image, style, request, parsed_settings)
            
            new_project = Project(
                user_id=current_user.id,
                title=f"Batch {style.capitalize()}",
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
                is_public=False,
                likes_count=0
            )
            db.add(new_stylization)
            
            if current_user.credits > 0 and not is_premium:
                current_user.credits -= 1
            current_user.total_generations += 1
            db.commit()
            
            results.append({
                "project_id": new_project.id,
                "stylization_id": new_stylization.id,
                "processed_url": processed_url
            })
        except Exception as e:
            print(f"Batch item processing error: {e}")
            
    db.refresh(current_user)
    return {"results": results, "credits_left": current_user.credits}

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
                "created_at": sty.created_at,
                "likes_count": sty.likes_count,
                "tags": sty.tags,
                "prompt": sty.prompt
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
def get_public_gallery(
    query: str = Query(None),
    db: Session = Depends(get_db)
):
    # Returns public stylizations with user info
    q = db.query(Stylization)\
        .join(Project)\
        .join(User)\
        .filter(Stylization.is_public == True)\
        .options(joinedload(Stylization.project).joinedload(Project.owner))
        
    if query:
        search_filter = or_(
            Stylization.tags.ilike(f"%{query}%"),
            Stylization.style_applied.ilike(f"%{query}%"),
            Project.title.ilike(f"%{query}%"),
            User.username.ilike(f"%{query}%")
        )
        q = q.filter(search_filter)
        
    stylizations = q.order_by(Stylization.created_at.desc()).all()
        
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
            "created_at": sty.created_at,
            "likes_count": sty.likes_count,
            "tags": sty.tags,
            "prompt": sty.prompt
        })
    return output

@router.patch("/stylization/{stylization_id}/public")
def toggle_public(
    stylization_id: int,
    is_public: bool = Query(...),
    tags: str = Query(None),
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
    if tags is not None:
        stylization.tags = tags
    db.commit()
    return {
        "message": "Visibility updated successfully", 
        "is_public": stylization.is_public,
        "tags": stylization.tags
    }

@router.post("/stylization/{stylization_id}/like")
def like_stylization(
    stylization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    like = db.query(UserLike).filter(UserLike.user_id == current_user.id, UserLike.stylization_id == stylization_id).first()
    sty = db.query(Stylization).filter(Stylization.id == stylization_id).first()
    if not sty:
        raise HTTPException(status_code=404, detail="Stylization not found")
        
    if like:
        return {"message": "Already liked", "likes_count": sty.likes_count}
        
    new_like = UserLike(user_id=current_user.id, stylization_id=stylization_id)
    db.add(new_like)
    sty.likes_count += 1
    db.commit()
    return {"message": "Liked successfully", "likes_count": sty.likes_count}

@router.delete("/stylization/{stylization_id}/like")
def unlike_stylization(
    stylization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    like = db.query(UserLike).filter(UserLike.user_id == current_user.id, UserLike.stylization_id == stylization_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="Like record not found")
        
    sty = db.query(Stylization).filter(Stylization.id == stylization_id).first()
    db.delete(like)
    if sty and sty.likes_count > 0:
        sty.likes_count -= 1
    db.commit()
    return {"message": "Unliked successfully", "likes_count": sty.likes_count if sty else 0}

@router.get("/favorites")
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorites = db.query(Stylization)\
        .join(UserLike)\
        .join(Project)\
        .join(User, Project.user_id == User.id)\
        .filter(UserLike.user_id == current_user.id)\
        .options(joinedload(Stylization.project).joinedload(Project.owner))\
        .all()
        
    output = []
    for sty in favorites:
        output.append({
            "stylization_id": sty.id,
            "style_applied": sty.style_applied,
            "processed_url": sty.processed_url,
            "original_url": sty.project.original_url,
            "settings": sty.settings_json,
            "username": sty.project.owner.username,
            "project_title": sty.project.title,
            "created_at": sty.created_at,
            "likes_count": sty.likes_count,
            "tags": sty.tags
        })
    return output

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
