import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function IncomingVideoCallDialog({ incomingCall, fallbackName, onDecline, onJoin }) {
  const callerName = incomingCall?.caller?.firstName || incomingCall?.caller?.nickname || fallbackName || 'Someone';

  return (
    <Dialog open={!!incomingCall} onOpenChange={(open) => { if (!open) onDecline?.(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Incoming video call</DialogTitle>
          <DialogDescription>{callerName} is calling you.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDecline}>Decline</Button>
          <Button type="button" onClick={onJoin}>Join</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
