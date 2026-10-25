import { useSelector, useDispatch } from 'react-redux';
import { Sun, Moon } from 'lucide-react';
import { selectTheme, toggleTheme } from '../../redux/slices/uiSlice';

export default function ThemeToggle({ className = '' }) {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className={`btn-ghost h-10 w-10 p-0 ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
