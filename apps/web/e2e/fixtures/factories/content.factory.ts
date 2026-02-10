/**
 * E2E Content Factory
 * Mock response/mission data for Playwright E2E tests
 */

export interface MockResponse {
  id: string;
  userId: string;
  responseType: 'text' | 'video' | 'audio' | 'drawing';
  content?: string;
  textContent?: string;
  likesCount: number;
  createdDate: string;
  mission?: { id: string; title: string };
}

export function createMockResponse(
  type: 'text' | 'video' | 'audio' | 'drawing',
  overrides: Partial<MockResponse> = {}
): MockResponse {
  return {
    id: `response-${Date.now()}`,
    userId: 'user-1',
    responseType: type,
    content: type === 'text' ? undefined : 'https://example.com/media.mp4',
    textContent: type === 'text' ? 'Test text response' : undefined,
    likesCount: Math.floor(Math.random() * 100),
    createdDate: new Date().toISOString(),
    mission: { id: 'mission-1', title: 'Daily Mission' },
    ...overrides,
  };
}
