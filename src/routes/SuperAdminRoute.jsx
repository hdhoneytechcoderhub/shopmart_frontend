import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Gate routes that require the SUPER_ADMIN role.
export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  return children;
}
