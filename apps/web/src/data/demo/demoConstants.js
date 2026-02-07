/**
 * Demo Data Constants
 * Prefixes, image URLs, and legacy ID mappings
 */

// Demo ID prefix
export const DEMO_PREFIX = 'demo-';

// Unsplash image URLs for demo users
export const DEMO_IMAGES = {
  sarah: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
  ],
  david: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  ],
  michael: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  ],
  maria: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  ],
  alex: [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  ],
};

// Legacy ID mapping - map old IDs to standardized IDs
export const LEGACY_ID_MAP = {
  'demo-match-user-1-romantic': 'demo-user-1',
  'demo-match-user-1-positive': 'demo-user-3',
  'demo-match-user-2-positive': 'demo-user-4',
  'demo-match-user-3-super': 'demo-user-2',
  'demo-story-user-1': 'demo-user-1',
  'demo-story-user-2': 'demo-user-2',
  'demo-discover-1': 'demo-user-1',
  'demo-discover-2': 'demo-user-2',
  'demo-follower-user-1': 'demo-user-1',
  'demo-following-user-1': 'demo-user-2',
  'mock-user': 'demo-user-1',
};
