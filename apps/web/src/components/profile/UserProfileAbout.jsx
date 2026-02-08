import React from 'react';
import { MapPin, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatLocation } from '@/utils';

export default function UserProfileAbout({ viewedUser, responses }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {viewedUser.bio}
          </p>
        </CardContent>
      </Card>

      {responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shared Moments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {responses
                .filter(r => r.response_type === 'drawing' || r.response_type === 'video')
                .slice(0, 4)
                .map((response) => (
                  <div key={response.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                    {response.response_type === 'drawing' && response.content && (
                      <img src={response.content} alt="Response" className="w-full h-full object-cover" />
                    )}
                    {response.response_type === 'video' && response.content && (
                      <video src={response.content} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{formatLocation(viewedUser.location)}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{viewedUser.gender === 'female' ? '\u05e0\u05e7\u05d1\u05d4' : '\u05d6\u05db\u05e8'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {'\u05de\u05d7\u05e4\u05e9/\u05ea'} {viewedUser.looking_for === 'female' ? '\u05e0\u05e9\u05d9\u05dd' : '\u05d2\u05d1\u05e8\u05d9\u05dd'}
            </span>
          </div>
        </CardContent>
      </Card>

      {viewedUser.interests && viewedUser.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {viewedUser.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" size="lg">{interest}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
