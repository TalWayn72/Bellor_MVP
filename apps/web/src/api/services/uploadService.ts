/**
 * Upload Service
 * Handles file uploads to the backend
 */

import { apiClient } from '../client/apiClient';

interface UploadResponse {
  url: string;
  key: string;
  profile_images?: string[];
}

interface StoryMediaUploadResponse extends UploadResponse {
  thumbnailUrl?: string;
}

interface GenericUploadResponse {
  url: string;
}

export const uploadService = {
  async uploadProfileImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async uploadStoryMedia(file: File): Promise<StoryMediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/story-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: StoryMediaUploadResponse } & StoryMediaUploadResponse;
    return data.data || data;
  },

  async uploadAudio(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async uploadVideo(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async deleteProfileImage(url: string): Promise<UploadResponse> {
    const response = await apiClient.delete('/uploads/profile-image', {
      data: { url },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async uploadDrawing(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/drawing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async uploadResponseMedia(file: File, _type: string | null = null): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/response-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data as { data?: UploadResponse } & UploadResponse;
    return data.data || data;
  },

  async uploadFile(file: File): Promise<GenericUploadResponse> {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    let result: UploadResponse;
    if (isVideo) {
      result = await this.uploadVideo(file);
    } else if (isAudio) {
      result = await this.uploadAudio(file);
    } else if (isImage) {
      result = await this.uploadResponseMedia(file);
    } else {
      result = await this.uploadResponseMedia(file);
    }

    return { url: result.url };
  },
};
