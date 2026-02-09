import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { NavigationProvider } from '@/contexts/NavigationContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OAuthCallback from './pages/OAuthCallback';
import BackendStatus from '@/components/BackendStatus';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import GlobalErrorBoundary from '@/components/states/GlobalErrorBoundary';

// Loading spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/80">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  'Login', 'Welcome', 'Splash', 'Onboarding',
  'PrivacyPolicy', 'TermsOfService',
]);

// Routes that require admin privileges
const ADMIN_ROUTES = new Set([
  'AdminDashboard', 'AdminUserManagement', 'AdminReportManagement',
  'AdminChatMonitoring', 'AdminActivityMonitoring', 'AdminPreRegistration',
  'AdminSystemSettings',
]);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/** Wraps a page with the correct route guard based on its name */
function wrapWithGuard(pageName, element) {
  if (PUBLIC_ROUTES.has(pageName)) return element;
  if (ADMIN_ROUTES.has(pageName)) {
    return <ProtectedRoute requireAdmin>{element}</ProtectedRoute>;
  }
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show branded loading screen while checking auth state
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app with Suspense for lazy-loaded pages
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          wrapWithGuard(mainPageKey, (
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          ))
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              wrapWithGuard(path, (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              ))
            }
          />
        ))}
        {/* OAuth callback route - no layout wrapper, no guard */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <GlobalErrorBoundary>
    <BackendStatus />
    <AuthProvider>
      <SocketProvider>
        <QueryClientProvider client={queryClientInstance}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <NavigationProvider>
              <NavigationTracker />
              <AuthenticatedApp />
            </NavigationProvider>
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </SocketProvider>
    </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
