import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

export default function StepPhoneLogin({ formData, setFormData }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="relative h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-32 h-32 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Quick Phone Login</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Enter your phone number and we'll send you a verification code
          </p>

          <label className="block text-sm text-gray-500 mb-2">Phone Number</label>
          <Input
            type="tel"
            placeholder="+972 50 123 4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 text-base mb-4"
          />

          <div className="bg-info/10 rounded-xl p-4 mb-6">
            <p className="text-xs text-info leading-relaxed">
              We'll send you a one-time code to verify your number. Standard SMS rates may apply.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <Button
          onClick={() => {
            if (formData.phone && formData.phone.length >= 10) {
              toast({ title: 'Info', description: 'Demo Mode: In production, an OTP will be sent to ' + formData.phone });
              navigate(createPageUrl('Onboarding') + '?step=2.4');
            } else {
              toast({ title: 'Validation', description: 'Please enter a valid phone number', variant: 'destructive' });
            }
          }}
          disabled={!formData.phone || formData.phone.length < 10}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Code
          <ArrowRight className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
}
