import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaptionPreset, Clip, User
from app.api.schemas import CaptionPresetCreate, TranscribeRequest, SubtitlesUpdateRequest
from app.api.deps import get_current_user
from app.services.transcription_service import transcription_service

router = APIRouter(prefix="/captions", tags=["Captions"])

SYSTEM_PRESETS = [
    {
        "id": "sys-karaoke-violet",
        "name": "Viral Karaoke (Violet)",
        "is_system_preset": True,
        "style_name": "karaoke",
        "font_family": "Inter",
        "font_size": 32,
        "font_weight": "bold",
        "primary_color": "#FFFFFF",
        "highlight_color": "#A855F7",
        "bg_color": "rgba(0,0,0,0.0)",
        "outline_color": "#000000",
        "outline_width": 3,
        "shadow_offset": 2,
        "position": "bottom",
        "position_y": 80.0,
        "animation_type": "word"
    },
    {
        "id": "sys-clean-emerald",
        "name": "Clean Modern (Emerald)",
        "is_system_preset": True,
        "style_name": "clean",
        "font_family": "Inter",
        "font_size": 28,
        "font_weight": "semibold",
        "primary_color": "#FFFFFF",
        "highlight_color": "#10B981",
        "bg_color": "rgba(0,0,0,0.0)",
        "outline_color": "#000000",
        "outline_width": 2,
        "shadow_offset": 1,
        "position": "bottom",
        "position_y": 78.0,
        "animation_type": "sentence"
    },
    {
        "id": "sys-minimal-white",
        "name": "Subtle Minimalist",
        "is_system_preset": True,
        "style_name": "minimal",
        "font_family": "system-ui",
        "font_size": 24,
        "font_weight": "medium",
        "primary_color": "#F4F4F5",
        "highlight_color": "#FFFFFF",
        "bg_color": "rgba(0,0,0,0.0)",
        "outline_color": "#000000",
        "outline_width": 1,
        "shadow_offset": 0,
        "position": "bottom",
        "position_y": 82.0,
        "animation_type": "static"
    },
    {
        "id": "sys-box-yellow",
        "name": "Black Box Pop (Amber)",
        "is_system_preset": True,
        "style_name": "box",
        "font_family": "Inter",
        "font_size": 30,
        "font_weight": "bold",
        "primary_color": "#FFFFFF",
        "highlight_color": "#FBBF24",
        "bg_color": "rgba(0,0,0,0.85)",
        "outline_color": "#000000",
        "outline_width": 0,
        "shadow_offset": 0,
        "position": "center",
        "position_y": 50.0,
        "animation_type": "word"
    },
    {
        "id": "sys-hinglish-highlight",
        "name": "Hinglish Dynamic Highlight",
        "is_system_preset": True,
        "style_name": "highlight",
        "font_family": "Inter",
        "font_size": 32,
        "font_weight": "extrabold",
        "primary_color": "#FFFFFF",
        "highlight_color": "#EC4899",
        "bg_color": "rgba(0,0,0,0.4)",
        "outline_color": "#000000",
        "outline_width": 2,
        "shadow_offset": 2,
        "position": "bottom",
        "position_y": 80.0,
        "animation_type": "word"
    }
]

@router.get("/presets")
def get_caption_presets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_presets = db.query(CaptionPreset).filter(CaptionPreset.user_id == user.id).all()
    user_list = []
    for p in user_presets:
        user_list.append({
            "id": p.id,
            "name": p.name,
            "is_system_preset": False,
            "style_name": p.style_name,
            "font_family": p.font_family,
            "font_size": p.font_size,
            "font_weight": p.font_weight,
            "primary_color": p.primary_color,
            "highlight_color": p.highlight_color,
            "bg_color": p.bg_color,
            "outline_color": p.outline_color,
            "outline_width": p.outline_width,
            "shadow_offset": p.shadow_offset,
            "position": p.position,
            "position_y": p.position_y,
            "animation_type": p.animation_type,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return SYSTEM_PRESETS + user_list

@router.post("/presets", status_code=status.HTTP_201_CREATED)
def create_caption_preset(req: CaptionPresetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = CaptionPreset(
        user_id=user.id,
        name=req.name,
        is_system_preset=False,
        style_name=req.style_name,
        font_family=req.font_family,
        font_size=req.font_size,
        font_weight=req.font_weight,
        primary_color=req.primary_color,
        highlight_color=req.highlight_color,
        bg_color=req.bg_color,
        outline_color=req.outline_color,
        outline_width=req.outline_width,
        shadow_offset=req.shadow_offset,
        position=req.position,
        position_y=req.position_y,
        animation_type=req.animation_type
    )
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return {"message": "Caption preset saved", "preset_id": preset.id, "name": preset.name}

@router.delete("/presets/{preset_id}")
def delete_caption_preset(preset_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(CaptionPreset).filter(CaptionPreset.id == preset_id, CaptionPreset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    db.delete(preset)
    db.commit()
    return {"message": "Preset deleted"}

@router.post("/transcribe/{clip_id}")
def auto_transcribe_clip(
    clip_id: str,
    req: TranscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.language = req.language
    source_path = clip.project.source_video.filepath if clip.project.source_video else ""

    segments = transcription_service.transcribe_clip(
        video_path=source_path,
        start_time=clip.start_time,
        duration=clip.duration,
        language=req.language
    )
    clip.subtitles_json = json.dumps(segments)
    db.commit()

    return {
        "message": f"Transcribed successfully in {req.language}",
        "clip_id": clip.id,
        "language": clip.language,
        "segments": segments
    }

@router.put("/subtitles/{clip_id}")
def update_clip_subtitles(
    clip_id: str,
    req: SubtitlesUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.subtitles_json = json.dumps(req.segments)
    db.commit()
    return {"message": "Subtitles updated successfully", "segments_count": len(req.segments)}
