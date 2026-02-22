import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

// Belt-and-suspenders: per-file lucide-react mock in addition to setup.js global.
vi.mock('lucide-react', () => {
  const c = () => null;
  const obj = { __esModule: true, default: c };
  'Activity,AlertCircle,AlertTriangle,ArrowLeft,ArrowRight,Award,Ban,Bell,Book,Bookmark,Briefcase,Calendar,Camera,Check,CheckCircle,ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Circle,Clock,Compass,Copy,Crown,Download,ExternalLink,Eye,EyeOff,File,FileQuestion,FileText,Flag,Flame,Gift,GripVertical,Heart,HelpCircle,Home,Image,ImageIcon,Inbox,Info,LayoutDashboard,Lightbulb,Loader2,Lock,LogOut,Mail,MapPin,Menu,MessageCircle,MessageSquare,Mic,MicOff,Minus,MoreHorizontal,MoreVertical,Music,Palette,PanelLeft,Pencil,Phone,Plus,RefreshCw,Save,Search,Send,ServerCrash,Settings,Share2,Shield,ShoppingBag,SlidersHorizontal,Sparkles,Square,Star,Trash2,TrendingUp,Trophy,Type,Upload,UploadIcon,User,UserCheck,UserPlus,Users,Video,VideoOff,Volume2,WifiOff,X,XCircle,Zap'.split(',').forEach(k => { obj[k] = c; });
  return obj;
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Welcome from './Welcome';

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

describe('[P0][auth] Welcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  // --- Existing scaffold tests (preserved) ---

  it('renders without crashing', () => {
    const { container } = render(<Welcome />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the app name', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    expect(screen.getByText('A place for authentic connections')).toBeInTheDocument();
  });

  it('renders get started button', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders the bellor logo', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    const img = screen.getByAltText('Bellør');
    expect(img).toBeInTheDocument();
  });

  it('renders sign in button for returning users', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });

  // --- New behavioral tests ---

  describe('app branding', () => {
    it('should display the app logo image', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/bellor-logo.png');
    });

    it('should display the app name heading', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bellør');
    });

    it('should display the tagline', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      expect(screen.getByText('A place for authentic connections')).toBeInTheDocument();
    });
  });

  describe('navigation buttons', () => {
    it('should have a button to register (Get Started)', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toBeInTheDocument();
    });

    it('should have a button to login (Sign In)', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should navigate to onboarding when "Get Started" is clicked', async () => {
      const user = userEvent.setup();
      render(<Welcome />, { wrapper: createWrapper() });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      await user.click(getStartedButton);

      expect(mockNavigate).toHaveBeenCalledWith('/Onboarding?step=2');
    });

    it('should navigate to login page when "Sign In" is clicked', async () => {
      const user = userEvent.setup();
      render(<Welcome />, { wrapper: createWrapper() });

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/Login');
    });
  });

  describe('social proof', () => {
    it('should display the community message', () => {
      render(<Welcome />, { wrapper: createWrapper() });
      expect(screen.getByText('Join thousands finding meaningful connections')).toBeInTheDocument();
    });
  });
});
