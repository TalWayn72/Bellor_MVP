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

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import PrivacyPolicy from './PrivacyPolicy';

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

describe('[P3][profile] PrivacyPolicy', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('Your Privacy Matters')).toBeInTheDocument();
  });

  it('renders privacy policy title', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    // "Privacy Policy" appears in both the header and the card title
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThanOrEqual(1);
  });

  it('renders policy sections', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('9. Your Rights')).toBeInTheDocument();
    expect(screen.getByText('14. GDPR Rights (EU Users)')).toBeInTheDocument();
  });

  it('renders contact section', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('Contact Privacy Team')).toBeInTheDocument();
  });
});
