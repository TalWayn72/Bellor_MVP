import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

export default function StepPhoneVerify({ formData, setFormData, isLoading, setIsLoading, isAuthenticated }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="relative h-80 bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-32 h-32 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Enter Verification Code</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            We sent a code to {formData.phone}
          </p>

          <label className="block text-sm text-gray-500 mb-2">Verification Code</label>
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={formData.phone_otp}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 6) {
                setFormData({ ...formData, phone_otp: value });
              }
            }}
            className="w-full h-12 text-base text-center text-2xl tracking-widest mb-4"
            maxLength={6}
          />

          <div className="text-center mb-6">
            <button
              onClick={() => toast({ title: 'Info', description: 'Demo Mode: In production, a new OTP will be sent' })}
              className="text-sm text-info hover:text-info font-medium"
            >
              Didn't receive code? Send again
            </button>
          </div>

          <div className="bg-warning/10 rounded-xl p-4 mb-6">
            <p className="text-xs text-warning leading-relaxed">
              <strong>Demo Mode:</strong> Backend functions are required for phone authentication.
              Contact support to enable this feature.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <Button
          onClick={async () => {
            if (formData.phone_otp && formData.phone_otp.length === 6) {
              setIsLoading(true);
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (!isAuthenticated) {
                  toast({ title: 'Info', description: 'Demo Mode: User would be created/authenticated here' });
                }
                navigate(createPageUrl('Onboarding') + '?step=3');
              } catch (error) {
                toast({ title: 'Error', description: 'Verification failed. Please try again.', variant: 'destructive' });
              } finally {
                setIsLoading(false);
              }
            } else {
              toast({ title: 'Validation', description: 'Please enter a valid 6-digit code', variant: 'destructive' });
            }
          }}
          disabled={!formData.phone_otp || formData.phone_otp.length !== 6 || isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              Verify & Continue
              <ArrowRight className="w-4 h-4 mr-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
