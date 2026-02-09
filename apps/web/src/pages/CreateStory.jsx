import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyService, uploadService } from '@/api';
import { useMutation } from '@tanstack/react-query';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import StoryPreview from '@/components/stories/StoryPreview';
import { useToast } from '@/components/ui/use-toast';

const colors = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-green-500',
  'from-orange-500 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-500'
];

export default function CreateStory() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [storyType, setStoryType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState('from-purple-500 to-pink-500');
  const fileInputRef = useRef(null);

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => storyService.createStory(storyData),
    onSuccess: () => navigate(createPageUrl('Stories')),
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result); setStoryType('image'); };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!currentUser) return;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (storyType === 'text' && textContent.trim()) {
      createStoryMutation.mutate({
        mediaType: 'text', textContent, expiresAt: expiresAt.toISOString()
      });
    } else if (storyType === 'image' && selectedImage) {
      try {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
        const uploadResult = await uploadService.uploadStoryMedia(file);
        createStoryMutation.mutate({
          mediaType: 'image', mediaUrl: uploadResult.url, expiresAt: expiresAt.toISOString()
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({ title: 'Error', description: 'Error uploading image', variant: 'destructive' });
      }
    }
  };

  if (isLoading) return <LoadingState variant="spinner" text="Loading..." />;

  return (
    <div className="min-h-screen bg-black">
      <StoryPreview
        storyType={storyType}
        setStoryType={setStoryType}
        textContent={textContent}
        setTextContent={setTextContent}
        selectedImage={selectedImage}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        colors={colors}
        fileInputRef={fileInputRef}
        onPublish={handlePublish}
        isPending={createStoryMutation.isPending}
      />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
    </div>
  );
}
