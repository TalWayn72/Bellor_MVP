import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardsSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { themes } from '../components/providers/ThemeProvider';
import BackButton from '@/components/navigation/BackButton';
import ThemePreview from '@/components/settings/ThemePreview';
import { useToast } from '@/components/ui/use-toast';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(currentUser?.selected_theme || 'blue');

  const updateThemeMutation = useMutation({
    mutationFn: async (theme) => { await userService.updateUser(currentUser.id, { selected_theme: theme }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['adminTheme'] });
      toast({ title: 'Success', description: 'Theme updated! Please refresh the page to see changes.' });
      navigate(createPageUrl('Settings'));
    },
    onError: (error) => { console.error('Error updating theme:', error); toast({ title: 'Error', description: 'Failed to update theme.', variant: 'destructive' }); },
  });

  if (isLoading) return <CardsSkeleton count={4} />;

  if (!currentUser?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-muted-foreground mb-4">Only administrators can change the app theme.</p>
          <Button onClick={() => navigate(createPageUrl('Settings'))}>Back to Settings</Button>
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
        <div className="bg-gradient-to-br from-primary via-primary to-match rounded-3xl p-8 text-white text-center mb-6 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Palette className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Customize App Theme</h2>
            <p className="text-sm opacity-90">Choose a color scheme for the entire application</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(themes).map(([key, theme]) => (
            <ThemePreview key={key} themeKey={key} theme={theme} isSelected={selectedTheme === key} onSelect={setSelectedTheme} />
          ))}
        </div>

        <div className="mt-6 sticky bottom-4">
          <Button onClick={() => updateThemeMutation.mutate(selectedTheme)}
            disabled={updateThemeMutation.isPending || selectedTheme === currentUser?.selected_theme}
            className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
            {updateThemeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Applying Theme...
              </div>
            ) : 'Apply Theme'}
          </Button>
        </div>

        <div className="mt-4 bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
              <span className="text-info text-sm">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-info mb-1">Important Note</p>
              <p className="text-xs text-info/80">The theme will be applied to all users. Refresh the page after saving.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
