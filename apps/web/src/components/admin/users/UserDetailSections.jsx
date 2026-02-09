import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatLocation } from '@/utils/userTransformer';

export function ProfileSection({ user }) {
  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h3>
        <div className="flex gap-6">
          <Avatar size="xl" className="w-32 h-32">
            <AvatarImage src={user.profile_images?.[0] || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.full_name} />
            <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Name', user.full_name], ['Nickname', user.nickname || 'Not set'],
                ['Email', user.email], ['Age', user.age || 'Not set'],
                ['Location', formatLocation(user.location)], ['Phone', user.phone || 'Not set'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BioSection({ bio }) {
  return (
    <Card className="bg-muted"><CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Bio</h3>
      <p className="text-foreground leading-relaxed">{bio}</p>
    </CardContent></Card>
  );
}

export function InterestsSection({ interests }) {
  return (
    <Card className="bg-muted"><CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, idx) => <Badge key={idx} variant="secondary" size="lg">{interest}</Badge>)}
      </div>
    </CardContent></Card>
  );
}

export function ActivityStatsSection({ user }) {
  const stats = [
    { value: user.response_count || 0, label: 'Responses' },
    { value: user.chat_count || 0, label: 'Chats' },
    { value: user.mission_completed_count || 0, label: 'Tasks' },
  ];
  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Activity Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ value, label }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ConnectionDatesSection({ user }) {
  const rows = [
    { label: 'Registration Date', value: new Date(user.created_date).toLocaleDateString('en-US'), show: true },
    { label: 'Last Login', value: user.last_active_date ? new Date(user.last_active_date).toLocaleDateString('en-US') : null, show: !!user.last_active_date },
    { label: 'Onboarding Completed', value: user.onboarding_completed ? 'Yes' : 'No', show: true },
  ];
  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Connection Report</h3>
        <div className="space-y-3">
          {rows.filter(r => r.show).map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserResponsesSection({ responses = [] }) {
  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Book - User Content ({responses.length})</h3>
        {responses.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {responses.map((response) => (
              <Card key={response.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {response.response_type === 'text' && (
                    <div className="absolute inset-0 p-3 flex items-center justify-center">
                      <p className="text-xs text-foreground text-center line-clamp-4">{response.text_content}</p>
                    </div>
                  )}
                  {response.response_type === 'drawing' && response.content && (
                    <img src={response.content} alt="Drawing" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {response.response_type === 'video' && response.content && (
                    <video src={response.content} className="w-full h-full object-cover" />
                  )}
                  {response.response_type === 'voice' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="text-xs text-muted-foreground">{new Date(response.created_date).toLocaleDateString('en-US')}</p>
                  <p className="text-xs text-muted-foreground">&#10084;&#65039; {response.likes_count || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">User has not shared any content yet</p>
        )}
      </CardContent>
    </Card>
  );
}
