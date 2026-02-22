import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  missionService: {
    getTodaysMission: vi.fn().mockResolvedValue({
      data: { question: 'Which type of energy?', options: ['Subtle energy', 'Grounded', 'Primal'] },
    }),
    createMission: vi.fn().mockResolvedValue({ data: { id: 'mission-1' } }),
  },
  responseService: { createResponse: vi.fn().mockResolvedValue({}) },
  uploadService: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://test.com/video.webm' }) },
  userService: { updateProfile: vi.fn().mockResolvedValue({}) },
}));

// IMPORTANT: return a STABLE object reference. Components with useEffect([currentUser])
// will infinite-loop if the mock returns a new object on every call.
vi.mock('../components/hooks/useCurrentUser', () => {
  const stable = {
    currentUser: { id: 'user-1', nickname: 'TestUser', response_count: 0, mission_completed_count: 0 },
    isLoading: false,
  };
  return { useCurrentUser: vi.fn(() => stable) };
});

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/tasks/VideoRecorder', () => ({
  default: ({ onShare }) => (
    <div data-testid="video-recorder">
      <button onClick={() => onShare(new Blob(['video'], { type: 'video/webm' }), true, 10, 'video/webm', '.webm')}>Record</button>
    </div>
  ),
}));

import VideoTask from './VideoTask';

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

describe('[P1][content] VideoTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<VideoTask />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Bellor today')).toBeInTheDocument();
  });

  it('renders video task subtitle after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Task - Video')).toBeInTheDocument();
  });

  it('renders video recorder component after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('video-recorder')).toBeInTheDocument();
  });

  it('renders task type navigation buttons after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('renders share text after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Choose your way to share')).toBeInTheDocument();
  });
});

describe('[P1][regression] ISSUE-084 - mission creation schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createMission with correct fields (title, description, missionType) when no mission exists', async () => {
    const { missionService } = await import('@/api');
    missionService.getTodaysMission.mockResolvedValue({ data: null });
    missionService.createMission.mockResolvedValue({ data: { id: 'new-mission-1' } });

    render(<VideoTask />, { wrapper: createWrapper() });

    // Wait for component to finish loading (query resolves)
    await screen.findByText('Record');
    const recordButton = screen.getByText('Record');
    await userEvent.click(recordButton);

    await waitFor(() => {
      expect(missionService.createMission).toHaveBeenCalledTimes(1);
    });

    const callArg = missionService.createMission.mock.calls[0][0];

    // Verify correct fields are present
    expect(callArg).toHaveProperty('title');
    expect(callArg).toHaveProperty('description');
    expect(callArg).toHaveProperty('missionType', 'DAILY');

    // Verify old/wrong fields are NOT sent (the bug from ISSUE-084)
    expect(callArg).not.toHaveProperty('question');
    expect(callArg).not.toHaveProperty('category');
    expect(callArg).not.toHaveProperty('responseTypes');
    expect(callArg).not.toHaveProperty('date');
    expect(callArg).not.toHaveProperty('isActive');
  });
});
