/**
 * pages.config.js - Page routing configuration with Lazy Loading
 *
 * All pages are now loaded lazily for better performance.
 * This reduces initial bundle size and improves First Contentful Paint (FCP).
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 */
import { lazy } from 'react';

// Lazy load all pages for better performance
const Achievements = lazy(() => import('./pages/Achievements'));
const AdminActivityMonitoring = lazy(() => import('./pages/AdminActivityMonitoring'));
const AdminChatMonitoring = lazy(() => import('./pages/AdminChatMonitoring'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPreRegistration = lazy(() => import('./pages/AdminPreRegistration'));
const AdminReportManagement = lazy(() => import('./pages/AdminReportManagement'));
const AdminSystemSettings = lazy(() => import('./pages/AdminSystemSettings'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AudioTask = lazy(() => import('./pages/AudioTask'));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'));
const CompatibilityQuiz = lazy(() => import('./pages/CompatibilityQuiz'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const Creation = lazy(() => import('./pages/Creation'));
const DateIdeas = lazy(() => import('./pages/DateIdeas'));
const Discover = lazy(() => import('./pages/Discover'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EmailSupport = lazy(() => import('./pages/EmailSupport'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Feedback = lazy(() => import('./pages/Feedback'));
const FilterSettings = lazy(() => import('./pages/FilterSettings'));
const FollowingList = lazy(() => import('./pages/FollowingList'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const Home = lazy(() => import('./pages/Home'));
const IceBreakers = lazy(() => import('./pages/IceBreakers'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const Login = lazy(() => import('./pages/Login'));
const Matches = lazy(() => import('./pages/Matches'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Premium = lazy(() => import('./pages/Premium'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'));
const PrivateChat = lazy(() => import('./pages/PrivateChat'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileBoost = lazy(() => import('./pages/ProfileBoost'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));
const SafetyCenter = lazy(() => import('./pages/SafetyCenter'));
const Settings = lazy(() => import('./pages/Settings'));
const SharedSpace = lazy(() => import('./pages/SharedSpace'));
const Splash = lazy(() => import('./pages/Splash'));
const Stories = lazy(() => import('./pages/Stories'));
const TemporaryChats = lazy(() => import('./pages/TemporaryChats'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ThemeSettings = lazy(() => import('./pages/ThemeSettings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UserVerification = lazy(() => import('./pages/UserVerification'));
const VideoDate = lazy(() => import('./pages/VideoDate'));
const VideoTask = lazy(() => import('./pages/VideoTask'));
const VirtualEvents = lazy(() => import('./pages/VirtualEvents'));
const Welcome = lazy(() => import('./pages/Welcome'));
const WriteTask = lazy(() => import('./pages/WriteTask'));

// Layout is loaded synchronously (always needed)
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminActivityMonitoring": AdminActivityMonitoring,
    "AdminChatMonitoring": AdminChatMonitoring,
    "AdminDashboard": AdminDashboard,
    "AdminPreRegistration": AdminPreRegistration,
    "AdminReportManagement": AdminReportManagement,
    "AdminSystemSettings": AdminSystemSettings,
    "AdminUserManagement": AdminUserManagement,
    "Analytics": Analytics,
    "AudioTask": AudioTask,
    "BlockedUsers": BlockedUsers,
    "CompatibilityQuiz": CompatibilityQuiz,
    "CreateStory": CreateStory,
    "Creation": Creation,
    "DateIdeas": DateIdeas,
    "Discover": Discover,
    "EditProfile": EditProfile,
    "EmailSupport": EmailSupport,
    "FAQ": FAQ,
    "Feedback": Feedback,
    "FilterSettings": FilterSettings,
    "FollowingList": FollowingList,
    "HelpSupport": HelpSupport,
    "Home": Home,
    "IceBreakers": IceBreakers,
    "LiveChat": LiveChat,
    "Login": Login,
    "Matches": Matches,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Premium": Premium,
    "PrivacyPolicy": PrivacyPolicy,
    "PrivacySettings": PrivacySettings,
    "PrivateChat": PrivateChat,
    "Profile": Profile,
    "ProfileBoost": ProfileBoost,
    "ReferralProgram": ReferralProgram,
    "SafetyCenter": SafetyCenter,
    "Settings": Settings,
    "SharedSpace": SharedSpace,
    "Splash": Splash,
    "Stories": Stories,
    "TemporaryChats": TemporaryChats,
    "TermsOfService": TermsOfService,
    "ThemeSettings": ThemeSettings,
    "UserProfile": UserProfile,
    "UserVerification": UserVerification,
    "VideoDate": VideoDate,
    "VideoTask": VideoTask,
    "VirtualEvents": VirtualEvents,
    "Welcome": Welcome,
    "WriteTask": WriteTask,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
