import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MissionCard({
  todayMission,
  userTodayResponse,
  onOpenTaskSelector,
}) {
  if (!todayMission) return null;

  return (
    <Card variant="glass" className="mx-4 sticky top-16 z-10 bg-gradient-to-br from-gray-900 to-gray-800 border-0 rounded-3xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Avatar size="sm" className="bg-white/20">
            <AvatarFallback className="bg-transparent text-white">
              {userTodayResponse ? (
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-base font-bold text-white">Daily Task</h2>
          <div className="ml-auto">
            {userTodayResponse ? (
              <Badge variant="success" size="sm">&#10003; {'\u05e9\u05d5\u05ea\u05e3'}</Badge>
            ) : (
              <Badge variant="warning-soft" size="sm" className="gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {'\u05e2\u05d3 \u05d7\u05e6\u05d5\u05ea'}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-white/90 leading-relaxed mb-3">
          {todayMission?.question || "\u05e9\u05ea\u05e3 \u05de\u05e9\u05d4\u05d5 \u05de\u05e2\u05e0\u05d9\u05d9\u05df \u05e2\u05dc \u05e2\u05e6\u05de\u05da \u05d4\u05d9\u05d5\u05dd"}
        </p>
        <Button
          onClick={onOpenTaskSelector}
          variant="secondary"
          size="lg"
          className="w-full bg-white text-gray-800 border border-gray-200 hover:bg-gray-100"
        >
          {userTodayResponse ? '\u05e9\u05ea\u05e3 \u05ea\u05d2\u05d5\u05d1\u05d4 \u05e0\u05d5\u05e1\u05e4\u05ea' : '\u05e9\u05ea\u05e3 \u05e2\u05db\u05e9\u05d9\u05d5'}
        </Button>
      </CardContent>
    </Card>
  );
}
