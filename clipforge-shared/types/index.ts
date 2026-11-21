export type ThemeMode = "dark" | "light";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  theme_preference: ThemeMode;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SourceVideo {
  id: string;
  filename: string;
  filepath?: string;
  file_size?: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  source_type: "upload" | "youtube_ref";
  youtube_url?: string;
  thumbnail_url?: string;
  stream_url?: string;
}

export type AspectRatioType = "9:16" | "16:9" | "1:1" | "custom";
export type CropPresetMode = "center" | "left" | "right" | "custom";

export interface CropSetting {
  id?: string;
  aspect_ratio: AspectRatioType;
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  zoom_level: number;
  preset_mode: CropPresetMode;
}

export type CaptionStyleName = "bold" | "clean" | "minimal" | "box" | "highlight" | "karaoke";
export type CaptionPosition = "top" | "center" | "bottom" | "custom";
export type CaptionAnimation = "word" | "sentence" | "static";

export interface CaptionPreset {
  id: string;
  name: string;
  is_system_preset?: boolean;
  style_name: CaptionStyleName;
  font_family: string;
  font_size: number;
  font_weight: string;
  primary_color: string;
  highlight_color: string;
  bg_color?: string;
  outline_color?: string;
  outline_width?: number;
  shadow_offset?: number;
  position: CaptionPosition;
  position_y?: number;
  animation_type: CaptionAnimation;
  created_at?: string;
}

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: SubtitleWord[];
}

export interface Clip {
  id: string;
  project_id: string;
  name: string;
  start_time: number;
  duration: number;
  end_time: number;
  start_formatted?: string;
  end_formatted?: string;
  status: "draft" | "queued" | "processing" | "completed" | "failed";
  progress?: number;
  output_filepath?: string;
  thumbnail_filepath?: string;
  language?: "en" | "hi" | "hi-en";
  subtitles_json?: string;
  crop_setting?: CropSetting;
  caption_preset_id?: string;
  caption_preset?: CaptionPreset;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  target_aspect_ratio: AspectRatioType;
  status: "draft" | "processing" | "ready";
  clips_count?: number;
  source_video?: SourceVideo | null;
  clips?: Clip[];
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_projects: number;
  total_clips: number;
  processing_clips: number;
  completed_exports: number;
  recent_projects: Array<{
    id: string;
    title: string;
    description?: string;
    target_aspect_ratio: AspectRatioType;
    status: string;
    clips_count: number;
    has_video: boolean;
    video_duration: number;
    created_at?: string;
  }>;
}

export interface ExportJob {
  id: string;
  project_id: string;
  clip_id?: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  resolution: "720p" | "1080p" | "1440p" | "4k";
  fps: number;
  aspect_ratio: AspectRatioType;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
  files: ExportFile[];
  zip_bundle_url?: string | null;
}

export interface ExportFile {
  id: string;
  clip_id: string;
  filename: string;
  file_size: number;
  file_size_formatted?: string;
  resolution: string;
  download_url: string;
  created_at?: string;
  clip_name?: string;
  project_title?: string;
}
