import React from 'react';
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function EmailHeroCard() {
  return (
    <Card className="p-6 text-center">
      <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
      <h2 className="text-xl font-bold mb-2 text-foreground">Get Help via Email</h2>
      <p className="text-sm text-muted-foreground">
        We typically respond within 24 hours
      </p>
    </Card>
  );
}
