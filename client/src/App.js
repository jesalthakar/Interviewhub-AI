import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import InterviewSetupPage from './pages/InterviewSetupPage/InterviewSetupPage';
import InterviewSessionPage from './pages/InterviewSessionPage/InterviewSessionPage';
import InterviewResultsPage from './pages/InterviewResultsPage/InterviewResultsPage';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards/RouteGuards';
import { restoreAccessToken } from './services/auth';

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    restoreAccessToken().finally(() => {
      if (isMounted) setAuthReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        {!authReady ? <div className="app-loading" role="status">Loading...</div> : (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
            <Route path="/interviews/:id/session" element={<ProtectedRoute><InterviewSessionPage /></ProtectedRoute>} />
            <Route path="/interviews/:id/results" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
