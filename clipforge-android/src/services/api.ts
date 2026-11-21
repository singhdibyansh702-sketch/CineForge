import { Platform } from 'react-native';
import {
  DashboardStats,
  Project,
  Clip,
  CaptionPreset,
  ExportJob
} from '../types';

// Android Emulator connects to host machine via 10.0.2.2
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';

class MobileApiClient {
  private baseUrl: string = DEFAULT_HOST;

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[Mobile API Error] ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/projects/dashboard/stats');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects/');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(title: string, aspect: string = '9:16'): Promise<Project> {
    return this.request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify({ title, target_aspect_ratio: aspect }),
    });
  }

  // Clips
  async getClips(projectId: string): Promise<Clip[]> {
    return this.request<Clip[]>(`/clips/project/${projectId}`);
  }

  async createClip(data: {
    project_id: string;
    name: string;
    start_time: number;
    duration: number;
    language?: string;
  }): Promise<Clip> {
    return this.request<Clip>('/clips/', {
      method: 'POST',
      body: JSON.stringify(data),
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

  // Caption Presets
  async getPresets(): Promise<CaptionPreset[]> {
    return this.request<CaptionPreset[]>('/captions/presets');
  }

  async autoTranscribe(clipId: string, language: string): Promise<any> {
    return this.request<any>(`/captions/transcribe/${clipId}`, {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  }

  // Exports
  async triggerExport(projectId: string, clipId?: string | null, resolution: string = '1080p'): Promise<any> {
    return this.request<any>('/exports/trigger', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        clip_id: clipId,
        resolution,
        fps: 30,
        aspect_ratio: '9:16',
      }),
    });
  }

  async getExportJob(jobId: string): Promise<ExportJob> {
    return this.request<ExportJob>(`/exports/jobs/${jobId}`);
  }

  async getExportHistory(): Promise<any[]> {
    return this.request<any[]>('/exports/history');
  }
}

export const mobileApi = new MobileApiClient();
