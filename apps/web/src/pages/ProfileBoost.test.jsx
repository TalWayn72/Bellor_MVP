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

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/premium/BoostOptions', () => ({
  default: ({ activeBoost, isPending }) => (
    <div data-testid="boost-options">
      {activeBoost ? 'Active' : 'No boost'}
    </div>
  ),
}));

import ProfileBoost from './ProfileBoost';

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

describe('[P2][payments] ProfileBoost', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Profile Boost')).toBeInTheDocument();
  });

  it('renders boost hero section', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Boost Your Profile')).toBeInTheDocument();
  });

  it('renders boost options component', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByTestId('boost-options')).toHaveTextContent('No boost');
  });

  it('renders premium CTA section', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Want More Boosts?')).toBeInTheDocument();
    expect(screen.getByText('Go Premium')).toBeInTheDocument();
  });
});
