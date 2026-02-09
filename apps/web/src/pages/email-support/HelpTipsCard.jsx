import React from 'react';
import { Card } from '@/components/ui/card';

export default function HelpTipsCard() {
  return (
    <Card className="bg-info/10 border-info/20 p-4">
      <h3 className="font-semibold text-sm mb-2 text-foreground">Tips for faster help:</h3>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li>Include screenshots if relevant</li>
        <li>Describe what you expected vs what happened</li>
        <li>Mention any error messages you saw</li>
        <li>Tell us what device and browser you are using</li>
      </ul>
    </Card>
  );
}
