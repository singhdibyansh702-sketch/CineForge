import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Project, Clip, ExportJob, ExportFile, User, SourceVideo
from app.api.schemas import ExportTriggerRequest
from app.api.deps import get_current_user
from app.core.config import EXPORTS_DIR
from app.services.job_queue import job_queue

router = APIRouter(prefix="/exports", tags=["Exports"])

RESOLUTION_PIXELS = {
    "720p": 720,
    "1080p": 1080,
    "1440p": 1440,
    "4k": 2160,
}

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_export(
    req: ExportTriggerRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.source_video:
        raise HTTPException(status_code=400, detail="Cannot export: project has no source video.")

    # Upscale warning check
    source_h = project.source_video.height or 1080
    req_h = RESOLUTION_PIXELS.get(req.resolution.lower(), 1080)
    upscale_warning = None
    if req_h > source_h:
        upscale_warning = (
            f"Note: Selected output resolution ({req.resolution}) exceeds source video resolution "
            f"({source_h}p). FFmpeg will upscale the video, which may result in softer visuals."
        )

    # Check clips
    if req.clip_id:
        clip = db.query(Clip).filter(Clip.id == req.clip_id, Clip.project_id == project.id).first()
        if not clip:
            raise HTTPException(status_code=404, detail="Clip not found")
    else:
        clips_count = db.query(Clip).filter(Clip.project_id == project.id).count()
        if clips_count == 0:
            raise HTTPException(status_code=400, detail="No clips available in project to export.")

    job = ExportJob(
        project_id=project.id,
        clip_id=req.clip_id,
        status="queued",
        progress=0.0,
        resolution=req.resolution,
        fps=req.fps,
        aspect_ratio=req.aspect_ratio,
        format=req.format or "mp4"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Enqueue background processing
    job_queue.enqueue_export_job(job.id)

    return {
        "message": "Export job enqueued successfully",
        "job_id": job.id,
        "status": job.status,
        "upscale_warning": upscale_warning
    }

@router.get("/jobs/{job_id}")
def get_export_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")

    files = []
    for f in job.export_files:
        files.append({
            "id": f.id,
            "clip_id": f.clip_id,
            "filename": f.filename,
            "file_size": f.file_size,
            "file_size_formatted": f"{f.file_size / (1024*1024):.2f} MB" if f.file_size > 0 else "0 MB",
            "resolution": f.resolution,
            "download_url": f"/api/v1/exports/download/{f.filename}"
        })

    # Look for zip bundle if multiple files
    zip_bundle_url = None
    project = job.project
    if project:
        clean_title = project.title.replace(' ', '_')
        zip_name = f"Project_{clean_title}_{job.resolution}_Bundle_{job.id[:8]}.zip"
        if (EXPORTS_DIR / zip_name).exists():
            zip_bundle_url = f"/api/v1/exports/download/{zip_name}"

    return {
        "id": job.id,
        "project_id": job.project_id,
        "clip_id": job.clip_id,
        "status": job.status,
        "progress": job.progress,
        "resolution": job.resolution,
        "fps": job.fps,
        "aspect_ratio": job.aspect_ratio,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "files": files,
        "zip_bundle_url": zip_bundle_url
    }

@router.get("/history")
def get_export_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all export files for projects belonging to the user
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    project_ids = [p.id for p in projects]

    files_query = (
        db.query(ExportFile)
        .join(ExportJob, ExportFile.export_job_id == ExportJob.id)
        .filter(ExportJob.project_id.in_(project_ids))
        .order_by(ExportFile.created_at.desc())
        .all()
    ) if project_ids else []

    res = []
    for f in files_query:
        clip = f.clip
        project = f.export_job.project if f.export_job else None
        res.append({
            "id": f.id,
            "filename": f.filename,
            "clip_name": clip.name if clip else "Clip",
            "project_title": project.title if project else "Project",
            "file_size": f.file_size,
            "file_size_formatted": f"{f.file_size / (1024*1024):.2f} MB" if f.file_size > 0 else "0 MB",
            "resolution": f.resolution,
            "format": f.format,
            "download_url": f"/api/v1/exports/download/{f.filename}",
            "created_at": f.created_at.isoformat() if f.created_at else None
        })
    return res

@router.get("/download/{filename}")
def download_file(filename: str):
    file_path = EXPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    media_type = "application/zip" if filename.endswith(".zip") else "video/mp4"
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
