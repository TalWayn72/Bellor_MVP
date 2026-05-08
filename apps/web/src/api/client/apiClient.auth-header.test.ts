import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';

const axiosInstance = (apiClient as unknown as {
  client: import('axios').AxiosInstance;
}).client;

describe('apiClient auth header guard', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue(null);
    mock = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('does not send Authorization when stored token is literal undefined', async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue('undefined');

    mock.onGet('/auth/me').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { id: 'user-1' }];
    });

    await apiClient.get('/auth/me');
  });
});
