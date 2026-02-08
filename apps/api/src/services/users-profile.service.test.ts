/**
 * Users Service Unit Tests - Update Profile
 *
 * Tests for updateUserProfile including field mapping,
 * validation, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('UsersService - updateUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update user profile successfully', async () => {
    const mockUser = createMockUser();
    const updateInput = { firstName: 'Jane', lastName: 'Smith', bio: 'Updated bio' };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, ...updateInput } as any);

    const result = await UsersService.updateUserProfile('test-user-id', updateInput);

    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(result.bio).toBe('Updated bio');
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      UsersService.updateUserProfile('non-existent-id', { firstName: 'Test' })
    ).rejects.toThrow('User not found');
  });

  it('should only update firstName when provided', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { firstName: 'NewName' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'NewName',
        }),
      })
    );
  });

  it('should only update lastName when provided', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { lastName: 'NewLastName' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastName: 'NewLastName',
        }),
      })
    );
  });

  it('should only update bio when provided', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { bio: 'New bio text' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bio: 'New bio text',
        }),
      })
    );
  });

  it('should return updated user with selected fields', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { firstName: 'Test' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }),
      })
    );
  });

  it('should update multiple fields at once', async () => {
    const mockUser = createMockUser();
    const updateInput = { firstName: 'New', lastName: 'Name', bio: 'New bio' };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, ...updateInput } as any);

    await UsersService.updateUserProfile('test-user-id', updateInput);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(updateInput),
      })
    );
  });

  it('should always set lastActiveAt when updating profile', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { firstName: 'Test' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastActiveAt: expect.any(Date),
        }),
      })
    );
  });

  it('should map nickname to firstName', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { nickname: 'NickName' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstName: 'NickName' }),
      })
    );
  });

  it('should map profile_images to profileImages', async () => {
    const mockUser = createMockUser();
    const images = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { profile_images: images });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileImages: images }),
      })
    );
  });

  it('should convert gender to uppercase', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { gender: 'male' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gender: 'MALE' }),
      })
    );
  });

  it('should convert age to birthDate', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { age: 25 });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ birthDate: expect.any(Date) }),
      })
    );
  });

  it('should convert string location to object', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { location: 'Tel Aviv' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ location: { city: 'Tel Aviv' } }),
      })
    );
  });

  it('should include expanded select fields', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await UsersService.updateUserProfile('test-user-id', { bio: 'test' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          location: true,
          lookingFor: true,
          lastActiveAt: true,
        }),
      })
    );
  });
});
