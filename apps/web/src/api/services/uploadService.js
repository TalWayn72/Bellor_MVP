/**
 * Upload Service
 * Handles file uploads to the backend
 */

import { apiClient } from '../client/apiClient';

export const uploadService = {
  /**
   * Upload a profile image
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Upload story media
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string, key: string, thumbnailUrl?: string}>}
   */
  async uploadStoryMedia(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/story-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Upload audio content
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Upload video content
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadVideo(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Delete a profile image
   * @param {string} url - The URL of the image to delete
   */
  async deleteProfileImage(url) {
    const response = await apiClient.delete('/uploads/profile-image', {
      data: { url },
    });

    return response.data.data || response.data;
  },

  /**
   * Upload a drawing/art (separate from profile images)
   * Used for onboarding sketches and user art
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadDrawing(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/drawing', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Upload response media (for mission responses)
   * Routes to appropriate endpoint based on file type
   * @param {File} file - The file to upload
   * @param {string} type - Optional type hint ('video', 'audio', 'image', 'drawing')
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadResponseMedia(file, type = null) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/response-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  },

  /**
   * Generic file upload
   * Automatically routes to correct endpoint based on file type
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string}>}
   */
  async uploadFile(file) {
    // Determine upload type based on file type
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    let result;
    if (isVideo) {
      result = await this.uploadVideo(file);
    } else if (isAudio) {
      result = await this.uploadAudio(file);
    } else if (isImage) {
      // For generic uploads, use response-media to avoid mixing with profile images
      result = await this.uploadResponseMedia(file);
    } else {
      // Default to response-media for other types
      result = await this.uploadResponseMedia(file);
    }

    // Return with url key for compatibility
    return { url: result.url };
  },
};
