import React from 'react';
import { Calendar, Users, Video, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const eventTypeIcons = {
  speed_dating: '\uD83D\uDC98',
  group_chat: '\uD83D\uDCAC',
  game_night: '\uD83C\uDFAE',
  workshop: '\uD83C\uDF93',
  mixer: '\uD83C\uDF77'
};

export function getDemoEvents() {
  const now = new Date();
  return [
    {
      id: '1', title: 'Speed Dating Night',
      description: 'Meet multiple people in quick 5-minute video dates',
      event_type: 'speed_dating',
      scheduled_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 90, max_participants: 20, is_premium_only: false
    },
    {
      id: '2', title: 'Wine & Chat Mixer',
      description: 'Casual group video chat with wine tasting tips',
      event_type: 'mixer',
      scheduled_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60, max_participants: 15, is_premium_only: true
    },
    {
      id: '3', title: 'Game Night',
      description: 'Play fun online games and meet new people',
      event_type: 'game_night',
      scheduled_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 120, max_participants: 30, is_premium_only: false
    }
  ];
}

export default function EventCard({ event, isRegistered, onRegister, isPending }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-match to-love flex items-center justify-center text-2xl">
              {eventTypeIcons[event.event_type]}
            </div>
            <div>
              <h3 className="font-bold text-base mb-1 text-foreground">{event.title}</h3>
              {event.is_premium_only && (
                <span className="text-xs bg-premium/20 text-premium px-2 py-1 rounded-full">
                  Premium Only
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(event.scheduled_at), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="w-4 h-4" />
            <span>{event.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Users className="w-4 h-4" />
            <span>Max {event.max_participants} participants</span>
          </div>
        </div>

        {isRegistered ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-success/10 text-success rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Registered</span>
          </div>
        ) : (
          <Button
            onClick={() => onRegister(event.id)}
            disabled={isPending}
            className="w-full h-12 rounded-xl"
          >
            <Video className="w-5 h-5 ml-2" />
            Register for Event
          </Button>
        )}
      </div>
    </div>
  );
}

export function PastEventCard({ event }) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm opacity-60 border border-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
          {eventTypeIcons[event.event_type]}
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">{event.title}</h3>
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.scheduled_at), 'PPP')}
          </p>
        </div>
      </div>
    </div>
  );
}
