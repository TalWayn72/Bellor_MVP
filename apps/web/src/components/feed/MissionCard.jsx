import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MissionCard({
  todayMission,
  userTodayResponse,
  onOpenTaskSelector,
}) {
  if (!todayMission) return null;

  return (
    <div className="mx-4 mt-2 mb-1 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          {userTodayResponse ? (
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white">Daily Task</span>
            {userTodayResponse ? (
              <Badge variant="success" size="sm">&#10003; {'\u05e9\u05d5\u05ea\u05e3'}</Badge>
            ) : (
              <Badge variant="warning-soft" size="sm">{'\u05e2\u05d3 \u05d7\u05e6\u05d5\u05ea'}</Badge>
            )}
          </div>
          <p className="text-xs text-white/70 truncate">{todayMission?.question || "\u05e9\u05ea\u05e3 \u05de\u05e9\u05d4\u05d5 \u05de\u05e2\u05e0\u05d9\u05d9\u05df \u05e2\u05dc \u05e2\u05e6\u05de\u05da \u05d4\u05d9\u05d5\u05dd"}</p>
        </div>
        <Button
          onClick={onOpenTaskSelector}
          variant="secondary"
          size="sm"
          className="flex-shrink-0 bg-white text-gray-800 hover:bg-gray-100 rounded-xl text-xs px-3"
        >
          {userTodayResponse ? '\u05e9\u05ea\u05e3 \u05e2\u05d5\u05d3' : '\u05e9\u05ea\u05e3'}
        </Button>
      </div>
    </div>
  );
}
