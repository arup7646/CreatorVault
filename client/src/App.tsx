import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/Layout';
import { LandingLayout } from './components/layout/Layout';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { TrashPage } from './pages/TrashPage';
import { SearchPage } from './pages/SearchPage';
import { RecentActivityPage } from './pages/RecentActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminActivityPage } from './pages/AdminActivityPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingLayout><LandingPage /></LandingLayout>} />
      
      <Route element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>}>
        <Route path="/login" />
      </Route>
      
      <Route element={<PublicRoute><AuthLayout><RegisterPage /></AuthLayout></PublicRoute>}>
        <Route path="/register" />
      </Route>
      
      <Route element={<PublicRoute><AuthLayout><ForgotPasswordPage /></AuthLayout></PublicRoute>}>
        <Route path="/forgot-password" />
      </Route>
      
      <Route element={<PublicRoute><AuthLayout><ResetPasswordPage /></AuthLayout></PublicRoute>}>
        <Route path="/reset-password" />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/edit" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/settings" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/members" element={<ProjectDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/recent" element={<RecentActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/activity" element={<AdminActivityPage />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;