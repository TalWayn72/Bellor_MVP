import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, uploadService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function UserVerification() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [verificationStream, setVerificationStream] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (currentUser?.is_verified) {
      navigate(createPageUrl('Profile'));
    }
  }, [currentUser, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVerificationStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('לא ניתן לגשת למצלמה');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setVerificationPhoto(dataUrl);
    verificationStream.getTracks().forEach(track => track.stop());
    setVerificationStream(null);
  };

  const handleSubmitVerification = async () => {
    if (!verificationPhoto || !currentUser) return;

    setIsVerifying(true);
    try {
      // Upload photo
      const blob = await fetch(verificationPhoto).then(r => r.blob());
      const file = new File([blob], 'verification.jpg', { type: 'image/jpeg' });
      const { file_url } = await uploadService.uploadFile(file);

      // Update user with verification photo
      await userService.updateUser(currentUser.id, {
        verification_photo: file_url,
        verification_status: 'pending'
      });

      setVerificationStatus('success');
      setTimeout(() => {
        navigate(createPageUrl('Profile'));
      }, 2000);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || !currentUser) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
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
            {/* Instructions */}
            <Card className="p-6 mb-6">
              <h2 className="font-bold text-lg mb-3 text-foreground">Verify Your Identity</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>📸 Take a selfie that clearly shows your face</p>
                <p>💡 Make sure you're in good lighting</p>
                <p>👤 Your photo will match your profile pictures</p>
                <p>⏱️ Verification usually takes 24-48 hours</p>
              </div>
            </Card>

            {/* Camera View */}
            <Card className="rounded-3xl overflow-hidden mb-6">
              <div className="relative" style={{ aspectRatio: '3/4' }}>
                {verificationStream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-card bg-card flex items-center justify-center hover:bg-muted"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary"></div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                    <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                    <Button onClick={startCamera}>
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Preview */}
            <Card className="rounded-3xl overflow-hidden mb-6">
              <img
                src={verificationPhoto}
                alt="Verification"
                className="w-full"
              />
            </Card>

            {verificationStatus === 'success' && (
              <div className="bg-success/10 rounded-2xl p-5 mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success" />
                <div>
                  <p className="font-semibold text-foreground">Submitted Successfully!</p>
                  <p className="text-sm text-success">We'll review your photo soon</p>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="bg-destructive/10 rounded-2xl p-5 mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">Submission Failed</p>
                  <p className="text-sm text-destructive">Please try again</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setVerificationPhoto(null);
                  setVerificationStatus(null);
                }}
                variant="outline"
                className="flex-1 h-12"
                disabled={isVerifying}
              >
                Retake
              </Button>
              <Button
                onClick={handleSubmitVerification}
                className="flex-1 h-12"
                disabled={isVerifying}
              >
                {isVerifying ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}