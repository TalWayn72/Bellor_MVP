import React from 'react';
import { Check, Crown, Zap, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const plans = [
  { id: 'monthly', name: '1 Month', price: 29.99, period: '/month', popular: false },
  { id: '3months', name: '3 Months', price: 69.99, period: 'total', savings: 'Save 22%', popular: true },
  { id: 'yearly', name: '12 Months', price: 199.99, period: 'total', savings: 'Save 44%', popular: false }
];

export const features = [
  { icon: Zap, text: 'Unlimited likes and matches' },
  { icon: Star, text: 'See who liked you before matching' },
  { icon: Shield, text: 'Advanced privacy controls' },
  { icon: Crown, text: 'Priority profile visibility' },
  { icon: Check, text: 'No ads' },
  { icon: Check, text: 'Rewind last pass' },
  { icon: Check, text: 'Unlimited temporary chats' },
  { icon: Check, text: 'Read receipts' },
];

export function PlanSelector({ selectedPlan, onSelectPlan }) {
  return (
    <div className="space-y-3 mb-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          variant="interactive"
          onClick={() => onSelectPlan(plan.id)}
          className={`cursor-pointer transition-all ${
            selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
          } ${plan.popular ? 'border-2 border-primary' : ''}`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                {plan.popular && <Badge variant="premium">POPULAR</Badge>}
              </div>
              {plan.savings && <p className="text-xs text-success font-semibold">{plan.savings}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">${plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              }`}>
                {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FeaturesList({ onSubscribe, isLoading, isPremium }) {
  return (
    <Card className="shadow-xl mb-8 border-2 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle>What's Included:</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onSubscribe}
          disabled={isLoading || isPremium}
          variant="premium"
          size="lg"
          className="w-full h-14 text-lg font-semibold rounded-full shadow-lg"
        >
          {isPremium ? 'Already Premium \u2713' :
           isLoading ? 'Processing...' :
           'Start Premium Now'}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          By subscribing, you agree to our terms and conditions
        </p>
      </CardContent>
    </Card>
  );
}
