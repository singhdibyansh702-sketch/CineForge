import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Project, Clip, CropSetting, CaptionPreset, SourceVideo, User
from app.api.schemas import ClipCreate, ClipUpdate, CropSettingSchema, ClipBatchCreate
from app.api.deps import get_current_user
from app.services.transcription_service import transcription_service

router = APIRouter(prefix="/clips", tags=["Clips"])

def format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

@router.post("/batch", status_code=status.HTTP_201_CREATED)
def create_clips_batch(req: ClipBatchCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_video = project.source_video
    video_dur = source_video.duration if source_video else 3600.0

    created = []
    for c_req in req.clips:
        if c_req.start_time < 0:
            continue
        dur = max(1.0, c_req.duration)
        if source_video and (c_req.start_time + dur > video_dur):
            dur = max(1.0, video_dur - c_req.start_time)
        end_time = c_req.start_time + dur

        transcripts = transcription_service.transcribe_clip(
            video_path=source_video.filepath if source_video else "",
            start_time=c_req.start_time,
            duration=dur,
            language=c_req.language or "en"
        )

        clip = Clip(
            project_id=project.id,
            name=c_req.name,
            start_time=c_req.start_time,
            duration=dur,
            end_time=end_time,
            caption_preset_id=c_req.caption_preset_id,
            status="draft",
            language=c_req.language or "en",
            subtitles_json=json.dumps(transcripts)
        )
        db.add(clip)
        db.flush()

        crop_data = c_req.crop_setting or CropSettingSchema()
        crop = CropSetting(
            clip_id=clip.id,
            aspect_ratio=crop_data.aspect_ratio or "9:16",
            crop_x=crop_data.crop_x,
            crop_y=crop_data.crop_y,
            crop_width=crop_data.crop_width,
            crop_height=crop_data.crop_height,
            zoom_level=crop_data.zoom_level,
            preset_mode=crop_data.preset_mode
        )
        db.add(crop)
        created.append(clip)

    db.commit()
    for c in created:
        db.refresh(c)

    return [
        {
            "id": c.id,
            "name": c.name,
            "start_time": c.start_time,
            "duration": c.duration,
            "end_time": c.end_time,
            "start_formatted": format_timestamp(c.start_time),
            "end_formatted": format_timestamp(c.end_time),
            "status": c.status
        }
        for c in created
    ]

@router.get("/project/{project_id}")
def get_project_clips(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clips = db.query(Clip).filter(Clip.project_id == project_id).order_by(Clip.start_time.asc()).all()
    res = []
    for c in clips:
        crop = c.crop_setting
        preset = c.caption_preset
        res.append({
            "id": c.id,
            "project_id": c.project_id,
            "name": c.name,
            "start_time": c.start_time,
            "duration": c.duration,
            "end_time": c.end_time,
            "start_formatted": format_timestamp(c.start_time),
            "end_formatted": format_timestamp(c.end_time),
            "status": c.status,
            "progress": c.progress,
            "language": c.language,
            "subtitles_json": c.subtitles_json,
            "crop_setting": {
                "id": crop.id if crop else None,
                "aspect_ratio": crop.aspect_ratio if crop else "9:16",
                "crop_x": crop.crop_x if crop else 0.0,
                "crop_y": crop.crop_y if crop else 0.0,
                "crop_width": crop.crop_width if crop else 1.0,
                "crop_height": crop.crop_height if crop else 1.0,
                "zoom_level": crop.zoom_level if crop else 1.0,
                "preset_mode": crop.preset_mode if crop else "center",
            } if crop else None,
            "caption_preset_id": c.caption_preset_id,
            "caption_preset": {
                "id": preset.id,
                "name": preset.name,
                "style_name": preset.style_name,
                "font_family": preset.font_family,
                "font_size": preset.font_size,
                "primary_color": preset.primary_color,
                "highlight_color": preset.highlight_color,
                "position": preset.position,
                "animation_type": preset.animation_type
            } if preset else None
        })
    return res

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_clip(req: ClipCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_video = project.source_video
    video_dur = source_video.duration if source_video else 3600.0

    if req.start_time < 0:
        raise HTTPException(status_code=400, detail="Start time cannot be negative.")
    if req.duration <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than 0.")
    if source_video and req.start_time >= video_dur:
        raise HTTPException(status_code=400, detail=f"Start time ({req.start_time}s) exceeds source video duration ({video_dur}s).")

    # Clamp duration if extends past end of video
    actual_duration = req.duration
    if source_video and (req.start_time + actual_duration > video_dur):
        actual_duration = max(1.0, video_dur - req.start_time)

    end_time = req.start_time + actual_duration

    # Generate initial transcription for clip
    transcripts = transcription_service.transcribe_clip(
        video_path=source_video.filepath if source_video else "",
        start_time=req.start_time,
        duration=actual_duration,
        language=req.language or "en"
    )

    clip = Clip(
        project_id=project.id,
        name=req.name,
        start_time=req.start_time,
        duration=actual_duration,
        end_time=end_time,
        caption_preset_id=req.caption_preset_id,
        status="draft",
        language=req.language or "en",
        subtitles_json=json.dumps(transcripts)
    )
    db.add(clip)
    db.flush()

    # Create associated crop setting
    crop_data = req.crop_setting or CropSettingSchema()
    crop = CropSetting(
        clip_id=clip.id,
        aspect_ratio=crop_data.aspect_ratio or "9:16",
        crop_x=crop_data.crop_x,
        crop_y=crop_data.crop_y,
        crop_width=crop_data.crop_width,
        crop_height=crop_data.crop_height,
        zoom_level=crop_data.zoom_level,
        preset_mode=crop_data.preset_mode
    )
    db.add(crop)
    db.commit()
    db.refresh(clip)

    return {
        "id": clip.id,
        "name": clip.name,
        "start_time": clip.start_time,
        "duration": clip.duration,
        "end_time": clip.end_time,
        "start_formatted": format_timestamp(clip.start_time),
        "end_formatted": format_timestamp(clip.end_time),
        "status": clip.status
    }

@router.put("/{clip_id}")
def update_clip(clip_id: str, req: ClipUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    project = db.query(Project).filter(Project.id == clip.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Unauthorized")

    source_video = project.source_video
    video_dur = source_video.duration if source_video else 3600.0

    if req.name is not None:
        clip.name = req.name
    if req.start_time is not None:
        if req.start_time < 0 or (source_video and req.start_time >= video_dur):
            raise HTTPException(status_code=400, detail="Invalid start time.")
        clip.start_time = req.start_time
    if req.duration is not None:
        if req.duration <= 0:
            raise HTTPException(status_code=400, detail="Duration must be positive.")
        clip.duration = req.duration

    # Recalculate end time
    if source_video and (clip.start_time + clip.duration > video_dur):
        clip.duration = max(1.0, video_dur - clip.start_time)
    clip.end_time = clip.start_time + clip.duration

    if req.caption_preset_id is not None:
        clip.caption_preset_id = req.caption_preset_id

    if req.language is not None and req.language != clip.language:
        clip.language = req.language
        transcripts = transcription_service.transcribe_clip(
            video_path=source_video.filepath if source_video else "",
            start_time=clip.start_time,
            duration=clip.duration,
            language=req.language
        )
        clip.subtitles_json = json.dumps(transcripts)

    if req.crop_setting:
        crop = clip.crop_setting
        if not crop:
            crop = CropSetting(clip_id=clip.id)
            db.add(crop)
        crop.aspect_ratio = req.crop_setting.aspect_ratio
        crop.crop_x = req.crop_setting.crop_x
        crop.crop_y = req.crop_setting.crop_y
        crop.crop_width = req.crop_setting.crop_width
        crop.crop_height = req.crop_setting.crop_height
        crop.zoom_level = req.crop_setting.zoom_level
        crop.preset_mode = req.crop_setting.preset_mode

    db.commit()
    db.refresh(clip)
    return {"message": "Clip updated successfully", "clip_id": clip.id}

@router.post("/{clip_id}/duplicate")
def duplicate_clip(clip_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    project = db.query(Project).filter(Project.id == clip.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Unauthorized")

    source_video = project.source_video
    video_dur = source_video.duration if source_video else 3600.0

    # Shift start time by 5 seconds if space available, otherwise keep same
    new_start = min(video_dur - 1.0, clip.start_time + 5.0)
    new_duration = min(clip.duration, video_dur - new_start)

    new_clip = Clip(
        project_id=clip.project_id,
        caption_preset_id=clip.caption_preset_id,
        name=f"{clip.name} (Copy)",
        start_time=new_start,
        duration=new_duration,
        end_time=new_start + new_duration,
        status="draft",
        language=clip.language,
        subtitles_json=clip.subtitles_json
    )
    db.add(new_clip)
    db.flush()

    if clip.crop_setting:
        new_crop = CropSetting(
            clip_id=new_clip.id,
            aspect_ratio=clip.crop_setting.aspect_ratio,
            crop_x=clip.crop_setting.crop_x,
            crop_y=clip.crop_setting.crop_y,
            crop_width=clip.crop_setting.crop_width,
            crop_height=clip.crop_setting.crop_height,
            zoom_level=clip.crop_setting.zoom_level,
            preset_mode=clip.crop_setting.preset_mode
        )
        db.add(new_crop)

    db.commit()
    db.refresh(new_clip)
    return {"message": "Clip duplicated", "id": new_clip.id, "name": new_clip.name}

@router.delete("/{clip_id}")
def delete_clip(clip_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    project = db.query(Project).filter(Project.id == clip.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(clip)
    db.commit()
    return {"message": "Clip deleted successfully"}
