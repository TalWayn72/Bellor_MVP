import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardsSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { themes } from '../components/providers/ThemeProvider';
import BackButton from '@/components/navigation/BackButton';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [selectedTheme, setSelectedTheme] = useState(currentUser?.selected_theme || 'blue');

  const updateThemeMutation = useMutation({
    mutationFn: async (theme) => {
      await userService.updateUser(currentUser.id, { selected_theme: theme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['adminTheme'] });
      alert('Theme updated! Please refresh the page to see changes.');
      navigate(createPageUrl('Settings'));
    },
    onError: (error) => {
      console.error('Error updating theme:', error);
      alert('Failed to update theme. Please try again.');
    },
  });

  const handleSave = () => {
    updateThemeMutation.mutate(selectedTheme);
  };

  if (isLoading) {
    return <CardsSkeleton count={4} />;
  }

  // Check if user is admin
  if (!currentUser?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-muted-foreground mb-4">Only administrators can change the app theme.</p>
          <Button onClick={() => navigate(createPageUrl('Settings'))}>
            Back to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">App Theme</h1>
            <p className="text-xs text-muted-foreground">Admin Settings</p>
          </div>
          <div className="w-9"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary via-primary to-match rounded-3xl p-8 text-white text-center mb-6 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Palette className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Customize App Theme</h2>
            <p className="text-sm opacity-90">
              Choose a color scheme for the entire application
            </p>
          </div>
        </div>

        {/* Theme Options */}
        <div className="space-y-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setSelectedTheme(key)}
              className={`w-full bg-card rounded-2xl p-5 shadow-sm border-2 transition-all hover:shadow-md active:scale-[0.99] ${
                selectedTheme === key
                  ? 'border-primary shadow-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full shadow-lg border-4 border-white/50"
                      style={{ backgroundColor: theme.primary }}
                    />
                    {selectedTheme === key && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center border-2 border-white">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-base text-foreground">{theme.name} Theme</h3>
                    <p className="text-xs text-muted-foreground">Primary: {theme.primary}</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 rounded-full w-1/2 shadow-sm"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div className="h-2 rounded-full w-1/4 bg-muted-foreground/20" />
                  </div>
                  <div className="h-2 rounded-full w-3/4 bg-muted-foreground/20" />
                  <div className="h-2 rounded-full w-2/3 bg-muted-foreground/20" />
                  <div className="flex gap-2 mt-3">
                    <div
                      className="h-9 rounded-lg flex-1 shadow-sm"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div
                      className="h-9 rounded-lg flex-1 shadow-sm"
                      style={{ backgroundColor: theme.primaryDark }}
                    />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-6 sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={updateThemeMutation.isPending || selectedTheme === currentUser?.selected_theme}
            className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {updateThemeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Applying Theme...
              </div>
            ) : (
              'Apply Theme'
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-4 bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
              <span className="text-info text-sm">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-info mb-1">Important Note</p>
              <p className="text-xs text-info/80">
                The theme will be applied to all users of the app. You'll need to refresh the page after saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}