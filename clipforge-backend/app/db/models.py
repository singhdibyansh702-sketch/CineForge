import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    theme_preference = Column(String(20), default="dark")  # "dark" or "light"
    created_at = Column(DateTime, default=utc_now)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    caption_presets = relationship("CaptionPreset", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_aspect_ratio = Column(String(20), default="9:16")  # 9:16, 16:9, 1:1, custom
    status = Column(String(30), default="draft")  # draft, processing, ready
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="projects")
    source_video = relationship("SourceVideo", back_populates="project", uselist=False, cascade="all, delete-orphan")
    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan")
    export_jobs = relationship("ExportJob", back_populates="project", cascade="all, delete-orphan")

class SourceVideo(Base):
    __tablename__ = "source_videos"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), unique=True, nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    duration = Column(Float, default=0.0)  # in seconds
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    fps = Column(Float, default=30.0)
    format = Column(String(20), default="mp4")
    source_type = Column(String(30), default="upload")  # "upload" or "youtube_ref"
    youtube_url = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="source_video")

class CaptionPreset(Base):
    __tablename__ = "caption_presets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    is_system_preset = Column(Boolean, default=False)
    style_name = Column(String(50), default="karaoke")  # bold, clean, minimal, box, highlight, karaoke
    font_family = Column(String(100), default="Inter")
    font_size = Column(Integer, default=28)
    font_weight = Column(String(20), default="bold")
    primary_color = Column(String(20), default="#FFFFFF")
    highlight_color = Column(String(20), default="#A855F7")  # restrained purple accent
    bg_color = Column(String(30), default="rgba(0,0,0,0.75)")
    outline_color = Column(String(20), default="#000000")
    outline_width = Column(Integer, default=2)
    shadow_offset = Column(Integer, default=2)
    position = Column(String(20), default="bottom")  # top, center, bottom, custom
    position_y = Column(Float, default=80.0)  # percentage from top or pixel value
    animation_type = Column(String(30), default="word")  # word, sentence, static
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="caption_presets")
    clips = relationship("Clip", back_populates="caption_preset")

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    caption_preset_id = Column(String(36), ForeignKey("caption_presets.id"), nullable=True)
    name = Column(String(255), nullable=False)
    start_time = Column(Float, nullable=False, default=0.0)  # in seconds
    duration = Column(Float, nullable=False, default=30.0)    # in seconds
    end_time = Column(Float, nullable=False, default=30.0)      # start_time + duration
    status = Column(String(30), default="draft")  # draft, queued, processing, completed, failed
    progress = Column(Float, default=0.0)
    output_filepath = Column(String(500), nullable=True)
    thumbnail_filepath = Column(String(500), nullable=True)
    subtitles_json = Column(Text, nullable=True)  # JSON-encoded transcript segments with timestamps
    language = Column(String(20), default="en")    # en, hi, hi-en (Hinglish)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="clips")
    caption_preset = relationship("CaptionPreset", back_populates="clips")
    crop_setting = relationship("CropSetting", back_populates="clip", uselist=False, cascade="all, delete-orphan")
    export_files = relationship("ExportFile", back_populates="clip", cascade="all, delete-orphan")

class CropSetting(Base):
    __tablename__ = "crop_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clip_id = Column(String(36), ForeignKey("clips.id"), unique=True, nullable=False)
    aspect_ratio = Column(String(20), default="9:16")  # 9:16, 16:9, 1:1, custom
    crop_x = Column(Float, default=0.0)      # Normalized 0.0 - 1.0 or pixel offset
    crop_y = Column(Float, default=0.0)
    crop_width = Column(Float, default=1.0)  # Normalized 0.0 - 1.0 or pixel width
    crop_height = Column(Float, default=1.0)
    zoom_level = Column(Float, default=1.0)
    preset_mode = Column(String(20), default="center")  # center, left, right, custom

    clip = relationship("Clip", back_populates="crop_setting")

class ExportJob(Base):
    __tablename__ = "export_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    clip_id = Column(String(36), nullable=True)  # None if full batch export
    status = Column(String(30), default="queued")  # queued, processing, completed, failed
    progress = Column(Float, default=0.0)
    resolution = Column(String(20), default="1080p")  # 720p, 1080p, 1440p, 4k
    fps = Column(Integer, default=30)
    aspect_ratio = Column(String(20), default="9:16")
    format = Column(String(20), default="mp4")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="export_jobs")
    export_files = relationship("ExportFile", back_populates="export_job", cascade="all, delete-orphan")

class ExportFile(Base):
    __tablename__ = "export_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    export_job_id = Column(String(36), ForeignKey("export_jobs.id"), nullable=False, index=True)
    clip_id = Column(String(36), ForeignKey("clips.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    resolution = Column(String(20), default="1080p")
    format = Column(String(20), default="mp4")
    download_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    export_job = relationship("ExportJob", back_populates="export_files")
    clip = relationship("Clip", back_populates="export_files")
