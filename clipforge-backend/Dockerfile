FROM python:3.12-slim-bookworm

WORKDIR /app

# Install native FFmpeg with libass for subtitles and font rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libass-dev \
    fonts-freefont-ttf \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "run.py"]
