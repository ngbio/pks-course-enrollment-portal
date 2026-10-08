import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/api';
import StatusScreen from '../screens/StatusScreen';
import { ErrorState, Loading } from './ui';

export default function ProtectedRoute({
  admin = false,
  children,
}: {
  admin?: boolean;
  children: ReactNode;
}) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loading label="Đang kiểm tra tài khoản…" />;
  if (auth.error) return <ErrorState message={auth.error} retry={auth.retry} />;
  if (!auth.user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  if (admin ? !isAdmin(auth.user.role) : auth.user.role !== 'STUDENT') {
    return <StatusScreen forbidden />;
  }
  return children;
}
