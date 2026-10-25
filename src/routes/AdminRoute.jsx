import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Gate routes that require an ADMIN role.
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
