import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
EXPORTS_DIR = DATA_DIR / "exports"
SUBTITLES_DIR = DATA_DIR / "subtitles"
SAMPLES_DIR = DATA_DIR / "samples"

for directory in [DATA_DIR, UPLOADS_DIR, EXPORTS_DIR, SUBTITLES_DIR, SAMPLES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "ClipForge"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "clipforge-secure-jwt-secret-key-998877")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'clipforge.db'}")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:19000",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "*",
    ]
    
    # FFmpeg executable detection
    @classmethod
    def get_ffmpeg_binary(cls) -> str:
        # Check imageio_ffmpeg first
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
            if exe and os.path.isfile(exe):
                return exe
        except Exception:
            pass
        
        # Check standard path
        import shutil
        sys_ffmpeg = shutil.which("ffmpeg")
        if sys_ffmpeg:
            return sys_ffmpeg
            
        # Check common Windows paths
        potential_paths = [
            r"C:\Program Files\BlueStacks_nxt\ffmpeg.exe",
            r"C:\Program Files\Topaz Labs LLC\Topaz Video AI\ffmpeg.exe",
            r"C:\ffmpeg\bin\ffmpeg.exe",
        ]
        for p in potential_paths:
            if os.path.isfile(p):
                return p
                
        return "ffmpeg"

settings = Settings()
