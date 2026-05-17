import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import VideoDateUI from '@/components/video/VideoDateUI';

export default function VideoDate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');
  const routeOtherUserId = searchParams.get('userId');
  const { currentUser, isLoading } = useCurrentUser();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef(null);

  const { data: otherUser } = useQuery({
    queryKey: ['videoCallOtherUser', chatId, routeOtherUserId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      try {
        let otherUserId = routeOtherUserId;
        if (!otherUserId && chatId) {
          const chatResult = await chatService.getChatById(chatId);
          const chat = chatResult.chat;
          if (chat) {
            const chatOtherUser = chat.otherUser || chat.other_user;
            otherUserId = chatOtherUser?.id;
          }
        }
        if (!otherUserId) return null;
        const userResult = await userService.getUserById(otherUserId);
        return userResult.user || null;
      } catch (error) {
        console.error('Error fetching video call data:', error);
        return null;
      }
    },
    enabled: (!!chatId || !!routeOtherUserId) && !!currentUser,
  });

  useEffect(() => {
    let isMounted = true;
    let activeStream = null;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          activeStream = stream;
        } else {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) { console.error('Error accessing camera:', error); }
    };
    startCamera();
    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      } else if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const videoTrack = videoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOn(videoTrack.enabled); }
    }
  };

  const toggleAudio = () => {
    if (videoRef.current?.srcObject) {
      const audioTrack = videoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsAudioOn(audioTrack.enabled); }
    }
  };

  const endCall = async () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (chatId) {
      // Video call tracking - backend integration pending
    }
    const returnParams = new URLSearchParams();
    if (chatId) returnParams.set('chatId', chatId);
    const returnUserId = routeOtherUserId || otherUser?.id;
    if (returnUserId) returnParams.set('userId', returnUserId);
    const queryString = returnParams.toString();
    navigate(createPageUrl(queryString ? `PrivateChat?${queryString}` : 'PrivateChat'));
  };

  if (isLoading) return <LoadingState variant="spinner" text="Loading..." />;

  return (
    <VideoDateUI
      otherUser={otherUser}
      videoRef={videoRef}
      callDuration={callDuration}
      isAudioOn={isAudioOn}
      isVideoOn={isVideoOn}
      toggleAudio={toggleAudio}
      toggleVideo={toggleVideo}
      endCall={endCall}
      formatDuration={formatDuration}
    />
  );
}
