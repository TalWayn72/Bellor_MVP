import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Belt-and-suspenders: per-file lucide-react mock in addition to setup.js global.
vi.mock('lucide-react', () => {
  const c = () => null;
  const obj = { __esModule: true, default: c };
  'Activity,AlertCircle,AlertTriangle,ArrowLeft,ArrowRight,Ban,Bell,Book,Briefcase,Calendar,Camera,Check,CheckCircle,ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Circle,Clock,Compass,Copy,Crown,Download,ExternalLink,Eye,EyeOff,File,FileText,Flag,Flame,Gift,GripVertical,Heart,HelpCircle,Image,Info,Lightbulb,Loader2,Lock,LogOut,Mail,MapPin,Menu,MessageCircle,MessageSquare,Mic,MicOff,Minus,MoreHorizontal,MoreVertical,Palette,PanelLeft,Pencil,Phone,Plus,RefreshCw,Save,Search,Send,Settings,Share2,Shield,SlidersHorizontal,Sparkles,Square,Star,Trash2,TrendingUp,Trophy,Type,Upload,User,UserCheck,UserPlus,Users,Video,VideoOff,Volume2,X,XCircle,Zap'.split(',').forEach(k => { obj[k] = c; });
  return obj;
});

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', is_premium: false },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/premium/PlanCards', () => ({
  PlanSelector: ({ selectedPlan }) => (
    <div data-testid="plan-selector">Plan: {selectedPlan}</div>
  ),
  FeaturesList: ({ isPremium }) => (
    <div data-testid="features-list">Premium: {isPremium ? 'yes' : 'no'}</div>
  ),
}));

import Premium from './Premium';

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

describe('[P0][payments] Premium', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Premium />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('Bellor Premium')).toBeInTheDocument();
  });

  it('renders unlock potential heading', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('Unlock Your Full Potential')).toBeInTheDocument();
  });

  it('renders plan selector', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByTestId('plan-selector')).toBeInTheDocument();
  });

  it('renders features list', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByTestId('features-list')).toHaveTextContent('Premium: no');
  });

  it('renders stats section', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('10K+')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
