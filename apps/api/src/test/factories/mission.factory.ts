/**
 * Mission & Response Test Factory
 * Mock mission/response data creation for backend tests
 */

export interface MockMission {
  id: string;
  title: string;
  description: string;
  missionType: 'DAILY' | 'WEEKLY' | 'SPECIAL';
  responseTypes: string[];
  isActive: boolean;
  publishDate: Date;
  createdAt: Date;
}

export interface MockResponse {
  id: string;
  userId: string;
  missionId: string;
  responseType: 'TEXT' | 'AUDIO' | 'VIDEO' | 'IMAGE' | 'DRAWING';
  textContent: string | null;
  isPublic: boolean;
  likesCount: number;
  viewsCount: number;
  createdAt: Date;
}

export const createMockMission = (overrides: Partial<MockMission> = {}): MockMission => ({
  id: 'test-mission-id',
  title: 'Test Mission',
  description: 'This is a test mission',
  missionType: 'DAILY',
  responseTypes: ['TEXT'],
  isActive: true,
  publishDate: new Date(),
  createdAt: new Date(),
  ...overrides,
});

export const createMockResponse = (overrides: Partial<MockResponse> = {}): MockResponse => ({
  id: 'test-response-id',
  userId: 'test-user-id',
  missionId: 'test-mission-id',
  responseType: 'TEXT',
  textContent: 'This is my response',
  isPublic: true,
  likesCount: 0,
  viewsCount: 0,
  createdAt: new Date(),
  ...overrides,
});
