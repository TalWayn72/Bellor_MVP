import React from 'react';
import { missionService, responseService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { getDemoResponses, getDemoChatUsers } from '@/data/demoData';

export function useSharedSpaceData(currentUser) {
  const { data: todayMission } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try { const r = await missionService.getTodaysMission(); if (r.data) return r.data; } catch {}
      try { const today = new Date().toISOString().split('T')[0]; const r = await missionService.listMissions({ date: today, isActive: true }); if (r.data?.length > 0) return r.data[0]; } catch {}
      return null;
    },
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['responses'],
    queryFn: async () => {
      try { const r = await responseService.listResponses({ isPublic: true, limit: 100 }); const resp = r.data || []; return resp.length > 0 ? resp : getDemoResponses(); }
      catch { return getDemoResponses(); }
    },
  });

  const { data: userTodayResponse } = useQuery({
    queryKey: ['userTodayResponse', currentUser?.id, todayMission?.id],
    queryFn: async () => {
      if (!currentUser || !todayMission) return null;
      const r = await responseService.getMyResponses({ missionId: todayMission.id });
      const resp = r.data || [];
      return resp.length > 0 ? resp[0] : null;
    },
    enabled: !!currentUser && !!todayMission,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['chats', currentUser?.id],
    queryFn: async () => { if (!currentUser) return []; const r = await chatService.getChats({ limit: 6 }); return r.chats || []; },
    enabled: !!currentUser,
  });

  const activeChatUsers = React.useMemo(() => {
    if (!currentUser || !chats.length) return getDemoChatUsers();
    return chats.slice(0, 7).map(chat => ({
      chatId: chat.id, userId: chat.otherUser?.id, name: chat.otherUser?.first_name,
      image: chat.otherUser?.profile_images?.[0], isOnline: false,
    }));
  }, [chats, currentUser]);

  return { todayMission, allResponses, userTodayResponse, activeChatUsers };
}
