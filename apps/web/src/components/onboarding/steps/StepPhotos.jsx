import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { uploadService, userService } from '@/api';

export default function StepPhotos({ formData, setFormData, handleNext, isAuthenticated, authUser }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const result = await uploadService.uploadProfileImage(file);
        if (result?.url) uploadedUrls.push(result.url);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    if (uploadedUrls.length === 0) return;
    const newImages = [...formData.profile_images, ...uploadedUrls].filter(Boolean);
    const newMainImage = formData.main_profile_image_url || (newImages.length > 0 ? newImages[0] : '');
    setFormData({ ...formData, profile_images: newImages, main_profile_image_url: newMainImage });
  };

  const setMainImage = async (e, imageUrl) => {
    e.stopPropagation();
    setFormData({ ...formData, main_profile_image_url: imageUrl });
    try {
      if (isAuthenticated && authUser?.id) {
        const reorderedImages = [imageUrl, ...formData.profile_images.filter(img => img !== imageUrl)];
        await userService.updateUser(authUser.id, { profileImages: reorderedImages });
      }
    } catch (error) {
      console.error('Error updating main profile image:', error);
    }
  };

  const deleteImage = async (e, index) => {
    e.stopPropagation();
    const deletedImage = formData.profile_images[index];
    const newImages = formData.profile_images.filter((_, idx) => idx !== index);
    const newMainImage = formData.main_profile_image_url === deletedImage
      ? (newImages.length > 0 ? newImages[0] : '')
      : formData.main_profile_image_url;
    setFormData({ ...formData, profile_images: newImages, main_profile_image_url: newMainImage });
    try {
      if (isAuthenticated && authUser?.id) {
        await userService.updateUser(authUser.id, { profileImages: newImages });
      }
    } catch (error) {
      console.error('Error updating images in database:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="relative h-80 bg-muted overflow-hidden">
        <img src={formData.gender === 'male' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800" : "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800"} alt="Background" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <ProgressBar currentStep={6} totalSteps={TOTAL_STEPS} />
          <p className="text-sm text-gray-500 mb-1">Add Your Photos</p>
          <p className="text-xs text-gray-500 mb-6">Choose unique profile for authentic you</p>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative aspect-square">
                <button onClick={() => fileInputRef.current?.click()} className={`w-full h-full rounded-xl bg-muted border-2 flex items-center justify-center overflow-hidden ${formData.profile_images[i] && formData.main_profile_image_url === formData.profile_images[i] ? 'border-primary border-4 shadow-lg' : 'border-dashed border-border hover:border-border'}`}>
                  {formData.profile_images[i] ? (
                    <img src={formData.profile_images[i]} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
                {formData.profile_images[i] && (
                  <>
                    <button onClick={(e) => setMainImage(e, formData.profile_images[i])} className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-10 ${formData.main_profile_image_url === formData.profile_images[i] ? 'bg-info/100 text-white' : 'bg-white text-gray-500 hover:bg-muted'}`} title="Set as main profile photo">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <button onClick={(e) => deleteImage(e, i)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-lg z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <Button onClick={handleNext} disabled={formData.profile_images.length === 0} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
          NEXT
          <ArrowRight className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
}
