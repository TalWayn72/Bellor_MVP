import React from 'react';
import { MapPin, User, Search, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DailyStreakBadge from './DailyStreakBadge';
import ProfileCompletionCard from './ProfileCompletionCard';

export default function ProfileAboutTab({ currentUser }) {
  return (
    <div className="space-y-4">
      {/* Daily Streak */}
      <DailyStreakBadge userId={currentUser.id} />

      {/* Profile Completion */}
      <ProfileCompletionCard user={currentUser} />

      {/* About Me Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Me</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentUser.bio || "Tell us something about yourself..."}
          </p>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{currentUser.location || 'Israel'}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{currentUser.gender === 'female' ? 'Female' : currentUser.gender === 'male' ? 'Male' : 'Other'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Looking for {currentUser.looking_for === 'female' ? 'Women' : currentUser.looking_for === 'male' ? 'Men' : 'Everyone'}
            </span>
          </div>
          {currentUser.occupation && (
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground">{currentUser.occupation}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interests */}
      {currentUser.interests && currentUser.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" size="lg">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
