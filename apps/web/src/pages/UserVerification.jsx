import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, uploadService } from '@/api';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { VerificationInstructions, CameraView, VerificationPreview } from '@/components/verification/VerificationSteps';
import { useToast } from '@/components/ui/use-toast';

export default function UserVerification() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [verificationStream, setVerificationStream] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const videoRef = useRef(null);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    if (currentUser?.is_verified) navigate(createPageUrl('Profile'));
  }, [currentUser, navigate]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (verificationStream) {
        verificationStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [verificationStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVerificationStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({ title: 'Error', description: 'Unable to access camera', variant: 'destructive' });
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setVerificationPhoto(canvas.toDataURL('image/jpeg'));
    verificationStream.getTracks().forEach(track => track.stop());
    setVerificationStream(null);
  };

  const handleSubmitVerification = async () => {
    if (!verificationPhoto || !currentUser) return;
    setIsVerifying(true);
    try {
      const blob = await fetch(verificationPhoto).then(r => r.blob());
      const file = new File([blob], 'verification.jpg', { type: 'image/jpeg' });
      const { file_url } = await uploadService.uploadFile(file);
      await userService.updateUser(currentUser.id, {
        verification_photo: file_url,
        verification_status: 'pending'
      });
      setVerificationStatus('success');
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => navigate(createPageUrl('Profile')), 2000);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || !currentUser) return <LoadingState variant="spinner" text="Loading..." />;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Profile" />
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">Photo Verification</h1>
          <div className="min-w-[24px]" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!verificationPhoto ? (
          <>
            <VerificationInstructions />
            <CameraView
              verificationStream={verificationStream}
              videoRef={videoRef}
              onCapture={capturePhoto}
              onStartCamera={startCamera}
            />
          </>
        ) : (
          <VerificationPreview
            verificationPhoto={verificationPhoto}
            verificationStatus={verificationStatus}
            isVerifying={isVerifying}
            onRetake={() => { setVerificationPhoto(null); setVerificationStatus(null); }}
            onSubmit={handleSubmitVerification}
          />
        )}
      </div>
    </div>
  );
}
