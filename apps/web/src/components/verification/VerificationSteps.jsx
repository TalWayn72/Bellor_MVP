import React from 'react';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function VerificationInstructions() {
  return (
    <Card className="p-6 mb-6">
      <h2 className="font-bold text-lg mb-3 text-foreground">Verify Your Identity</h2>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>📸 Take a selfie that clearly shows your face</p>
        <p>💡 Make sure you're in good lighting</p>
        <p>👤 Your photo will match your profile pictures</p>
        <p>⏱️ Verification usually takes 24-48 hours</p>
      </div>
    </Card>
  );
}

export function CameraView({ verificationStream, videoRef, onCapture, onStartCamera }) {
  return (
    <Card className="rounded-3xl overflow-hidden mb-6">
      <div className="relative" style={{ aspectRatio: '3/4' }}>
        {verificationStream ? (
          <>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={onCapture}
                className="w-20 h-20 rounded-full border-4 border-card bg-card flex items-center justify-center hover:bg-muted"
              >
                <div className="w-16 h-16 rounded-full bg-primary"></div>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <Button onClick={onStartCamera}>Start Camera</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function VerificationPreview({
  verificationPhoto,
  verificationStatus,
  isVerifying,
  onRetake,
  onSubmit,
}) {
  return (
    <>
      <Card className="rounded-3xl overflow-hidden mb-6">
        <img src={verificationPhoto} alt="Verification" className="w-full" />
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

      <div className="flex gap-3">
        <Button onClick={onRetake} variant="outline" className="flex-1 h-12" disabled={isVerifying}>
          Retake
        </Button>
        <Button onClick={onSubmit} className="flex-1 h-12" disabled={isVerifying}>
          {isVerifying ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </>
  );
}
