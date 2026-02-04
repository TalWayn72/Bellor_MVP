import React from 'react';

/**
 * Extracts hashtags from text and returns them as clickable links
 */
export function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\u0590-\u05FFa-zA-Z0-9_]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

export function HashtagText({ text, onHashtagClick }) {
  if (!text) return null;

  const parts = text.split(/(#[\u0590-\u05FFa-zA-Z0-9_]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onHashtagClick?.(part.toLowerCase());
              }}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export function HashtagList({ hashtags, onHashtagClick }) {
  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {hashtags.map((tag, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick?.(tag);
          }}
          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition-colors"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}