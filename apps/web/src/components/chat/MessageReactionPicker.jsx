import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function MessageReactionPicker({ message, currentUserId, onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const reactions = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

  const reactMutation = useMutation({
    mutationFn: async (reaction) => {
      // Log reaction (MessageReaction service can be added in future)
      // MessageReaction tracking - backend service can be added later
      if (onReact) onReact(reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageReactions'] });
      setShowPicker(false);
    },
  });

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-gray-500 hover:text-gray-700 text-xs"
      >
        React
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-2 flex gap-2 z-10">
          {reactions.map((reaction) => (
            <button
              key={reaction}
              onClick={() => reactMutation.mutate(reaction)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}