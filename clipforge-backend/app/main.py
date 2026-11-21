import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings, UPLOADS_DIR, EXPORTS_DIR, SAMPLES_DIR
from app.db.session import engine, Base, SessionLocal
from app.db.models import User, Project, SourceVideo, Clip, CropSetting, CaptionPreset
from app.core.security import get_password_hash
from app.services.ffmpeg_service import ffmpeg_service
from app.services.transcription_service import transcription_service
import json

from app.api.routers import auth, projects, videos, clips, captions, exports

def seed_initial_demo_data():
    """Seeds a ready-to-use project with sample video and clips for instant testing."""
    db = SessionLocal()
    try:
        # Check if demo user exists
        user = db.query(User).filter(User.email == "editor@clipforge.io").first()
        if not user:
            user = User(
                email="editor@clipforge.io",
                hashed_password=get_password_hash("clipforge123"),
                full_name="Senior Video Editor",
                theme_preference="dark"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if demo project exists
        project = db.query(Project).filter(Project.user_id == user.id).first()
        if not project:
            project = Project(
                user_id=user.id,
                title="Podcast Highlights: AI & Creator Growth",
                description="Long-form interview converting into viral short-form clips for YouTube Shorts, Reels and TikTok.",
                target_aspect_ratio="9:16",
                status="ready"
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            # Generate demo sample source video
            sample_path = SAMPLES_DIR / "clipforge_demo_source.mp4"
            if not sample_path.exists():
                print("[ClipForge Startup] Generating demo 1080p source video...")
                ffmpeg_service.generate_demo_source_video(str(sample_path), duration=60)

            thumb_path = SAMPLES_DIR / "clipforge_demo_thumb.jpg"
            if not thumb_path.exists() and sample_path.exists():
                ffmpeg_service.generate_thumbnail(str(sample_path), str(thumb_path), timestamp_sec=2.0)

            if sample_path.exists():
                info = ffmpeg_service.get_video_info(str(sample_path))
                source_video = SourceVideo(
                    project_id=project.id,
                    filename="AI_Creator_Growth_Interview_1080p.mp4",
                    filepath=str(sample_path),
                    file_size=os.path.getsize(sample_path),
                    duration=info.get("duration", 60.0),
                    width=info.get("width", 1920),
                    height=info.get("height", 1080),
                    fps=info.get("fps", 30.0),
                    format="mp4",
                    source_type="upload",
                    thumbnail_path="/api/v1/videos/stream/clipforge_demo_thumb.jpg"
                )
                db.add(source_video)
                db.commit()

                # Add 3 initial sample clips with English, Hinglish, Hindi transcripts
                clip_configs = [
                    {
                        "name": "Clip 01: The 3-Second Hook",
                        "start": 0.0,
                        "duration": 15.0,
                        "lang": "en",
                        "crop_mode": "center"
                    },
                    {
                        "name": "Clip 02: Viral Reels Strategy",
                        "start": 15.0,
                        "duration": 20.0,
                        "lang": "hi-en",
                        "crop_mode": "left"
                    },
                    {
                        "name": "Clip 03: Audience Retention Secret",
                        "start": 35.0,
                        "duration": 25.0,
                        "lang": "hi",
                        "crop_mode": "right"
                    }
                ]

                for cfg in clip_configs:
                    transcripts = transcription_service.transcribe_clip(
                        video_path=str(sample_path),
                        start_time=cfg["start"],
                        duration=cfg["duration"],
                        language=cfg["lang"]
                    )
                    c = Clip(
                        project_id=project.id,
                        name=cfg["name"],
                        start_time=cfg["start"],
                        duration=cfg["duration"],
                        end_time=cfg["start"] + cfg["duration"],
                        status="draft",
                        language=cfg["lang"],
                        subtitles_json=json.dumps(transcripts)
                    )
                    db.add(c)
                    db.flush()

                    crop = CropSetting(
                        clip_id=c.id,
                        aspect_ratio="9:16",
                        crop_x=0.0,
                        crop_y=0.0,
                        crop_width=1.0,
                        crop_height=1.0,
                        zoom_level=1.0,
                        preset_mode=cfg["crop_mode"]
                    )
                    db.add(crop)

                db.commit()
                print("[ClipForge Startup] Demo project and clips successfully initialized!")

    except Exception as e:
        print(f"[ClipForge Startup] Seed error: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo
    Base.metadata.create_all(bind=engine)
    seed_initial_demo_data()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ClipForge Professional Video Clipping & Editing Platform Backend",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(projects.router, prefix=settings.API_PREFIX)
app.include_router(videos.router, prefix=settings.API_PREFIX)
app.include_router(clips.router, prefix=settings.API_PREFIX)
app.include_router(captions.router, prefix=settings.API_PREFIX)
app.include_router(exports.router, prefix=settings.API_PREFIX)

# Healthcheck
@app.get("/health")
def healthcheck():
    return {"status": "ok"}

# Mount Web Frontend if dist directory exists
dist_dir = Path(__file__).resolve().parent.parent.parent / "clipforge-web" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "app": "ClipForge API",
            "version": settings.VERSION,
            "status": "healthy",
            "docs_url": "/docs"
        }
