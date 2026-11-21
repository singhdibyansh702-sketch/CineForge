from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Project, SourceVideo, Clip, ExportJob, ExportFile, User, CropSetting, CaptionPreset
from app.api.schemas import ProjectCreate, ProjectUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/dashboard/stats")
def get_dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    project_ids = [p.id for p in projects]

    total_projects = len(projects)
    total_clips = db.query(Clip).filter(Clip.project_id.in_(project_ids)).count() if project_ids else 0
    processing_clips = db.query(Clip).filter(Clip.project_id.in_(project_ids), Clip.status == "processing").count() if project_ids else 0
    completed_exports = db.query(ExportFile).count()

    recent_projects_query = (
        db.query(Project)
        .filter(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
        .limit(5)
        .all()
    )

    recent_projects = []
    for p in recent_projects_query:
        clips_count = len(p.clips)
        has_video = p.source_video is not None
        recent_projects.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "target_aspect_ratio": p.target_aspect_ratio,
            "status": p.status,
            "clips_count": clips_count,
            "has_video": has_video,
            "video_duration": p.source_video.duration if has_video else 0.0,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    return {
        "total_projects": total_projects,
        "total_clips": total_clips,
        "processing_clips": processing_clips,
        "completed_exports": completed_exports,
        "recent_projects": recent_projects
    }

@router.get("/")
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = (
        db.query(Project)
        .filter(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    result = []
    for p in projects:
        has_video = p.source_video is not None
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "target_aspect_ratio": p.target_aspect_ratio,
            "status": p.status,
            "clips_count": len(p.clips),
            "source_video": {
                "id": p.source_video.id,
                "filename": p.source_video.filename,
                "duration": p.source_video.duration,
                "width": p.source_video.width,
                "height": p.source_video.height,
                "source_type": p.source_video.source_type,
                "youtube_url": p.source_video.youtube_url,
                "thumbnail_path": p.source_video.thumbnail_path
            } if has_video else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        })
    return result

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(
        user_id=user.id,
        title=req.title,
        description=req.description,
        target_aspect_ratio=req.target_aspect_ratio or "9:16",
        status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "target_aspect_ratio": project.target_aspect_ratio,
        "status": project.status,
        "created_at": project.created_at.isoformat()
    }

@router.get("/{project_id}")
def get_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    has_video = project.source_video is not None
    clips_data = []
    for c in project.clips:
        crop = c.crop_setting
        preset = c.caption_preset
        clips_data.append({
            "id": c.id,
            "name": c.name,
            "start_time": c.start_time,
            "duration": c.duration,
            "end_time": c.end_time,
            "status": c.status,
            "progress": c.progress,
            "output_filepath": c.output_filepath,
            "thumbnail_filepath": c.thumbnail_filepath,
            "language": c.language,
            "subtitles_json": c.subtitles_json,
            "crop_setting": {
                "id": crop.id,
                "aspect_ratio": crop.aspect_ratio,
                "crop_x": crop.crop_x,
                "crop_y": crop.crop_y,
                "crop_width": crop.crop_width,
                "crop_height": crop.crop_height,
                "zoom_level": crop.zoom_level,
                "preset_mode": crop.preset_mode
            } if crop else None,
            "caption_preset": {
                "id": preset.id,
                "name": preset.name,
                "style_name": preset.style_name,
                "font_family": preset.font_family,
                "font_size": preset.font_size,
                "font_weight": preset.font_weight,
                "primary_color": preset.primary_color,
                "highlight_color": preset.highlight_color,
                "bg_color": preset.bg_color,
                "position": preset.position,
                "animation_type": preset.animation_type
            } if preset else None
        })

    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "target_aspect_ratio": project.target_aspect_ratio,
        "status": project.status,
        "source_video": {
            "id": project.source_video.id,
            "filename": project.source_video.filename,
            "filepath": project.source_video.filepath,
            "file_size": project.source_video.file_size,
            "duration": project.source_video.duration,
            "width": project.source_video.width,
            "height": project.source_video.height,
            "fps": project.source_video.fps,
            "format": project.source_video.format,
            "source_type": project.source_video.source_type,
            "youtube_url": project.source_video.youtube_url,
            "thumbnail_path": project.source_video.thumbnail_path
        } if has_video else None,
        "clips": clips_data,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None
    }

@router.put("/{project_id}")
def update_project(project_id: str, req: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.title is not None:
        project.title = req.title
    if req.description is not None:
        project.description = req.description
    if req.target_aspect_ratio is not None:
        project.target_aspect_ratio = req.target_aspect_ratio

    db.commit()
    db.refresh(project)
    return {"message": "Project updated successfully"}

@router.delete("/{project_id}")
def delete_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
