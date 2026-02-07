import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { FileText, Video, Mic, Pencil, Heart } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Creation() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const { data: todayMission } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try {
        const result = await missionService.getTodaysMission();
        return result.data;
      } catch (error) {
        return null;
      }
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await responseService.listResponses({ userId: currentUser.id, limit: 50 });
        return result.responses || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const taskOptions = [
    {
      id: 'write',
      title: 'Write',
      icon: FileText,
      color: 'bg-blue-500',
      path: 'WriteTask'
    },
    {
      id: 'video',
      title: 'Video',
      icon: Video,
      color: 'bg-red-500',
      path: 'VideoTask'
    },
    {
      id: 'audio',
      title: 'Audio',
      icon: Mic,
      color: 'bg-green-500',
      path: 'AudioTask'
    },
    {
      id: 'drawing',
      title: 'Drawing',
      icon: Pencil,
      color: 'bg-purple-500',
      path: 'Onboarding?step=13'
    }
  ];

  const totalResponses = responses.length;
  const totalLikes = responses.reduce((sum, r) => sum + (r.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Creation</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Daily Task Section */}
        {todayMission && (
          <Card variant="glass" className="bg-gradient-to-br from-gray-900 to-gray-800 border-0 rounded-3xl mb-6">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-2">Daily Task</h2>
              <p className="text-sm text-white/90 leading-relaxed mb-4">
                {todayMission.question || "Share something interesting about yourself today"}
              </p>
              <p className="text-xs text-white/60">Choose your way to share</p>
            </CardContent>
          </Card>
        )}

        {/* Task Options Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {taskOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => navigate(createPageUrl(option.path))}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl hover:bg-muted transition-colors shadow-sm h-auto"
            >
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                <option.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{option.title}</span>
            </Button>
          ))}
        </div>

        {/* Stats Section */}
        <Card className="rounded-2xl shadow-sm mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-base mb-4 text-foreground">My Creations</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-4 bg-muted border-0">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-foreground">{totalResponses}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total creations</div>
                </CardContent>
              </Card>
              <Card className="text-center p-4 bg-muted border-0">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-love">{totalLikes}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hearts</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* User Responses Grid */}
        <div className="grid grid-cols-2 gap-3">
          {responses.length === 0 ? (
            <Card className="col-span-2 rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center">
                <svg className="w-16 h-16 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-muted-foreground">No content created yet</p>
                <p className="text-xs text-muted-foreground mt-2">Choose a creation type above to start</p>
              </CardContent>
            </Card>
          ) : (
            responses.map((response) => (
              <Card key={response.id} className="rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative">
                  {response.response_type === 'text' && (
                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                      <p className="text-xs text-foreground text-center line-clamp-4">
                        {response.text_content}
                      </p>
                    </div>
                  )}
                  {response.response_type === 'drawing' && response.content && (
                    <img
                      src={response.content}
                      alt="Drawing"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {response.response_type === 'video' && response.content && (
                    <video
                      src={response.content}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {response.response_type === 'voice' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  )}
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {(response.created_date || response.createdAt)
                        ? new Date(response.created_date || response.createdAt).toLocaleDateString('he-IL')
                        : ''}
                    </p>
                    {response.likes_count > 0 && (
                      <Badge variant="ghost" className="gap-1 px-1">
                        <Heart className="w-3 h-3 text-love fill-love" />
                        <span className="text-xs">{response.likes_count}</span>
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
