import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Belt-and-suspenders: per-file lucide-react mock in addition to setup.js global.
vi.mock('lucide-react', () => {
  const c = () => null;
  const obj = { __esModule: true, default: c };
  'Activity,AlertCircle,AlertTriangle,ArrowLeft,ArrowRight,Award,Ban,Bell,Book,Bookmark,Briefcase,Calendar,Camera,Check,CheckCircle,ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Circle,Clock,Compass,Copy,Crown,Download,ExternalLink,Eye,EyeOff,File,FileQuestion,FileText,Flag,Flame,Gift,GripVertical,Heart,HelpCircle,Home,Image,ImageIcon,Inbox,Info,LayoutDashboard,Lightbulb,Loader2,Lock,LogOut,Mail,MapPin,Menu,MessageCircle,MessageSquare,Mic,MicOff,Minus,MoreHorizontal,MoreVertical,Music,Palette,PanelLeft,Pencil,Phone,Plus,RefreshCw,Save,Search,Send,ServerCrash,Settings,Share2,Shield,ShoppingBag,SlidersHorizontal,Sparkles,Square,Star,Trash2,TrendingUp,Trophy,Type,Upload,UploadIcon,User,UserCheck,UserPlus,Users,Video,VideoOff,Volume2,WifiOff,X,XCircle,Zap'.split(',').forEach(k => { obj[k] = c; });
  return obj;
});

vi.mock('@/api', () => ({
  chatService: { getChatById: vi.fn().mockResolvedValue({ chat: null }) },
  userService: { getUserById: vi.fn().mockResolvedValue({ user: null }) },
}));

// IMPORTANT: return a STABLE object reference. Components with useEffect([currentUser])
// will infinite-loop if the mock returns a new object on every call.
vi.mock('../components/hooks/useCurrentUser', () => {
  const stable = {
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  };
  return { useCurrentUser: vi.fn(() => stable) };
});

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/video/VideoDateUI', () => ({
  default: ({ otherUser, isAudioOn, isVideoOn }) => (
    <div data-testid="video-date-ui">
      <span>Video Date UI</span>
      <span data-testid="audio-status">{isAudioOn ? 'on' : 'off'}</span>
      <span data-testid="video-status">{isVideoOn ? 'on' : 'off'}</span>
    </div>
  ),
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
});

import VideoDate from './VideoDate';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('[P3][social] VideoDate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<VideoDate />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the VideoDateUI component', () => {
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByTestId('video-date-ui')).toBeInTheDocument();
  });

  it('starts with audio and video enabled', () => {
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByTestId('audio-status')).toHaveTextContent('on');
    expect(screen.getByTestId('video-status')).toHaveTextContent('on');
  });

  it('shows loading state when user is loading', async () => {
    const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
    useCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  describe('media stream cleanup on unmount', () => {
    it('should stop media tracks on unmount', async () => {
      const mockStop = vi.fn();
      const mockStream = { getTracks: () => [{ stop: mockStop }, { stop: mockStop }] };
      navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const { unmount } = render(<VideoDate />, { wrapper: createWrapper() });

      // Wait for getUserMedia to resolve
      await new Promise(r => setTimeout(r, 0));

      unmount();

      expect(mockStop).toHaveBeenCalledTimes(2);
    });

    it('should stop orphaned stream when unmount happens during getUserMedia', async () => {
      const mockStop = vi.fn();
      let resolveGetUserMedia;
      const mediaPromise = new Promise(resolve => { resolveGetUserMedia = resolve; });
      navigator.mediaDevices.getUserMedia.mockReturnValue(mediaPromise);

      const { unmount } = render(<VideoDate />, { wrapper: createWrapper() });

      // Unmount BEFORE getUserMedia resolves
      unmount();

      // Now resolve - the stream should still be stopped (isMounted guard)
      resolveGetUserMedia({ getTracks: () => [{ stop: mockStop }] });
      await new Promise(r => setTimeout(r, 0));

      expect(mockStop).toHaveBeenCalledTimes(1);
    });
  });
});
