/**
 * Vitest Test Setup
 * Global configuration for all tests
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// ─────────────────────────────────────────────────────────────────────────────
// Global OOM prevention mocks (applied before EVERY test file via setupFiles)
//
// lucide-react: 41MB on disk; Vite's Babel pipeline expands it to ~2-3GB in
// memory per fork because it processes every icon SVG. Mocking it globally
// prevents the library from being loaded at all.
//
// @/components/states: imports LoadingState → lucide-react (transitive OOM).
// Mocked globally so test files don't need to know about this transitive dep.
//
// Vitest 2.x validates every named import against the mock object's own keys.
// A Proxy with only a get() trap fails because ownKeys() returns only the
// target's explicit keys; vitest throws "No X export is defined on the mock".
// Using an explicit object with all used icon names avoids this.
// Per-file vi.mock() calls override these global defaults when needed.
// ─────────────────────────────────────────────────────────────────────────────
// Inline factories: vi.mock() is hoisted above const declarations, so
// factory logic must live inside the factory function (no outer variables).
// Icon list: grep -r "from 'lucide-react'" src --include="*.jsx|tsx" | extract
vi.mock('lucide-react', () => {
  const c = () => null;
  const obj = { __esModule: true, default: c };
  'Activity,AlertCircle,AlertTriangle,ArrowLeft,ArrowRight,Ban,Bell,Book,Calendar,Camera,Check,CheckCircle,ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Circle,Clock,Copy,Crown,Download,ExternalLink,Eye,EyeOff,File,FileText,Flag,Flame,Gift,GripVertical,Heart,HelpCircle,Image,Info,Lightbulb,Loader2,Lock,LogOut,Mail,MapPin,Menu,MessageCircle,MessageSquare,Mic,MicOff,Minus,MoreHorizontal,MoreVertical,Palette,PanelLeft,Pencil,Phone,Plus,RefreshCw,Save,Search,Send,Settings,Share2,Shield,SlidersHorizontal,Sparkles,Square,Star,TrendingUp,Trophy,Type,Upload,User,UserCheck,UserPlus,Users,Video,VideoOff,Volume2,X,XCircle,Zap'.split(',').forEach(k => { obj[k] = c; });
  return obj;
});
vi.mock('@/components/states', () => {
  const c = () => null;
  return {
    __esModule: true, default: c,
    LoadingState: c, PageLoading: c, CardsSkeleton: c, ListSkeleton: c,
    ProfileSkeleton: c, ChatSkeleton: c, FeedSkeleton: c,
    EmptyState: c, NoMessages: c, NoMatches: c, NoNotifications: c,
    NoSearchResults: c, NoFeedPosts: c, NoFollowers: c, NoAchievements: c,
    ErrorState: c, NetworkError: c, ServerError: c, NotFoundError: c,
    UnauthorizedError: c, ForbiddenError: c, GenericError: c,
  };
});

// Clean up DOM after each test to prevent state contamination.
// Force GC after each TEST (cleans up React fiber trees between tests)
// and after each FILE (cleans up module-level objects between files in the same fork).
// global.gc() works in pool:'forks' child processes (inherits --expose-gc from NODE_OPTIONS).
afterEach(() => {
  cleanup();
  if (typeof global.gc === 'function') global.gc();
});

// Force a full GC after all tests in a file complete, BEFORE the next file loads
// in the same fork process. This prevents cross-file memory accumulation.
afterAll(() => {
  if (typeof global.gc === 'function') global.gc();
});

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
