import { describe, it, expect } from 'vitest';
import {
  transformResponse, transformResponses,
  transformLike, transformLikes,
  transformComment, transformComments,
  transformStory, transformFollow,
} from './responseTransformer';

describe('[P1][content] responseTransformer', () => {
  describe('transformResponse', () => {
    it('returns null/undefined as-is', () => {
      expect(transformResponse(null)).toBeNull();
      expect(transformResponse(undefined)).toBeUndefined();
    });

    it('passes through data that already has snake_case fields', () => {
      const demo = { id: 'r1', user_id: 'u1', response_type: 'text', text_content: 'hi' };
      const result = transformResponse(demo);
      expect(result).toEqual(demo);
    });

    it('transforms camelCase API response to snake_case', () => {
      const api = {
        id: 'r1', userId: 'u1', missionId: 'm1', responseType: 'video',
        textContent: 'hello', thumbnailUrl: 'http://img.jpg',
        viewCount: 10, likeCount: 5, commentCount: 3,
        isPublic: true, createdAt: '2026-01-01T00:00:00Z',
        mentionedUserIds: ['u2'], personalPromptPrefix: 'Tell me',
        hashtags: ['fun'],
      };
      const result = transformResponse(api);
      expect(result.user_id).toBe('u1');
      expect(result.mission_id).toBe('m1');
      expect(result.response_type).toBe('video');
      expect(result.text_content).toBe('hello');
      expect(result.thumbnail_url).toBe('http://img.jpg');
      expect(result.view_count).toBe(10);
      expect(result.likes_count).toBe(5);
      expect(result.comments_count).toBe(3);
      expect(result.is_public).toBe(true);
      expect(result.created_date).toBe('2026-01-01T00:00:00Z');
      expect(result.mentioned_user_ids).toEqual(['u2']);
      expect(result.personal_prompt_prefix).toBe('Tell me');
      expect(result.hashtags).toEqual(['fun']);
    });

    it('preserves original camelCase fields via spread', () => {
      const api = { id: 'r1', userId: 'u1', responseType: 'text', extraField: 'kept' };
      const result = transformResponse(api);
      expect(result.extraField).toBe('kept');
      expect(result.id).toBe('r1');
    });

    it('defaults missing numeric fields to 0', () => {
      const api = { id: 'r1', userId: 'u1', responseType: 'text' };
      const result = transformResponse(api);
      expect(result.view_count).toBe(0);
      expect(result.likes_count).toBe(0);
      expect(result.comments_count).toBe(0);
    });
  });

  describe('transformResponses', () => {
    it('transforms an array of responses', () => {
      const arr = [
        { id: 'r1', userId: 'u1', responseType: 'text' },
        { id: 'r2', userId: 'u2', responseType: 'video' },
      ];
      const result = transformResponses(arr);
      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe('u1');
      expect(result[1].user_id).toBe('u2');
    });

    it('returns empty array for non-array input', () => {
      expect(transformResponses(null)).toEqual([]);
      expect(transformResponses(undefined)).toEqual([]);
    });
  });

  describe('transformLike', () => {
    it('returns null/undefined as-is', () => {
      expect(transformLike(null)).toBeNull();
    });

    it('preserves existing snake_case fields', () => {
      const like = { id: 'l1', user_id: 'u1', like_type: 'ROMANTIC' };
      const result = transformLike(like);
      expect(result.user_id).toBe('u1');
      expect(result.like_type).toBe('ROMANTIC');
    });

    it('transforms camelCase like to snake_case', () => {
      const api = { id: 'l1', userId: 'u1', targetUserId: 'u2', likeType: 'POSITIVE', createdAt: '2026-01-01' };
      const result = transformLike(api);
      expect(result.user_id).toBe('u1');
      expect(result.target_user_id).toBe('u2');
      expect(result.like_type).toBe('POSITIVE');
      expect(result.created_date).toBe('2026-01-01');
    });
  });

  describe('transformComment', () => {
    it('transforms camelCase comment to snake_case', () => {
      const api = { id: 'c1', userId: 'u1', responseId: 'r1', createdAt: '2026-01-01' };
      const result = transformComment(api);
      expect(result.user_id).toBe('u1');
      expect(result.response_id).toBe('r1');
      expect(result.created_date).toBe('2026-01-01');
    });
  });

  describe('transformStory', () => {
    it('transforms camelCase story to snake_case', () => {
      const api = { id: 's1', userId: 'u1', mediaUrl: 'http://v.mp4', mediaType: 'video', caption: 'hi', createdAt: '2026-01-01', expiresAt: '2026-01-02' };
      const result = transformStory(api);
      expect(result.user_id).toBe('u1');
      expect(result.media_url).toBe('http://v.mp4');
      expect(result.media_type).toBe('video');
      expect(result.text_content).toBe('hi');
    });
  });

  describe('transformFollow', () => {
    it('transforms camelCase follow to snake_case', () => {
      const api = { id: 'f1', followerId: 'u1', followingId: 'u2', createdAt: '2026-01-01' };
      const result = transformFollow(api);
      expect(result.follower_id).toBe('u1');
      expect(result.following_id).toBe('u2');
    });
  });
});
