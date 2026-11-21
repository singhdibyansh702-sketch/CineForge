from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    theme_preference: str = "dark"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ThemeUpdate(BaseModel):
    theme_preference: str  # "dark" or "light"

# Project Schemas
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_aspect_ratio: str = "9:16"

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_aspect_ratio: Optional[str] = None

# Video Schemas
class YouTubeRefRequest(BaseModel):
    project_id: str
    youtube_url: str

# Clip Schemas
class CropSettingSchema(BaseModel):
    aspect_ratio: str = "9:16"
    crop_x: float = 0.0
    crop_y: float = 0.0
    crop_width: float = 1.0
    crop_height: float = 1.0
    zoom_level: float = 1.0
    preset_mode: str = "center"

class ClipCreate(BaseModel):
    project_id: str
    name: str
    start_time: float  # in seconds
    duration: float    # in seconds
    caption_preset_id: Optional[str] = None
    crop_setting: Optional[CropSettingSchema] = None
    language: str = "en"

class ClipBatchCreate(BaseModel):
    project_id: str
    clips: List[ClipCreate]

class ClipUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[float] = None
    duration: Optional[float] = None
    caption_preset_id: Optional[str] = None
    crop_setting: Optional[CropSettingSchema] = None
    language: Optional[str] = None

# Caption Preset Schemas
class CaptionPresetCreate(BaseModel):
    name: str
    style_name: str = "karaoke"
    font_family: str = "Inter"
    font_size: int = 28
    font_weight: str = "bold"
    primary_color: str = "#FFFFFF"
    highlight_color: str = "#A855F7"
    bg_color: str = "rgba(0,0,0,0.75)"
    outline_color: str = "#000000"
    outline_width: int = 2
    shadow_offset: int = 2
    position: str = "bottom"
    position_y: float = 80.0
    animation_type: str = "word"

class TranscribeRequest(BaseModel):
    language: str = "en"  # en, hi, hi-en

class SubtitlesUpdateRequest(BaseModel):
    segments: List[Dict[str, Any]]

# Export Schemas
class ExportTriggerRequest(BaseModel):
    project_id: str
    clip_id: Optional[str] = None  # None for batch export
    resolution: str = "1080p"      # 720p, 1080p, 1440p, 4k
    fps: int = 30                  # 24, 30, 60
    aspect_ratio: str = "9:16"     # 9:16, 16:9, 1:1, custom
    format: str = "mp4"
