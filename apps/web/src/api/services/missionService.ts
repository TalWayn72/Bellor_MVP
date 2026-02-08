/**
 * Mission Service
 * Handles all mission-related API calls
 */

import { apiClient } from '../client/apiClient';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface MissionListParams {
  limit?: number;
  offset?: number;
  type?: string;
  isActive?: boolean;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type?: string;
  difficulty?: string;
  xp_reward?: number;
  active_from?: string;
  active_until?: string;
  [key: string]: unknown;
}

interface MissionListResponse {
  data: Mission[];
  pagination?: Pagination;
}

interface MissionResponse {
  data: Mission;
}

interface CreateMissionData {
  title: string;
  description: string;
  missionType?: string;
  difficulty?: string;
  xpReward?: number;
  activeFrom?: string;
  activeUntil?: string;
}

interface DeleteMissionResponse {
  success: boolean;
}

export const missionService = {
  async listMissions(params: MissionListParams = {}): Promise<MissionListResponse> {
    const response = await apiClient.get('/missions', { params });
    return response.data as MissionListResponse;
  },

  async getTodaysMission(): Promise<MissionResponse> {
    const response = await apiClient.get('/missions/today');
    return response.data as MissionResponse;
  },

  async getMissionById(id: string): Promise<MissionResponse> {
    const response = await apiClient.get(`/missions/${id}`);
    return response.data as MissionResponse;
  },

  async createMission(data: CreateMissionData): Promise<MissionResponse> {
    const response = await apiClient.post('/missions', data);
    return response.data as MissionResponse;
  },

  async updateMission(id: string, data: Partial<CreateMissionData>): Promise<MissionResponse> {
    const response = await apiClient.patch(`/missions/${id}`, data);
    return response.data as MissionResponse;
  },

  async deleteMission(id: string): Promise<DeleteMissionResponse> {
    const response = await apiClient.delete(`/missions/${id}`);
    return response.data as DeleteMissionResponse;
  },
};
