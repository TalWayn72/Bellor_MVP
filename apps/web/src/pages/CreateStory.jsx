import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyService, uploadService } from '@/api';
import { useMutation } from '@tanstack/react-query';
import { Camera, Type, Upload } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function CreateStory() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [storyType, setStoryType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState('from-purple-500 to-pink-500');
  const fileInputRef = useRef(null);

  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-green-500',
    'from-orange-500 to-red-500',
    'from-yellow-400 to-orange-500',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-500'
  ];

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => {
      return await storyService.createStory(storyData);
    },
    onSuccess: () => {
      navigate(createPageUrl('Stories'));
    },
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setStoryType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!currentUser) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (storyType === 'text' && textContent.trim()) {
      createStoryMutation.mutate({
        mediaType: 'text',
        textContent: textContent,
        expiresAt: expiresAt.toISOString()
      });
    } else if (storyType === 'image' && selectedImage) {
      try {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
        const uploadResult = await uploadService.uploadStoryMedia(file);
        const file_url = uploadResult.url;

        createStoryMutation.mutate({
          mediaType: 'image',
          mediaUrl: file_url,
          expiresAt: expiresAt.toISOString()
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image');
      }
    }
  };

  if (isLoading) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Preview */}
      <div className="relative h-screen">
        {storyType === 'text' ? (
          <div className={`w-full h-full bg-gradient-to-br ${selectedColor} flex items-center justify-center p-8`}>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type your story..."
              className="w-full h-32 bg-transparent text-white text-center text-2xl font-bold placeholder-white/50 resize-none outline-none"
              maxLength={150}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            {selectedImage ? (
              <img src={selectedImage} alt="Story" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600">Select an image</p>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <BackButton variant="ghost" position="relative" fallback="/Stories" />
          <div className="text-white text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            {textContent.length}/150
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* Type Selector */}
          <div className="flex gap-3 mb-4">
            <Button
              variant={storyType === 'text' ? 'default' : 'ghost'}
              onClick={() => setStoryType('text')}
              className={`flex-1 py-3 rounded-xl gap-2 ${
                storyType === 'text' ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Type className="w-5 h-5" />
              Text
            </Button>
            <Button
              variant={storyType === 'image' ? 'default' : 'ghost'}
              onClick={() => {
                setStoryType('image');
                fileInputRef.current?.click();
              }}
              className={`flex-1 py-3 rounded-xl gap-2 ${
                storyType === 'image' ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Upload className="w-5 h-5" />
              Image
            </Button>
          </div>

          {/* Color Picker for Text */}
          {storyType === 'text' && (
            <div className="flex gap-2 mb-4 justify-center">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} ${
                    selectedColor === color ? 'ring-4 ring-white' : ''
                  }`}
                />
              ))}
            </div>
          )}

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={(!textContent.trim() && !selectedImage) || createStoryMutation.isPending}
            className="w-full h-14 bg-white text-black hover:bg-gray-100 text-lg font-bold rounded-full"
          >
            {createStoryMutation.isPending ? 'Publishing...' : 'Share Story'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
