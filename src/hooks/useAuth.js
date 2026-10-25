import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../redux/slices/authSlice';
import { ROLES } from '../utils/constants';

export const useAuth = () => {
  const { user, isAuthenticated, status, error } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isEngineer: user?.role === ROLES.ENGINEER,
    status,
    error,
    logout: () => dispatch(logoutAction()),
  };
};
