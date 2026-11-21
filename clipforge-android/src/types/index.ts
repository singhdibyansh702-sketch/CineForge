export type ThemeMode = "dark" | "light";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  theme_preference: ThemeMode;
  created_at?: string;
}

export interface SourceVideo {
  id: string;
  filename: string;
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
  position: CaptionPosition;
  animation_type: CaptionAnimation;
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
  status: string;
  progress: number;
  resolution: string;
  files: Array<{
    id: string;
    filename: string;
    file_size_formatted?: string;
    download_url: string;
  }>;
  zip_bundle_url?: string;
}
