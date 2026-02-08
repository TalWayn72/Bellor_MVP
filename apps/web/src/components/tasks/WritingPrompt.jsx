import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Eye } from 'lucide-react';

export default function WritingPrompt({
  todayMission,
  textContent,
  setTextContent,
  selectedOption,
  setSelectedOption,
  isPublic,
  setIsPublic,
  onShare
}) {
  return (
    <>
      {/* Question Card */}
      <Card className="w-full max-w-md mb-8">
        <CardContent className="p-5">
          <h2 className="text-base font-semibold mb-4 text-foreground">
            {todayMission?.question || "Share something interesting about yourself"}
          </h2>

          {todayMission?.options && (
            <div className="space-y-2 mb-4">
              {todayMission.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedOption === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="text-sm text-foreground">{option}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Use #hashtags and @mentions in your post
          </p>
        </CardContent>
      </Card>

      {/* Writing Area */}
      <div className="w-full max-w-md mb-6">
        <div className="bg-card rounded-3xl p-6 shadow-lg border border-border">
          <Textarea
            placeholder="Share your thoughts..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full min-h-[300px] text-base border-none focus:ring-0 resize-none"
          />

          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="public-switch" className="text-sm font-medium">
                      {isPublic ? 'Public' : 'Private'}
                    </Label>
                  </div>
                  <Switch id="public-switch" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {textContent.length} characters
              </span>
              <Button onClick={onShare} disabled={!textContent.trim()}>
                SHARE
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
