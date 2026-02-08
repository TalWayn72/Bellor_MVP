import React from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadService } from '@/api';

export default function EditProfileImages({ images, onChange }) {
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await uploadService.uploadProfileImage(file);
      onChange([...images, result.url]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  const handleRemoveImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Profile Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={image}
                alt={`Profile ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Plus className="w-8 h-8 text-muted-foreground" />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
