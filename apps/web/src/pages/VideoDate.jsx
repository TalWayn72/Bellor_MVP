import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

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
          const otherUserId = chat.user1_id === currentUser.id ? chat.user2_id : chat.user1_id;
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }

    // Log video call data (VideoCall service can be added in future)
    if (chatId) {
      console.log('Video call ended:', {
        chat_id: chatId,
        caller_id: currentUser.id,
        receiver_id: otherUser?.id,
        status: 'ended',
        started_at: new Date(Date.now() - callDuration * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration: callDuration
      });
    }

    navigate(createPageUrl('PrivateChat?chatId=' + chatId));
  };

  if (isLoading) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Other User Video (Full Screen) */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center text-white">
            {otherUser && (
              <>
                <img
                  src={otherUser.profile_images?.[0] || `https://i.pravatar.cc/200?u=${otherUser.id}`}
                  alt={otherUser.nickname}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/30"
                />
                <h2 className="text-2xl font-bold mb-2">{otherUser.nickname}</h2>
                <p className="text-sm opacity-75">Video call in progress</p>
              </>
            )}
            {!otherUser && (
              <>
                <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/30 bg-white/20 flex items-center justify-center">
                  <Video className="w-16 h-16 text-white/50" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connecting...</h2>
                <p className="text-sm opacity-75">Please wait</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* My Video (Picture in Picture) */}
      <div className="absolute top-6 right-6 w-32 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Call Duration */}
      <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
        <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={toggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {isAudioOn ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
        >
          <Phone className="w-7 h-7 text-white transform rotate-135" />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {isVideoOn ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}