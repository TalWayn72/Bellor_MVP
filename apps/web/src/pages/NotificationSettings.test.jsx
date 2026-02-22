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
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
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

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

// Prevent loading heavy transitive deps not needed by these basic render tests
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/switch', () => ({
  Switch: (props) => <input type="checkbox" {...props} />,
}));
vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  useNavigate: vi.fn(() => vi.fn()),
}));
vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient { constructor() {} },
  QueryClientProvider: ({ children }) => children,
}));

import NotificationSettings from './NotificationSettings';

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

describe('[P2][profile] NotificationSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  it('renders notification toggle items', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('New Matches')).toBeInTheDocument();
    expect(screen.getByText('New Messages')).toBeInTheDocument();
    expect(screen.getByText('Chat Requests')).toBeInTheDocument();
    expect(screen.getByText('Daily Missions')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
  });

  it('renders toggle descriptions', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Get notified when someone likes you back')).toBeInTheDocument();
    expect(screen.getByText('Get notified about new messages')).toBeInTheDocument();
  });
});
