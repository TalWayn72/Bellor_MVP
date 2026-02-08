import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserProfileBook({ viewedUser, responses }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{viewedUser.nickname}'s Book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{'\u05d4\u05ea\u05d5\u05db\u05df \u05e9\u05e9\u05d5\u05ea\u05e3'}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {responses.map((response) => (
          <Card key={response.id} className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
              {response.response_type === 'text' && (
                <div className="absolute inset-0 p-4 flex items-center justify-center">
                  <p className="text-xs text-foreground text-center line-clamp-4">
                    {response.text_content}
                  </p>
                </div>
              )}
              {response.response_type === 'drawing' && response.content && (
                <img
                  src={response.content}
                  alt="Drawing"
                  className="w-full h-full object-cover"
                />
              )}
              {response.response_type === 'video' && response.content && (
                <video
                  src={response.content}
                  className="w-full h-full object-cover"
                />
              )}
              {response.response_type === 'voice' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground">
                {new Date(response.created_date).toLocaleDateString('he-IL')}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
