import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { useToast } from '@/components/ui/use-toast';
import CameraIcon from './CameraIcon';

export default function StepVerification({ formData, setFormData, handleNext, handleBack, subStep }) {
  const { toast } = useToast();
  const [verificationStream, setVerificationStream] = useState(null);
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVerificationStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({ title: 'Error', description: 'Cannot access camera', variant: 'destructive' });
    }
  };

  const takePhoto = () => {
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

  if (subStep === 10) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-8">
              <CameraIcon className="w-10 h-10 text-white" />
            </div>
            <div className="bg-muted rounded-2xl p-6 mb-6 text-left">
              <h3 className="font-bold text-base mb-4">Photo Verification</h3>
              <p className="text-sm text-gray-900 leading-relaxed mb-4"><strong>Is the real you, we want to see!</strong></p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">Take a selfie that matches one of the photos on your profile. Once verified, a badge like this one will appear in your profile.</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4"><strong>Important to know:</strong></p>
              <ul className="text-xs text-gray-500 leading-relaxed space-y-2 list-disc pl-4">
                <li>Your verification photo will be visible on your profile</li>
                <li>It may take up to 48hrs for our team to review your photo</li>
                <li>Your verification photo will not be used for anything else</li>
                <li><strong>If you skip now, you must complete verification within 72 hours</strong></li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="px-8 h-12 text-sm border-2 border-border">SKIP IT</Button>
              <Button onClick={handleNext} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">VERIFY NOW <ArrowRight className="w-4 h-4 mr-2" /></Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subStep === 11) {
    const fallbackImg = formData.gender === 'male' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400";
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <ProgressBar currentStep={8} totalSteps={TOTAL_STEPS} />
            <div className="relative bg-white rounded-3xl overflow-hidden mb-6 border-4 border-success" style={{ aspectRatio: '3/4' }}>
              <img src={verificationPhoto || fallbackImg} alt="Verified" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4">
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-2xl border-4 border-white">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>
            <Button onClick={handleNext} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground">NEXT <ArrowRight className="w-4 h-4 mr-2" /></Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: subStep === 9 (camera selfie)
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <ProgressBar currentStep={7} totalSteps={TOTAL_STEPS} />
          <div className="relative bg-primary rounded-3xl overflow-hidden mb-6" style={{ aspectRatio: '3/4' }}>
            {verificationPhoto ? (
              <img src={verificationPhoto} alt="Verification" className="w-full h-full object-cover" />
            ) : (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!verificationStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CameraIcon className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </>
            )}
            {verificationStream && !verificationPhoto && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center hover:bg-muted">
                  <div className="w-16 h-16 rounded-full bg-primary"></div>
                </button>
              </div>
            )}
          </div>
          <div className="bg-muted rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-sm mb-2">Photo Verification</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Take a selfie that matches your profile photos. This helps verify your identity.</p>
          </div>
          <div className="flex gap-3">
            {verificationPhoto ? (
              <>
                <Button onClick={() => { setVerificationPhoto(null); startCamera(); }} variant="outline" className="px-8 h-12 text-sm border-2 border-border">RETAKE</Button>
                <Button onClick={handleNext} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
                  NEXT
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => { const skipUntil = new Date(); skipUntil.setHours(skipUntil.getHours() + 72); setFormData({ ...formData, verification_skip_until: skipUntil.toISOString() }); handleNext(); }} variant="outline" className="px-8 h-12 text-sm border-2 border-border">SKIP</Button>
                <Button onClick={startCamera} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
                  START CAMERA
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
