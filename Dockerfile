# Stage 1: Build the Web Frontend
FROM node:20-bookworm-slim AS web-builder
WORKDIR /app/clipforge-web
COPY clipforge-web/package*.json ./
RUN npm install
COPY clipforge-web/ ./
COPY clipforge-shared/ /app/clipforge-shared/
RUN npm run build

# Stage 2: Production Python & FFmpeg Environment
FROM python:3.12-slim-bookworm AS production
WORKDIR /app

# Install system dependencies: FFmpeg, libass, fonts for video subtitles
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libass-dev \
    fonts-freefont-ttf \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY clipforge-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY clipforge-backend/ /app/clipforge-backend/

# Copy compiled frontend from Stage 1
COPY --from=web-builder /app/clipforge-web/dist /app/clipforge-web/dist

# Set working directory to backend
WORKDIR /app/clipforge-backend

ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "run.py"]
