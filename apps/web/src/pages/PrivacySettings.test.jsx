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
  userService: { updateUser: vi.fn().mockResolvedValue({}), exportUserData: vi.fn(), deleteUserGDPR: vi.fn() },
}));

// IMPORTANT: return a STABLE object reference. Components with useEffect([currentUser])
// will infinite-loop if the mock returns a new object on every call.
vi.mock('../components/hooks/useCurrentUser', () => {
  const stable = {
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
    updateUser: () => {},
  };
  return { useCurrentUser: vi.fn(() => stable) };
});

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/settings/PrivacyToggles', () => ({
  default: () => <div data-testid="privacy-toggles">Toggles</div>,
}));

vi.mock('@/components/settings/GDPRSection', () => ({
  default: () => <div data-testid="gdpr-section">GDPR</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

// Prevent loading heavy transitive deps not needed by these basic render tests
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }) => <div>{children}</div>,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  useNavigate: vi.fn(() => vi.fn()),
}));
vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient { constructor() {} },
  QueryClientProvider: ({ children }) => children,
}));

import PrivacySettings from './PrivacySettings';

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

describe('[P2][profile] PrivacySettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
  });

  it('renders privacy toggles', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('privacy-toggles')).toBeInTheDocument();
  });

  it('renders GDPR section', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('gdpr-section')).toBeInTheDocument();
  });
});
