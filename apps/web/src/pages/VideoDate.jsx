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
  const { currentUser, isLoading } = useCurrentUser();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef(null);

  const { data: otherUser } = useQuery({
    queryKey: ['videoCallOtherUser', chatId, currentUser?.id],
    queryFn: async () => {
      if (!chatId || !currentUser) return null;
      try {
        const chatResult = await chatService.getChatById(chatId);
        const chat = chatResult.chat;
        if (chat) {
          const otherUserId = chat.otherUser?.id;
          if (!otherUserId) return null;
          const userResult = await userService.getUserById(otherUserId);
          return userResult.user || null;
        }
        return null;
      } catch (error) {
        console.error('Error fetching video call data:', error);
        return null;
      }
    },
    enabled: !!chatId && !!currentUser,
  });

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) { console.error('Error accessing camera:', error); }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
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
    navigate(createPageUrl('PrivateChat?chatId=' + chatId));
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
