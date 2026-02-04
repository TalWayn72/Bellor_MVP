import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

/**
 * BackButton - Consistent back navigation button for RTL layout
 *
 * Usage:
 * <BackButton />                              // Uses navigation history with /SharedSpace fallback
 * <BackButton onClick={handler} />            // Custom click handler
 * <BackButton to="/path" />                   // Navigate to specific path
 * <BackButton fallback="/Home" />             // Custom fallback path
 * <BackButton position="relative" />          // Change positioning
 * <BackButton variant="header" />             // Different style variants
 *
 * Position: Default is absolute top-right corner (for RTL)
 * Style: White circle with visible arrow, highlights on hover
 */
export default function BackButton({
  onClick,
  to,
  fallback = '/SharedSpace',
  className = '',
  position = 'absolute top-4 right-4',
  variant = 'default'
}) {
  const { goBack, goTo } = useNavigation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      goTo(to);
    } else {
      goBack(fallback);
    }
  };

  // Style variants
  const variants = {
    default: `w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg
              flex items-center justify-center
              hover:bg-white hover:scale-105
              active:scale-95
              transition-all duration-200
              border border-gray-200/50`,
    header: `p-2 -ml-2 rounded-lg hover:bg-muted transition-colors
             flex items-center justify-center`,
    minimal: `p-2 hover:bg-muted/50 rounded-full transition-colors
              flex items-center justify-center`,
    ghost: `p-2 hover:bg-white/20 rounded-full transition-colors
            flex items-center justify-center`
  };

  const iconVariants = {
    default: 'w-5 h-5 text-gray-700',
    header: 'w-5 h-5 text-foreground',
    minimal: 'w-5 h-5 text-muted-foreground',
    ghost: 'w-6 h-6 text-white'
  };

  return (
    <div className={`${position} z-20 ${className}`}>
      <button
        onClick={handleClick}
        aria-label="חזרה"
        className={variants[variant] || variants.default}
      >
        <ArrowRight className={iconVariants[variant] || iconVariants.default} />
      </button>
    </div>
  );
}
