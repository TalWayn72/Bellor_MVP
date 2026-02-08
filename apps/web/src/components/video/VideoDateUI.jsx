import React from 'react';
import { Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';

export default function VideoDateUI({
  otherUser,
  videoRef,
  callDuration,
  isAudioOn,
  isVideoOn,
  toggleAudio,
  toggleVideo,
  endCall,
  formatDuration,
}) {
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
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
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
          {isAudioOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
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
          {isVideoOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
}
