import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', full_name: 'Test User' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import LiveChat from './LiveChat';

// JSDOM does not implement scrollIntoView - stub it once
beforeAll(() => {
  Element.prototype.scrollIntoView = function () {};
});

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

describe('[P1][chat] LiveChat', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<LiveChat />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Live Support')).toBeInTheDocument();
  });

  it('renders online status', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders message input', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('renders quick reply options', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Issue with matching')).toBeInTheDocument();
    expect(screen.getByText('Payment problem')).toBeInTheDocument();
  });

  it('renders greeting message', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText(/How can we help you today/)).toBeInTheDocument();
  });
});
