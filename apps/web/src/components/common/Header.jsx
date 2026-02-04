import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Global Header Component
 * Ensures consistent back button placement across all pages
 * Back arrow is ALWAYS positioned on the RIGHT side (for RTL/LTR consistency)
 */
export default function Header({ 
  title, 
  onBackClick, 
  leftAction, 
  rightAction,
  subtitle,
  className = ''
}) {
  return (
    <header className={`bg-white sticky top-0 z-10 shadow-sm ${className}`}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
        {/* Left side - custom action or spacer */}
        <div className="min-w-[24px]">
          {leftAction || <div className="w-6"></div>}
        </div>

        {/* Center - title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Right side - back arrow or custom action */}
        <div className="min-w-[24px]">
          {onBackClick ? (
            <button onClick={onBackClick} aria-label="Go back">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : rightAction ? (
            rightAction
          ) : (
            <div className="w-6"></div>
          )}
        </div>
      </div>
    </header>
  );
}