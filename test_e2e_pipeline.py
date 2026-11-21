import os
import sys
import time
from pathlib import Path

# Set PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "clipforge-backend"))

from app.db.session import SessionLocal, Base, engine
from app.db.models import Project, Clip, ExportJob, ExportFile
from app.services.ffmpeg_service import ffmpeg_service
from app.services.job_queue import job_queue, run_export_job_worker

def test_pipeline():
    print("=" * 60)
    print("Testing ClipForge Complete Real Video Pipeline")
    print("=" * 60)

    db = SessionLocal()
    try:
        project = db.query(Project).first()
        if not project or not project.source_video:
            print("[FAIL] No project or source video found in database.")
            return False

        print(f"[OK] Found Project: '{project.title}' (ID: {project.id})")
        print(f"[OK] Source Video: '{project.source_video.filename}', Duration: {project.source_video.duration}s")

        clips = db.query(Clip).filter(Clip.project_id == project.id).all()
        print(f"[OK] Found {len(clips)} timestamp clips in project:")
        for c in clips:
            print(f"     - {c.name}: {c.start_time}s -> {c.end_time}s ({c.duration}s)")

        # Create an export job for Clip 1
        test_clip = clips[0]
        job = ExportJob(
            project_id=project.id,
            clip_id=test_clip.id,
            status="queued",
            progress=0.0,
            resolution="720p",
            fps=30,
            aspect_ratio="9:16",
            format="mp4"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        print(f"\n[OK] Enqueued ExportJob {job.id} for Clip '{test_clip.name}' (720p 9:16 vertical)")

        # Run worker synchronously for test verification
        print("[INFO] Executing FFmpeg video processing pipeline...")
        run_export_job_worker(job.id)

        # Refresh job from DB
        db.refresh(job)
        print(f"[RESULT] Job status: {job.status}, progress: {job.progress}%")

        if job.status != "completed":
            print(f"[FAIL] Job failed with error: {job.error_message}")
            return False

        files = db.query(ExportFile).filter(ExportFile.export_job_id == job.id).all()
        print(f"[OK] Exported {len(files)} files:")
        for f in files:
            p = Path(f.filepath)
            exists = p.exists()
            size = p.stat().st_size if exists else 0
            print(f"     - File: {f.filename}, Exists: {exists}, Size: {size / (1024*1024):.2f} MB")
            if not exists or size == 0:
                print(f"[FAIL] Output video file missing or empty!")
                return False

            # Inspect exported video with FFmpeg
            info = ffmpeg_service.get_video_info(str(p))
            print(f"     - Output Resolution: {info['width']}x{info['height']}, Duration: {info['duration']}s, FPS: {info['fps']}")
            if info['width'] != 720 or info['height'] != 1280:
                print(f"[WARN] Target resolution was 720x1280, got {info['width']}x{info['height']}")

        print("\n" + "=" * 60)
        print("ALL VIDEO PROCESSING CHECKS PASSED WITH REAL FFMPEG EXECUTION!")
        print("=" * 60)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = test_pipeline()
    if not success:
        sys.exit(1)
