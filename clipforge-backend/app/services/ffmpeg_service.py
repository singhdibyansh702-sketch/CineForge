import os
import subprocess
import json
import re
import math
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from app.core.config import settings, SAMPLES_DIR, EXPORTS_DIR

class FFmpegService:
    def __init__(self):
        self.binary = settings.get_ffmpeg_binary()
        print(f"[FFmpegService] Using FFmpeg binary: {self.binary}")

    def run_command(self, args: list, on_progress: Optional[Callable[[float], None]] = None) -> bool:
        cmd = [self.binary] + args
        print(f"[FFmpegService] Running: {' '.join(cmd)}")
        try:
            # We capture stderr because FFmpeg prints stats to stderr
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
                encoding='utf-8',
                errors='replace'
            )
            
            duration_sec = 0.0
            duration_regex = re.compile(r"Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)")
            time_regex = re.compile(r"time=\s*(\d{2}):(\d{2}):(\d{2}\.\d+)")

            if process.stderr:
                for line in process.stderr:
                    # Look for source duration
                    d_match = duration_regex.search(line)
                    if d_match:
                        h, m, s = map(float, d_match.groups())
                        duration_sec = h * 3600 + m * 60 + s

                    # Look for current progress time
                    t_match = time_regex.search(line)
                    if t_match and duration_sec > 0 and on_progress:
                        h, m, s = map(float, t_match.groups())
                        current_sec = h * 3600 + m * 60 + s
                        progress_pct = min(100.0, max(0.0, (current_sec / duration_sec) * 100.0))
                        on_progress(progress_pct)

            process.wait()
            if process.returncode == 0:
                if on_progress:
                    on_progress(100.0)
                return True
            else:
                print(f"[FFmpegService] Error: exited with code {process.returncode}")
                return False
        except Exception as e:
            print(f"[FFmpegService] Exception running ffmpeg: {e}")
            return False

    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        info = {
            "duration": 60.0,
            "width": 1920,
            "height": 1080,
            "fps": 30.0,
            "format": "mp4"
        }
        cmd = [
            self.binary,
            "-i", str(video_path),
            "-hide_banner"
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="replace")
            output = res.stderr

            # Parse duration: Duration: 00:01:23.45
            dur_match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)", output)
            if dur_match:
                h, m, s = map(float, dur_match.groups())
                info["duration"] = round(h * 3600 + m * 60 + s, 2)

            # Parse resolution: 1920x1080
            res_match = re.search(r"Stream.*Video:.*?(\d{2,5})x(\d{2,5})", output)
            if res_match:
                info["width"] = int(res_match.group(1))
                info["height"] = int(res_match.group(2))

            # Parse fps: 30 fps or 29.97 fps
            fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", output)
            if fps_match:
                info["fps"] = float(fps_match.group(1))

        except Exception as e:
            print(f"[FFmpegService] Could not parse video info: {e}")

        return info

    def generate_thumbnail(self, video_path: str, output_path: str, timestamp_sec: float = 1.0) -> bool:
        cmd = [
            "-ss", str(max(0.0, timestamp_sec)),
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            "-vf", "scale=640:-1",
            "-y",
            str(output_path)
        ]
        return self.run_command(cmd)

    def generate_demo_source_video(
        self,
        output_path: str,
        duration: int = 10,
        width: int = 1280,
        height: int = 720
    ) -> bool:
        """
        Creates a lightweight test video with minimal memory footprint (< 35MB RAM).
        """
        box_w = int(width * 0.25)
        box_x = int((width - box_w) / 2)
        filter_str = (
            f"testsrc=duration={duration}:size={width}x{height}:rate=24,"
            f"drawbox=x={box_x}:y=0:w={box_w}:h={height}:color=purple@0.25:t=fill,"
            f"drawbox=x={box_x}:y=0:w={box_w}:h={height}:color=white@0.8:t=3"
        )
        audio_str = f"sine=frequency=440:duration={duration}"
        
        cmd = [
            "-threads", "1",
            "-f", "lavfi", "-i", filter_str,
            "-f", "lavfi", "-i", audio_str,
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "96k",
            "-shortest",
            "-y",
            str(output_path)
        ]
        return self.run_command(cmd)

    def create_ass_subtitles(
        self,
        subtitles_data: list,
        caption_preset: Optional[Any],
        output_path: str,
        video_width: int = 1080,
        video_height: int = 1920
    ) -> str:
        """
        Generates an ASS (Advanced SubStation Alpha) subtitle file.
        ASS gives 100% control over font, font size, bold, margins, colors, outlines, boxes, and karaoke timings!
        """
        font_name = getattr(caption_preset, "font_family", "Arial") if caption_preset else "Arial"
        font_size = getattr(caption_preset, "font_size", 48) if caption_preset else 48
        primary_hex = getattr(caption_preset, "primary_color", "#FFFFFF") if caption_preset else "#FFFFFF"
        highlight_hex = getattr(caption_preset, "highlight_color", "#A855F7") if caption_preset else "#A855F7"
        bg_color = getattr(caption_preset, "bg_color", "rgba(0,0,0,0.7)") if caption_preset else "rgba(0,0,0,0.7)"
        style_name = getattr(caption_preset, "style_name", "karaoke") if caption_preset else "karaoke"
        position = getattr(caption_preset, "position", "bottom") if caption_preset else "bottom"

        # Convert hex #RRGGBB to ASS &HBBGGRR&
        def hex_to_ass(h: str) -> str:
            h = h.lstrip('#')
            if len(h) == 6:
                r, g, b = h[0:2], h[2:4], h[4:6]
                return f"&H00{b}{g}{r}&"
            return "&H00FFFFFF&"

        ass_primary = hex_to_ass(primary_hex)
        ass_secondary = hex_to_ass(highlight_hex)
        ass_outline = "&H00000000&"
        ass_back = "&H80000000&" if "box" in style_name.lower() else "&H00000000&"

        # ASS Alignment: 2 = bottom-center, 5 = middle-center, 8 = top-center
        alignment = 2
        margin_v = 140
        if position == "top":
            alignment = 8
            margin_v = 160
        elif position == "center":
            alignment = 5
            margin_v = 0

        border_style = 3 if "box" in style_name.lower() else 1
        outline = 3 if border_style == 1 else 1

        ass_header = f"""[Script Info]
Title: ClipForge Dynamic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: {video_width}
PlayResY: {video_height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{ass_primary},{ass_secondary},{ass_outline},{ass_back},-1,0,0,0,100,100,0,0,{border_style},{outline},2,{alignment},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        events = []
        for item in subtitles_data:
            start_sec = item.get("start", 0.0)
            end_sec = item.get("end", start_sec + 2.0)
            text = item.get("text", "").strip()
            words = item.get("words", [])

            # ASS time format: H:MM:SS.cs (centiseconds)
            def fmt_time(s: float) -> str:
                hours = int(s // 3600)
                minutes = int((s % 3600) // 60)
                seconds = s % 60
                return f"{hours}:{minutes:02d}:{seconds:05.2f}"

            start_str = fmt_time(start_sec)
            end_str = fmt_time(end_sec)

            # Karaoke effect if style is karaoke and words are provided
            if style_name == "karaoke" and words:
                karaoke_text = ""
                for w in words:
                    w_text = w.get("word", "")
                    w_duration_cs = max(10, int((w.get("end", 0.5) - w.get("start", 0.0)) * 100))
                    karaoke_text += f"{{\\k{w_duration_cs}}}{w_text} "
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{karaoke_text.strip()}")
            elif style_name == "highlight" and words:
                # Highlight word-by-word active word
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{{\\c{ass_secondary}}}{text}{{\\c{ass_primary}}}")
            else:
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{text}")

        full_ass = ass_header + "\n".join(events) + "\n"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_ass)

        return output_path

    def process_and_export_clip(
        self,
        source_path: str,
        output_path: str,
        start_time: float,
        duration: float,
        crop_setting: Optional[Any],
        caption_preset: Optional[Any],
        subtitles_data: Optional[list],
        resolution: str = "1080p",
        fps: int = 30,
        aspect_ratio: str = "9:16",
        on_progress: Optional[Callable[[float], None]] = None
    ) -> bool:
        """
        Full professional video pipeline:
        1. Fast accurate seek (-ss before -i, duration -t)
        2. Cropping (center, left, right or custom normalized crop_x, crop_y, crop_w, crop_h)
        3. Aspect ratio resizing (e.g. 1080x1920 for 9:16 1080p, 720x1280 for 720p, 1080x1080 for 1:1)
        4. Subtitle burn-in with ASS styling
        5. Framerate conversion & faststart encoding
        """
        # Determine target dimensions
        res_map = {
            "720p": {"width": 720, "height": 1280},
            "1080p": {"width": 1080, "height": 1920},
            "1440p": {"width": 1440, "height": 2560},
            "4k": {"width": 2160, "height": 3840},
        }
        
        target_w = 1080
        target_h = 1920
        if aspect_ratio == "1:1":
            dim = 1080 if resolution != "720p" else 720
            target_w, target_h = dim, dim
        elif aspect_ratio == "16:9":
            dim = 1080 if resolution != "720p" else 720
            target_w, target_h = (1920, 1080) if resolution != "720p" else (1280, 720)
        else: # 9:16 default
            r_info = res_map.get(resolution, res_map["1080p"])
            target_w, target_h = r_info["width"], r_info["height"]

        # Build video filters
        video_filters = []

        # Crop filter calculation
        source_info = self.get_video_info(source_path)
        sw = source_info.get("width", 1920)
        sh = source_info.get("height", 1080)

        preset_mode = getattr(crop_setting, "preset_mode", "center") if crop_setting else "center"
        crop_x_norm = getattr(crop_setting, "crop_x", 0.0) if crop_setting else 0.0
        crop_y_norm = getattr(crop_setting, "crop_y", 0.0) if crop_setting else 0.0
        crop_w_norm = getattr(crop_setting, "crop_width", 1.0) if crop_setting else 1.0
        crop_h_norm = getattr(crop_setting, "crop_height", 1.0) if crop_setting else 1.0
        zoom = getattr(crop_setting, "zoom_level", 1.0) if crop_setting else 1.0

        if aspect_ratio == "9:16":
            # Target crop width from landscape 16:9
            # 9:16 crop width is sh * 9 / 16
            desired_crop_w = int(sh * 9 / 16 / zoom)
            desired_crop_h = int(sh / zoom)
            
            if preset_mode == "left":
                crop_x = 0
            elif preset_mode == "right":
                crop_x = max(0, sw - desired_crop_w)
            elif preset_mode == "custom" and crop_x_norm > 0:
                crop_x = int(crop_x_norm * sw)
            else: # center
                crop_x = max(0, int((sw - desired_crop_w) / 2))
                
            crop_y = max(0, int((sh - desired_crop_h) / 2))
            # Ensure even numbers
            desired_crop_w = (desired_crop_w // 2) * 2
            desired_crop_h = (desired_crop_h // 2) * 2
            crop_x = (crop_x // 2) * 2
            crop_y = (crop_y // 2) * 2
            video_filters.append(f"crop={desired_crop_w}:{desired_crop_h}:{crop_x}:{crop_y}")
        elif aspect_ratio == "1:1":
            crop_size = int(min(sw, sh) / zoom)
            crop_size = (crop_size // 2) * 2
            crop_x = int((sw - crop_size) / 2)
            crop_y = int((sh - crop_size) / 2)
            video_filters.append(f"crop={crop_size}:{crop_size}:{crop_x}:{crop_y}")

        # Scale to final resolution
        video_filters.append(f"scale={target_w}:{target_h}")

        # Subtitle overlay if present
        ass_path = None
        if subtitles_data and len(subtitles_data) > 0:
            ass_path = str(Path(output_path).with_suffix('.ass'))
            self.create_ass_subtitles(
                subtitles_data,
                caption_preset,
                ass_path,
                video_width=target_w,
                video_height=target_h
            )
            # Escape path for FFmpeg filter on Windows
            escaped_ass = ass_path.replace('\\', '/').replace(':', '\\:')
            video_filters.append(f"ass='{escaped_ass}'")

        vf_str = ",".join(video_filters)

        cmd = [
            "-threads", "1",
            "-ss", str(start_time),
            "-i", str(source_path),
            "-t", str(duration),
            "-vf", vf_str,
            "-r", str(fps),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-y",
            str(output_path)
        ]

        success = self.run_command(cmd, on_progress=on_progress)

        # Cleanup temporary ass file
        if ass_path and os.path.exists(ass_path):
            try:
                os.remove(ass_path)
            except Exception:
                pass

        return success

ffmpeg_service = FFmpegService()
