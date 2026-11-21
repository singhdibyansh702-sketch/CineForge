import {
  AuthResponse,
  DashboardStats,
  Project,
  Clip,
  CaptionPreset,
  ExportJob,
  ExportFile,
  SubtitleSegment
} from '../types';

// In development and production, prefer relative /api/v1 to route through Vite proxy or same-origin
// If VITE_API_URL is explicitly set, use it.
const ENV_API_URL = (import.meta as any).env?.VITE_API_URL;
const API_BASE = ENV_API_URL || '/api/v1';

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (ENV_API_URL && ENV_API_URL.startsWith('http')) {
    const origin = new URL(ENV_API_URL).origin;
    return `${origin}${url}`;
  }
  return url;
};

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('clipforge_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('clipforge_token', token);
    } else {
      localStorage.removeItem('clipforge_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Default to JSON if body is not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      let response: Response;
      try {
        response = await fetch(url, { ...options, headers });
      } catch (networkErr: any) {
        // Fallback directly to 127.0.0.1:8000 if relative proxy or localhost failed
        const fallbackUrl = `http://127.0.0.1:8000/api/v1${endpoint}`;
        if (url !== fallbackUrl) {
          try {
            response = await fetch(fallbackUrl, { ...options, headers });
          } catch {
            throw new Error(
              "Backend server is offline. Please start it by running 'python run.py' inside the 'clipforge-backend' folder (listening on http://127.0.0.1:8000)."
            );
          }
        } else {
          throw new Error(
            "Backend server is offline. Please start it by running 'python run.py' inside the 'clipforge-backend' folder (listening on http://127.0.0.1:8000)."
          );
        }
      }

      if (!response.ok) {
        let errMessage = `HTTP Error ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errMessage;
        } catch {
          // not json
        }
        throw new Error(errMessage);
      }

      // Check if response is json
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return (await response.text()) as unknown as T;
    } catch (err: any) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateTheme(themePreference: 'dark' | 'light') {
    return this.request<any>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ theme_preference: themePreference }),
    });
  }

  // Dashboard & Projects
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/projects/dashboard/stats');
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects/');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: { title: string; description?: string; target_aspect_ratio?: string }): Promise<Project> {
    return this.request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Video Management
  async uploadVideo(projectId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);

    return this.request<any>('/videos/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async registerYouTube(projectId: string, youtubeUrl: string): Promise<any> {
    return this.request<any>('/videos/youtube-ref', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, youtube_url: youtubeUrl }),
    });
  }

  async generateSampleVideo(projectId: string, duration: number = 60): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('duration', duration.toString());

    return this.request<any>('/videos/sample', {
      method: 'POST',
      body: formData,
    });
  }

  // Clips & Timestamps
  async getClips(projectId: string): Promise<Clip[]> {
    return this.request<Clip[]>(`/clips/project/${projectId}`);
  }

  async createClip(data: {
    project_id: string;
    name: string;
    start_time: number;
    duration: number;
    caption_preset_id?: string;
    crop_setting?: any;
    language?: string;
  }): Promise<Clip> {
    return this.request<Clip>('/clips/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createClipsBatch(projectId: string, clips: Array<{
    name: string;
    start_time: number;
    duration: number;
    language?: string;
  }>): Promise<Clip[]> {
    return this.request<Clip[]>('/clips/batch', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        clips: clips.map(c => ({
          project_id: projectId,
          ...c
        }))
      }),
    });
  }

  async updateClip(clipId: string, data: any): Promise<any> {
    return this.request<any>(`/clips/${clipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async duplicateClip(clipId: string): Promise<any> {
    return this.request<any>(`/clips/${clipId}/duplicate`, {
      method: 'POST',
    });
  }

  async deleteClip(clipId: string): Promise<any> {
    return this.request<any>(`/clips/${clipId}`, {
      method: 'DELETE',
    });
  }

  // Caption Presets & Subtitles
  async getPresets(): Promise<CaptionPreset[]> {
    return this.request<CaptionPreset[]>('/captions/presets');
  }

  async createPreset(data: Partial<CaptionPreset>): Promise<any> {
    return this.request<any>('/captions/presets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePreset(presetId: string): Promise<any> {
    return this.request<any>(`/captions/presets/${presetId}`, {
      method: 'DELETE',
    });
  }

  async autoTranscribe(clipId: string, language: string = 'en'): Promise<any> {
    return this.request<any>(`/captions/transcribe/${clipId}`, {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  }

  async updateSubtitles(clipId: string, segments: SubtitleSegment[]): Promise<any> {
    return this.request<any>(`/captions/subtitles/${clipId}`, {
      method: 'PUT',
      body: JSON.stringify({ segments }),
    });
  }

  // Exports
  async triggerExport(data: {
    project_id: string;
    clip_id?: string | null;
    resolution?: string;
    fps?: number;
    aspect_ratio?: string;
    format?: string;
  }): Promise<{ message: string; job_id: string; upscale_warning?: string }> {
    return this.request<any>('/exports/trigger', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExportJob(jobId: string): Promise<ExportJob> {
    return this.request<ExportJob>(`/exports/jobs/${jobId}`);
  }

  async getExportHistory(): Promise<ExportFile[]> {
    return this.request<ExportFile[]>('/exports/history');
  }
}

export const api = new ApiClient();
