import os
import zipfile
import threading
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from app.core.config import settings, EXPORTS_DIR
from app.db.session import SessionLocal
from app.db.models import ExportJob, ExportFile, Clip, SourceVideo, CropSetting, CaptionPreset, Project
from app.services.ffmpeg_service import ffmpeg_service

def run_export_job_worker(job_id: str):
    """
    Background worker function running in a separate thread.
    Updates the database with real FFmpeg processing progress and creates ExportFiles.
    """
    db = SessionLocal()
    try:
        job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            print(f"[Worker] ExportJob {job_id} not found")
            return

        job.status = "processing"
        job.progress = 5.0
        db.commit()

        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project or not project.source_video:
            job.status = "failed"
            job.error_message = "Source video not found for project"
            db.commit()
            return

        source_video = project.source_video
        source_path = source_video.filepath

        # Determine clips to process
        if job.clip_id:
            clips = db.query(Clip).filter(Clip.id == job.clip_id).all()
        else:
            clips = db.query(Clip).filter(Clip.project_id == job.project_id).all()

        if not clips:
            job.status = "failed"
            job.error_message = "No clips found to export"
            db.commit()
            return

        total_clips = len(clips)
        completed_files: List[str] = []

        for idx, clip in enumerate(clips):
            clip.status = "processing"
            db.commit()

            # Sanitize clip name for filename
            clean_name = "".join(c for c in clip.name if c.isalnum() or c in (' ', '_', '-')).strip()
            if not clean_name:
                clean_name = f"clip_{idx+1}"
            clean_name = clean_name.replace(" ", "_")

            filename = f"{clean_name}_{job.resolution}_{job.fps}fps_{clip.id[:8]}.mp4"
            out_file_path = str(EXPORTS_DIR / filename)

            # Subtitle data parsing
            subtitles_data = None
            if clip.subtitles_json:
                try:
                    subtitles_data = json.loads(clip.subtitles_json)
                except Exception:
                    subtitles_data = None

            # Calculate progress bounds for this clip
            base_progress = (idx / total_clips) * 90.0
            clip_slice = (1.0 / total_clips) * 90.0

            def clip_progress_callback(pct: float):
                # Update both clip and job progress
                calc_job_progress = min(95.0, base_progress + (pct / 100.0) * clip_slice)
                job.progress = round(calc_job_progress, 1)
                clip.progress = round(pct, 1)
                try:
                    db.commit()
                except Exception:
                    pass

            crop_setting = clip.crop_setting
            caption_preset = clip.caption_preset

            success = ffmpeg_service.process_and_export_clip(
                source_path=source_path,
                output_path=out_file_path,
                start_time=clip.start_time,
                duration=clip.duration,
                crop_setting=crop_setting,
                caption_preset=caption_preset,
                subtitles_data=subtitles_data,
                resolution=job.resolution,
                fps=job.fps,
                aspect_ratio=job.aspect_ratio,
                on_progress=clip_progress_callback
            )

            if success and os.path.exists(out_file_path):
                file_size = os.path.getsize(out_file_path)
                clip.output_filepath = out_file_path
                clip.status = "completed"
                clip.progress = 100.0

                # Create export file entry
                export_file = ExportFile(
                    export_job_id=job.id,
                    clip_id=clip.id,
                    filename=filename,
                    filepath=out_file_path,
                    file_size=file_size,
                    resolution=job.resolution,
                    format=job.format,
                    download_url=f"/api/v1/exports/download/{filename}"
                )
                db.add(export_file)
                db.commit()
                completed_files.append(out_file_path)
            else:
                clip.status = "failed"
                db.commit()

        # If more than 1 clip, or full batch, create a ZIP file bundle
        if len(completed_files) > 0:
            zip_filename = f"Project_{project.title.replace(' ', '_')}_{job.resolution}_Bundle_{job.id[:8]}.zip"
            zip_path = str(EXPORTS_DIR / zip_filename)
            try:
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for f in completed_files:
                        zipf.write(f, arcname=os.path.basename(f))
            except Exception as e:
                print(f"[Worker] Could not build zip: {e}")

            job.status = "completed"
            job.progress = 100.0
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
        else:
            job.status = "failed"
            job.error_message = "All clip processing failed"
            db.commit()

    except Exception as e:
        print(f"[Worker] Error in export job {job_id}: {e}")
        try:
            job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

class JobQueue:
    def enqueue_export_job(self, job_id: str):
        thread = threading.Thread(target=run_export_job_worker, args=(job_id,), daemon=True)
        thread.start()

job_queue = JobQueue()
