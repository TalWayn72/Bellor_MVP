import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Video, Clock, CheckCircle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { CardsSkeleton } from '@/components/states';
import { format } from 'date-fns';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function VirtualEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Demo events data
  const getDemoEvents = () => {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Speed Dating Night',
        description: 'Meet multiple people in quick 5-minute video dates',
        event_type: 'speed_dating',
        scheduled_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 90,
        max_participants: 20,
        is_premium_only: false
      },
      {
        id: '2',
        title: 'Wine & Chat Mixer',
        description: 'Casual group video chat with wine tasting tips',
        event_type: 'mixer',
        scheduled_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        max_participants: 15,
        is_premium_only: true
      },
      {
        id: '3',
        title: 'Game Night',
        description: 'Play fun online games and meet new people',
        event_type: 'game_night',
        scheduled_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 120,
        max_participants: 30,
        is_premium_only: false
      }
    ];
  };

  // Local state for registrations (demo mode)
  const [localRegistrations, setLocalRegistrations] = useState([]);

  const { data: events = [] } = useQuery({
    queryKey: ['virtualEvents'],
    queryFn: async () => {
      return getDemoEvents();
    },
  });

  const { data: myRegistrations = localRegistrations } = useQuery({
    queryKey: ['myEventRegistrations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return localRegistrations;
    },
    enabled: !!currentUser,
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId) => {
      // Log event registration (VirtualEvent service can be added in future)
      const registration = {
        event_id: eventId,
        user_id: currentUser.id,
        status: 'registered',
        registered_at: new Date().toISOString()
      };
      console.log('Event registration:', registration);
      return registration;
    },
    onSuccess: (registration) => {
      setLocalRegistrations(prev => [...prev, registration]);
      queryClient.invalidateQueries({ queryKey: ['myEventRegistrations'] });
    },
  });

  const isRegistered = (eventId) => {
    return myRegistrations.some(reg => reg.event_id === eventId);
  };

  const eventTypeIcons = {
    speed_dating: '💘',
    group_chat: '💬',
    game_night: '🎮',
    workshop: '🎓',
    mixer: '🍷'
  };

  const upcomingEvents = events.filter(e => new Date(e.scheduled_at) > new Date());
  const pastEvents = events.filter(e => new Date(e.scheduled_at) <= new Date());

  if (isLoading) {
    return <CardsSkeleton count={4} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Virtual Events</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="bg-card border-b border-border sticky top-[57px] z-10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'upcoming' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Upcoming
              {activeTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'past' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Past Events
              {activeTab === 'past' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="p-4 space-y-4">
          {activeTab === 'upcoming' && (
            <>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-foreground">No upcoming events</h3>
                  <p className="text-sm text-muted-foreground">Check back soon for new events!</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
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

                      {isRegistered(event.id) ? (
                        <div className="flex items-center justify-center gap-2 py-3 bg-success/10 text-success rounded-xl">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Registered</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => registerMutation.mutate(event.id)}
                          disabled={registerMutation.isPending}
                          className="w-full h-12 rounded-xl"
                        >
                          <Video className="w-5 h-5 ml-2" />
                          Register for Event
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'past' && (
            <>
              {pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No past events</p>
                </div>
              ) : (
                pastEvents.map((event) => (
                  <div key={event.id} className="bg-card rounded-2xl p-5 shadow-sm opacity-60 border border-border">
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
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}