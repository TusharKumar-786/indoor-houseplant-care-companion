import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Lazy-loaded page chunks ──────────────────────────────────────────────────
const LandingPage      = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage        = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage     = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = React.lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage    = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PlantsPage       = React.lazy(() => import('./pages/PlantsPage').then(m => ({ default: m.PlantsPage })));
const AddPlantPage     = React.lazy(() => import('./pages/AddPlantPage').then(m => ({ default: m.AddPlantPage })));
const EditPlantPage    = React.lazy(() => import('./pages/EditPlantPage').then(m => ({ default: m.EditPlantPage })));
const PlantDetailPage  = React.lazy(() => import('./pages/PlantDetailPage').then(m => ({ default: m.PlantDetailPage })));
const RoomsPage        = React.lazy(() => import('./pages/RoomsPage').then(m => ({ default: m.RoomsPage })));
const SchedulePage     = React.lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const LogBookPage      = React.lazy(() => import('./pages/LogBookPage').then(m => ({ default: m.LogBookPage })));
const ProfilePage      = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PlantHealthPage  = React.lazy(() => import('./pages/PlantHealthPage').then(m => ({ default: m.PlantHealthPage })));
const CareCalendarPage = React.lazy(() => import('./pages/CareCalendarPage').then(m => ({ default: m.CareCalendarPage })));
const PlantQuizPage    = React.lazy(() => import('./pages/PlantQuizPage').then(m => ({ default: m.PlantQuizPage })));
const CareReportPage   = React.lazy(() => import('./pages/CareReportPage').then(m => ({ default: m.CareReportPage })));
const AdminPage        = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const BlogPage         = React.lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage     = React.lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const WriteBlogPage    = React.lazy(() => import('./pages/WriteBlogPage').then(m => ({ default: m.WriteBlogPage })));
const NotFoundPage     = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F1E6]">
    <div className="w-8 h-8 rounded-full border-2 border-[#1F3D2B] border-t-transparent animate-spin" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E6]">
        <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E6]">
        <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

        {/* Public Auth routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Public Blog routes stay on public layout whether logged in or out */}
        <Route element={<PublicLayout />}>
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Route>

        {/* Protected In-App routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/plants" element={<PlantsPage />} />
          <Route path="/add-plant" element={<AddPlantPage />} />
          <Route path="/plants/:id" element={<PlantDetailPage />} />
          <Route path="/plants/:id/edit" element={<EditPlantPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/calendar" element={<CareCalendarPage />} />
          <Route path="/quiz" element={<PlantQuizPage />} />
          <Route path="/report" element={<CareReportPage />} />
          <Route path="/logs" element={<LogBookPage />} />
          <Route path="/health-assistant" element={<PlantHealthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Authenticated blog writing */}
          <Route path="/blog/new" element={<WriteBlogPage />} />
          <Route path="/blog/:slug/edit" element={<WriteBlogPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
