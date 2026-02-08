import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Extracts mentions from text (@username pattern)
 */
export function extractMentions(text) {
  if (!text) return [];
  const mentionRegex = /@[\u0590-\u05FFa-zA-Z0-9_]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

export function MentionText({ text, mentionedUsers = [] }) {
  const navigate = useNavigate();
  
  if (!text) return null;

  const parts = text.split(/(@[\u0590-\u05FFa-zA-Z0-9_]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const username = part.substring(1).toLowerCase();
          const user = mentionedUsers.find(u => 
            u.nickname?.toLowerCase() === username || 
            u.full_name?.toLowerCase() === username
          );
          
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (user?.id && user.id !== 'undefined') {
                  navigate(createPageUrl(`UserProfile?id=${user.id}`));
                }
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

export function MentionList({ mentionedUsers, onMentionClick }) {
  const navigate = useNavigate();
  
  if (!mentionedUsers || mentionedUsers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {mentionedUsers.map((user, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (user.id && user.id !== 'undefined') navigate(createPageUrl(`UserProfile?id=${user.id}`));
          }}
          className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full hover:bg-purple-100 transition-colors flex items-center gap-1"
        >
          <span>@{user.nickname || user.full_name}</span>
        </button>
      ))}
    </div>
  );
}