import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage    from './pages/AuthPage';
import Platform    from './pages/Platform';

function AppRoutes() {
  const { session, isConfigured, isPasswordRecovery } = useAuth();
  const loading = session === undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Marketing / sales */}
      <Route path="/"
        element={
          isConfigured && session
            ? <Navigate to="/app" replace />
            : <LandingPage />
        }
      />

      {/* Auth (login / sign-up / password reset) */}
      <Route path="/login"
        element={
          session && !isPasswordRecovery ? <Navigate to="/app" replace /> : <AuthPage />
        }
      />

      {/* Platform — all sub-routes handled inside Platform */}
      <Route path="/app/*"
        element={
          isConfigured && !session
            ? <Navigate to="/login" replace />
            : <Platform />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
