import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { CardsSkeleton } from '@/components/states';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import EventCard, { PastEventCard, getDemoEvents } from '@/components/events/EventCard';

export default function VirtualEvents() {
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [localRegistrations, setLocalRegistrations] = useState([]);

  const { data: events = [] } = useQuery({
    queryKey: ['virtualEvents'],
    queryFn: async () => getDemoEvents(),
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
      const registration = {
        event_id: eventId, user_id: currentUser.id,
        status: 'registered', registered_at: new Date().toISOString()
      };
      // Event registration service integration pending
      return registration;
    },
    onSuccess: (registration) => {
      setLocalRegistrations(prev => [...prev, registration]);
      queryClient.invalidateQueries({ queryKey: ['myEventRegistrations'] });
    },
  });

  const isRegistered = (eventId) => myRegistrations.some(reg => reg.event_id === eventId);
  const upcomingEvents = events.filter(e => new Date(e.scheduled_at) > new Date());
  const pastEvents = events.filter(e => new Date(e.scheduled_at) <= new Date());

  if (isLoading) {
    return <CardsSkeleton count={4} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Virtual Events</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card border-b border-border sticky top-[57px] z-10">
          <div className="flex">
            {['upcoming', 'past'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {tab === 'upcoming' ? 'Upcoming' : 'Past Events'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            ))}
          </div>
        </div>

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
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isRegistered(event.id)}
                    onRegister={(id) => registerMutation.mutate(id)}
                    isPending={registerMutation.isPending}
                  />
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
                  <PastEventCard key={event.id} event={event} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
