import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { responseService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Trash2, Settings } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardImage } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ProfileSkeleton } from '@/components/states';
import ProfileAboutTab from '@/components/profile/ProfileAboutTab';
import ProfileBookTab from '@/components/profile/ProfileBookTab';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bio');
  const { currentUser, isLoading } = useCurrentUser();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const queryClient = useQueryClient();

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try { const result = await responseService.listResponses({ userId: currentUser.id, limit: 50 }); return result.responses || []; }
      catch { return []; }
    },
    enabled: !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: async (responseId) => { await responseService.deleteResponse(responseId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userResponses', currentUser?.id] }); setSelectedResponse(null); },
  });

  if (isLoading) return (<div className="min-h-screen bg-background"><div className="max-w-2xl mx-auto px-4 py-6"><ProfileSkeleton /></div></div>);

  const tabs = [{ id: 'about', label: 'About Me' }, { id: 'book', label: 'My Book' }];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Settings'))}><MoreVertical className="w-5 h-5" /></Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{currentUser.nickname || currentUser.full_name} &bull; {currentUser.age}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-24">
        <div className="relative">
          <div className="px-4 pt-4">
            <Card variant="profile" className="rounded-3xl">
              <CardImage src={currentUser.profile_images?.[0] || `https://i.pravatar.cc/400?u=${currentUser.id}`} alt="Profile" />
              {currentUser.is_verified && (
                <div className="absolute top-4 right-4">
                  <Badge variant="verified" size="lg" className="h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </Badge>
                </div>
              )}
            </Card>
          </div>
          <div className="px-4 mt-4">
            <Card className="p-1">
              <div className="flex">
                {tabs.map((tab) => (
                  <Button key={tab.id} onClick={() => setActiveTab(tab.id)} variant={activeTab === tab.id ? 'default' : 'ghost'} className={`flex-1 rounded-xl ${activeTab === tab.id ? 'bg-foreground text-background' : ''}`}>
                    {tab.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="px-4 mt-4">
          {activeTab === 'about' && <ProfileAboutTab currentUser={currentUser} />}
          {activeTab === 'book' && <ProfileBookTab responses={responses} onSelectResponse={setSelectedResponse} />}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button onClick={() => navigate(createPageUrl('Settings'))} variant="outline" size="lg" className="flex-1 h-14 rounded-full font-medium border-2"><Settings className="w-5 h-5 ml-2" />Settings</Button>
          <Button onClick={() => navigate(createPageUrl('EditProfile'))} size="lg" className="flex-1 h-14 rounded-full font-medium">Edit Profile</Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-sm" aria-describedby="delete-post-description">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4"><Avatar size="lg" className="bg-destructive/10"><AvatarFallback className="bg-transparent"><Trash2 className="w-6 h-6 text-destructive" /></AvatarFallback></Avatar></div>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p id="delete-post-description" className="text-sm text-muted-foreground text-center">This action cannot be undone. Your post will be permanently deleted.</p>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button onClick={() => setSelectedResponse(null)} variant="outline" size="lg" className="flex-1">Cancel</Button>
            <Button onClick={() => deleteMutation.mutate(selectedResponse?.id)} variant="destructive" size="lg" className="flex-1" loading={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
