import { apiClient } from '../client/apiClient';

interface VlogixUserResponsesParams {
  limit?: number;
}

interface VlogixUserResponse {
  id: string;
  mission_id?: string;
  missionId?: string;
  response_type?: string;
  responseType?: string;
  content?: string;
  text_content?: string;
  textContent?: string;
  created_at?: string;
  createdAt?: string;
  created_date?: string;
  [key: string]: unknown;
}

interface VlogixUserResponsesResponse {
  data?: VlogixUserResponse[];
  responses?: VlogixUserResponse[];
}

export const adminVlogixService = {
  async listVlogixUserResponses(
    userId: string,
    params: VlogixUserResponsesParams = {},
  ): Promise<VlogixUserResponsesResponse> {
    const response = await apiClient.get(`/admin/vlogix/users/${userId}/responses`, { params });
    return response.data as VlogixUserResponsesResponse;
  },
};
