import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print("=" * 60)
    print(f"Starting ClipForge Unified Backend on http://{host}:{port}")
    print(f"Swagger API Docs: http://localhost:{port}/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
