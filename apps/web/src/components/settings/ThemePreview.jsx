import React from 'react';
import { Check } from 'lucide-react';

export default function ThemePreview({ themeKey, theme, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(themeKey)}
      className={`w-full bg-card rounded-2xl p-5 shadow-sm border-2 transition-all hover:shadow-md active:scale-[0.99] ${
        isSelected ? 'border-primary shadow-primary/20' : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full shadow-lg border-4 border-white/50"
              style={{ backgroundColor: theme.primary }}
            />
            {isSelected && (
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

      <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-3 rounded-full w-1/2 shadow-sm" style={{ backgroundColor: theme.primary }} />
            <div className="h-2 rounded-full w-1/4 bg-muted-foreground/20" />
          </div>
          <div className="h-2 rounded-full w-3/4 bg-muted-foreground/20" />
          <div className="h-2 rounded-full w-2/3 bg-muted-foreground/20" />
          <div className="flex gap-2 mt-3">
            <div className="h-9 rounded-lg flex-1 shadow-sm" style={{ backgroundColor: theme.primary }} />
            <div className="h-9 rounded-lg flex-1 shadow-sm" style={{ backgroundColor: theme.primaryDark }} />
          </div>
        </div>
      </div>
    </button>
  );
}
