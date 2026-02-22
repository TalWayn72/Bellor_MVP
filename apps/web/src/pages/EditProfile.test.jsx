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

const mockUpdateUser = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/api', () => ({
  userService: { updateUser: (...args) => mockUpdateUser(...args) },
}));

// IMPORTANT: return a STABLE object reference. Components with useEffect([currentUser])
// will infinite-loop if the mock returns a new object on every call.
vi.mock('../components/hooks/useCurrentUser', () => {
  const stable = {
    currentUser: { id: 'user-1', nickname: 'TestUser', bio: 'Hello', gender: 'MALE', interests: [] },
    isLoading: false,
    updateUser: () => {},
  };
  return { useCurrentUser: vi.fn(() => stable) };
});

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/profile/EditProfileImages', () => ({
  default: () => <div data-testid="edit-images">Images</div>,
}));

vi.mock('@/components/profile/EditProfileForm', () => ({
  default: () => <div data-testid="edit-form">Form</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

// Prevent loading lucide-react (41MB → gigabytes in memory) via @/components/states
vi.mock('@/components/states', () => ({
  ProfileSkeleton: () => null,
}));

// Prevent loading Radix UI / other heavy deps not needed by these tests
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils', () => ({
  createPageUrl: (path) => path,
}));

// Prevent loading react-router-dom and @tanstack/react-query through Vite's
// Babel transform pipeline — they account for ~1GB of memory in a fork.
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient { constructor() {} },
  QueryClientProvider: ({ children }) => children,
}));

import EditProfile from './EditProfile';

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

describe('[P2][profile] EditProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); mockUpdateUser.mockResolvedValue({ data: {} }); });

  it('renders without crashing', () => {
    const { container } = render(<EditProfile />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('renders profile images editor', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-images')).toBeInTheDocument();
  });

  it('renders profile form', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
  });

  describe('save - no setState after navigate (finally block removed)', () => {
    it('should call updateUser API on save click', async () => {
      const user = userEvent.setup();
      render(<EditProfile />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });
    });

    it('should re-enable save button on error (setIsSaving in catch only)', async () => {
      const user = userEvent.setup();
      mockUpdateUser.mockRejectedValue(new Error('Save failed'));

      render(<EditProfile />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Save Changes'));

      // After error, save button should be re-enabled (isSaving reset in catch, not finally)
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).not.toBeDisabled();
      });
    });
  });
});
