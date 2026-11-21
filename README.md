# ClipForge – Video Clipping & Editing Platform

ClipForge is a professional, high-performance video clipping and editing SaaS platform designed for content creators, video editors, and social media managers to convert long-form videos into viral, short-form vertical clips (9:16, 1:1, 16:9).

---

## 1. System Architecture

```
ClipForge/
├── clipforge-backend/            # Unified FastAPI REST backend & FFmpeg Processing Engine
│   ├── app/
│   │   ├── api/                  # REST Routers (auth, projects, videos, clips, captions, exports)
│   │   ├── core/                 # Config, Security (JWT, bcrypt), Directories
│   │   ├── db/                   # SQLAlchemy Models & SQLite/Postgres DB session
│   │   ├── services/             # Real FFmpeg Service, Multilingual Transcriber, Job Worker
│   │   └── main.py               # FastAPI application entrypoint & demo seeder
│   ├── data/                     # Uploads, Samples, Subtitles, and Exported MP4/ZIP archives
│   └── run.py                    # Backend server runner (Port 8000)
│
├── clipforge-web/                # Responsive Web Studio (Vite + React 19 + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/                  # Type-safe API client
│   │   ├── components/           # Sidebar, Header, BottomNav, Interactive CropEditor, CaptionEditor, ExportModal
│   │   ├── context/              # ThemeContext (Pure Black Dark & Warm Light) & AuthContext
│   │   ├── pages/                # Dashboard, NewProject, MyProjects, ClippingStudio, CaptionPresets, ExportHistory, SettingsPage
│   │   └── types/                # TypeScript Interfaces matching backend schemas
│   ├── package.json
│   └── vite.config.ts            # Configured with proxy to backend (Port 3000)
│
├── clipforge-android/            # Native Android Mobile App (React Native + Expo)
│   ├── src/
│   │   ├── components/           # Touch UI controls & layout frames
│   │   ├── constants/            # Pure Black (#000000) and Light Theme Tokens
│   │   ├── screens/              # Dashboard, Projects, Studio, Presets, Exports, Settings
│   │   ├── services/             # Mobile API client (10.0.2.2 emulator loopback & LAN)
│   │   └── types/                # Typed shared contracts
│   ├── App.tsx                   # Native bottom tab navigation & safe area
│   └── app.json                  # Expo Android application metadata
│
├── clipforge-shared/             # Cross-platform shared TypeScript models and DTOs
└── test_e2e_pipeline.py          # End-to-end automated verification script
```

---

## 2. Technologies Used

- **Video Processing Engine**: FFmpeg (H.264 / libx264, AAC Audio, libass subtitle burn-in, precise crop/scale filters, faststart streaming headers).
- **Speech-to-Text Transcription**: Whisper-compatible multilingual engine supporting English, Hindi (हिन्दी), and Hinglish (Hindi written in Roman script) with word-level karaoke timing.
- **Backend API**: Python 3.13 + FastAPI, SQLAlchemy ORM, SQLite (local) / PostgreSQL (production), PyJWT & bcrypt authentication, background worker thread queue.
- **Web Client**: React 19, TypeScript, Vite, Tailwind CSS with customized Pure Black theme system, Lucide icons.
- **Android Application**: React Native, Expo SDK 52, Safe Area Context, Native Touch Ergonomics.

---

## 3. Implemented Features

### Video Import & Reference
- Direct upload for MP4, MOV, MKV, WebM with metadata analysis (resolution, fps, duration).
- YouTube URL Reference support adhering to compliant oEmbed metadata guidelines with playback buffer.
- Studio 1080p Demo Video Generator for immediate testing without downloading external assets.
- HTTP Range-capable video streaming for smooth seeking in HTML5 video players.

### Multiple Timestamp Clipping
- Add unlimited clips per video with custom clip names.
- Start timestamp in `HH:MM:SS` format.
- Duration specification in seconds with automatic end timestamp calculation.
- Overlap & bounds validation preventing clips from exceeding source video duration.
- One-click clip duplication with smart timestamp offset.
- Single clip preview, deletion, and individual export.

### Visual Crop & Layout Editor
- Interactive canvas with draggable and resizable crop frame.
- Preset positioning: **Left** (Speaker 1), **Center** (Default), **Right** (Speaker 2).
- Continuous zoom controls (1.0x to 2.5x).
- Aspect ratio selection: **9:16 Vertical** (Reels/Shorts/TikTok), **1:1 Square**, **16:9 Landscape**, and **Custom**.
- Real-time side-by-side **Live 9:16 Vertical Preview** window showing exact cropped framing.
- Smart Center AI speaker detection simulation.

### Subtitles & Multilingual Caption Studio
- Automatic speech transcription in **English**, **Hindi**, and **Hinglish**.
- Word-level timestamps for animated karaoke captions.
- 6 Visual Styles: **Karaoke**, **Highlight**, **Black Box Pop**, **Bold**, **Clean Modern**, **Subtle Minimal**.
- Full typography customization: font size, primary color, highlight color, background box, and outline width.
- Positioning: Top, Center, Bottom.
- Animation modes: Word-by-word, Sentence-by-sentence, and Static.
- Custom preset saving and manual subtitle transcript editor.

### Video Export Engine
- Real FFmpeg processing (no mock progress bars or fake files).
- Export individual clips or batch render all project clips in one click.
- Resolutions: 720p, 1080p, 1440p (2K), 2160p (4K).
- Framerates: 24 FPS, 30 FPS, 60 FPS.
- Upscale warning notification when chosen resolution exceeds source video height.
- Single MP4 downloads or complete Project ZIP bundle download.

### Theme System
- **Dark Mode**: Genuinely pure black (`#000000`), card surfaces (`#141414`), secondary surfaces (`#1C1C1C`), borders (`#2A2A2A`), white text, and restrained violet accent (`#8B5CF6`). Strict avoidance of navy blue or blue tints.
- **Light Mode**: Warm off-white (`#F9FAFB`), clean white cards (`#FFFFFF`), dark charcoal text (`#18181B`), light grey borders (`#E5E7EB`), violet accent (`#7C3AED`).
- Persisted automatically in localStorage and user profile.

### Android Native Experience
- Touch-first UI designed for mobile ergonomics.
- Quick timestamp steppers (`+15s`, `+30s`, `+60s`).
- Touch-friendly crop framing buttons and live mobile viewport simulator.
- Shared backend API, authentication, and projects with the web app.

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- FFmpeg (bundled automatically via `imageio-ffmpeg` or system FFmpeg)

### 1. Start the Backend API Server
```powershell
# From the project root:
cd clipforge-backend
python run.py
```
- API will start on: `http://localhost:8000`
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- On startup, demo project and sample video are seeded automatically.

### 2. Start the Responsive Web Application
```powershell
# Open a new terminal in the project root:
cd clipforge-web
npm run dev
```
- Web Application will start on: `http://localhost:3000`
- Open in your browser to access the full Clipping Studio.

### 3. Run the Native Android Application
```powershell
# Open a new terminal in the project root:
cd clipforge-android
npm start
# Or press 'a' to run in connected Android device/emulator:
npm run android
```
- Connects automatically to the backend via `http://10.0.2.2:8000/api/v1` (Android emulator) or `http://localhost:8000/api/v1`.

### 4. Run the Verification Script
```powershell
python test_e2e_pipeline.py
```
- Executes an automated end-to-end test verifying project loading, clip extraction, FFmpeg crop/scale/libass burning, resolution output, and file integrity.
