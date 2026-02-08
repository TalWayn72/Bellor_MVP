import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardCards({ statsCards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat) => (
        <Card
          key={stat.title}
          variant="interactive"
          className="cursor-pointer"
          onClick={stat.onClick}
        >
          <CardContent className="p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
