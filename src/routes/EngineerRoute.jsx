import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Gate routes that require the ENGINEER role.
export default function EngineerRoute({ children }) {
  const { isAuthenticated, isEngineer, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isEngineer) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  return children;
}
