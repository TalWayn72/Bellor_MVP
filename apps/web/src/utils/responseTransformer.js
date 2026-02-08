/**
 * Response/Like/Comment Data Transformers
 * Normalizes API camelCase responses to snake_case format expected by frontend components.
 * Demo data already uses snake_case, so it passes through unchanged.
 */

/**
 * Transform a single response from API (camelCase) to frontend format (snake_case)
 */
export function transformResponse(r) {
  if (!r) return r;
  // If already has snake_case fields (demo data), return as-is
  if (r.user_id && r.response_type) return r;

  return {
    ...r,
    user_id: r.user_id || r.userId,
    mission_id: r.mission_id || r.missionId,
    response_type: r.response_type || r.responseType,
    text_content: r.text_content || r.textContent,
    thumbnail_url: r.thumbnail_url || r.thumbnailUrl,
    view_count: r.view_count ?? r.viewCount ?? 0,
    likes_count: r.likes_count ?? r.likeCount ?? 0,
    comments_count: r.comments_count ?? r.commentCount ?? 0,
    is_public: r.is_public ?? r.isPublic ?? true,
    created_date: r.created_date || r.createdAt,
    mentioned_user_ids: r.mentioned_user_ids || r.mentionedUserIds || [],
    personal_prompt_prefix: r.personal_prompt_prefix || r.personalPromptPrefix,
    hashtags: r.hashtags || [],
  };
}

/**
 * Transform an array of responses
 */
export function transformResponses(responses) {
  if (!Array.isArray(responses)) return [];
  return responses.map(transformResponse);
}

/**
 * Transform a single like from API to frontend format
 */
export function transformLike(like) {
  if (!like) return like;
  return {
    ...like,
    user_id: like.user_id || like.userId,
    target_user_id: like.target_user_id || like.targetUserId,
    target_response_id: like.target_response_id || like.targetResponseId,
    like_type: like.like_type || like.likeType,
    created_date: like.created_date || like.createdAt,
  };
}

/**
 * Transform an array of likes
 */
export function transformLikes(likes) {
  if (!Array.isArray(likes)) return [];
  return likes.map(transformLike);
}

/**
 * Transform a single comment from API to frontend format
 */
export function transformComment(comment) {
  if (!comment) return comment;
  return {
    ...comment,
    user_id: comment.user_id || comment.userId,
    response_id: comment.response_id || comment.responseId,
    text_content: comment.text_content || comment.textContent || comment.content,
    created_date: comment.created_date || comment.createdAt,
  };
}

/**
 * Transform an array of comments
 */
export function transformComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map(transformComment);
}

/**
 * Transform a story from API to frontend format
 */
export function transformStory(story) {
  if (!story) return story;
  return {
    ...story,
    user_id: story.user_id || story.userId,
    media_type: story.media_type || story.mediaType,
    media_url: story.media_url || story.mediaUrl,
    thumbnail_url: story.thumbnail_url || story.thumbnailUrl,
    text_content: story.text_content || story.caption,
    view_count: story.view_count ?? story.viewCount ?? 0,
    created_date: story.created_date || story.createdAt,
    expires_at: story.expires_at || story.expiresAt,
  };
}

/**
 * Transform a follow object from API to frontend format
 */
export function transformFollow(follow) {
  if (!follow) return follow;
  return {
    ...follow,
    follower_id: follow.follower_id || follow.followerId,
    following_id: follow.following_id || follow.followingId,
    created_date: follow.created_date || follow.createdAt,
  };
}
