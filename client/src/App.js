import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import InterviewSetupPage from './pages/InterviewSetupPage/InterviewSetupPage';
import InterviewSessionPage from './pages/InterviewSessionPage/InterviewSessionPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/setup" element={<InterviewSetupPage />} />
          <Route path="/interviews/:id/session" element={<InterviewSessionPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
