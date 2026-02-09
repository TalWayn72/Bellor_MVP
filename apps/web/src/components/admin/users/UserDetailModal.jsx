import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ProfileSection,
  BioSection,
  InterestsSection,
  ActivityStatsSection,
  ConnectionDatesSection,
  UserResponsesSection,
} from './UserDetailSections';

export default function UserDetailModal({ user, userResponses, onClose }) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details - {user.nickname || user.full_name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            View and manage user information, status, and activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <ProfileSection user={user} />
          {user.bio && <BioSection bio={user.bio} />}
          {user.interests?.length > 0 && <InterestsSection interests={user.interests} />}
          <ActivityStatsSection user={user} />
          <ConnectionDatesSection user={user} />
          <UserResponsesSection responses={userResponses} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
