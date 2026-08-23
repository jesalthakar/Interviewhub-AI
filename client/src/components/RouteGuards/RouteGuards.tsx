import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../../services/auth';

interface RouteGuardProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => (
  getAccessToken() ? children : <Navigate to="/login" replace />
);

export const PublicOnlyRoute: React.FC<RouteGuardProps> = ({ children }) => (
  getAccessToken() ? <Navigate to="/" replace /> : children
);
