import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, X, Star } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { formatLocation } from '@/utils/userTransformer';
import { Card } from '@/components/ui/card';

export default function DiscoverCard({
  profile,
  onLike,
  onPass,
  onSuperLike,
}) {
  const navigate = useNavigate();

  if (!profile) return null;

  return (
    <>
      {/* Profile Card */}
      <Card className="rounded-3xl overflow-hidden shadow-lg mb-6">
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          <img
            src={profile.profile_images?.[0] || `https://i.pravatar.cc/600?u=${profile.id}`}
            alt={profile.nickname}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">
              {profile.nickname}, {profile.age}
            </h2>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{formatLocation(profile.location)}</span>
            </div>
            <p className="text-sm opacity-90 mb-3">{profile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests?.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onPass}
          aria-label="Pass on this profile"
          className="w-16 h-16 rounded-full bg-card shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-border"
        >
          <X className="w-8 h-8 text-muted-foreground" />
        </button>
        <button
          onClick={onSuperLike}
          aria-label="Super like this profile"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-superlike to-info shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Star className="w-7 h-7 text-white fill-white" />
        </button>
        <button
          onClick={() => profile.id && profile.id !== 'undefined' && navigate(createPageUrl(`UserProfile?id=${profile.id}`))}
          aria-label="View profile details"
          className="w-14 h-14 rounded-full bg-card shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-border"
        >
          <span className="text-2xl">&#8505;&#65039;</span>
        </button>
        <button
          onClick={onLike}
          aria-label="Like this profile"
          className="w-16 h-16 rounded-full bg-gradient-to-br from-love to-destructive shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className="w-8 h-8 text-white fill-white" />
        </button>
      </div>
    </>
  );
}
