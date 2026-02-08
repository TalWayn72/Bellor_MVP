import React from 'react';
import { Camera, Type, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/navigation/BackButton';

export default function StoryPreview({
  storyType,
  setStoryType,
  textContent,
  setTextContent,
  selectedImage,
  selectedColor,
  setSelectedColor,
  colors,
  fileInputRef,
  onPublish,
  isPending,
}) {
  return (
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
        <div className="flex gap-3 mb-4">
          <Button variant={storyType === 'text' ? 'default' : 'ghost'} onClick={() => setStoryType('text')}
            className={`flex-1 py-3 rounded-xl gap-2 ${storyType === 'text' ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            <Type className="w-5 h-5" />Text
          </Button>
          <Button variant={storyType === 'image' ? 'default' : 'ghost'}
            onClick={() => { setStoryType('image'); fileInputRef.current?.click(); }}
            className={`flex-1 py-3 rounded-xl gap-2 ${storyType === 'image' ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            <Upload className="w-5 h-5" />Image
          </Button>
        </div>

        {storyType === 'text' && (
          <div className="flex gap-2 mb-4 justify-center">
            {colors.map((color) => (
              <button key={color} onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} ${selectedColor === color ? 'ring-4 ring-white' : ''}`} />
            ))}
          </div>
        )}

        <Button onClick={onPublish} disabled={(!textContent.trim() && !selectedImage) || isPending}
          className="w-full h-14 bg-white text-black hover:bg-gray-100 text-lg font-bold rounded-full">
          {isPending ? 'Publishing...' : 'Share Story'}
        </Button>
      </div>
    </div>
  );
}
