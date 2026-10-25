import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Scale } from 'lucide-react';
import Logo from '../common/Logo';
import NotificationBell from './NotificationBell';
import SearchBox from './SearchBox';
import ThemeToggle from './ThemeToggle';
import { openCartDrawer } from '../../redux/slices/uiSlice';
import { selectCartCount } from '../../redux/slices/cartSlice';
import { selectWishlist } from '../../redux/slices/wishlistSlice';
import { selectCompareItems } from '../../redux/slices/compareSlice';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?deal=true', label: 'Deals' },
  { to: '/shop?sort=newest', label: 'New Arrivals' },
  { to: '/shop?sort=popular', label: 'Best Sellers' },
  { to: '/shop?category=electronics', label: 'Electronics' },
  { to: '/shop?category=fashion', label: 'Fashion' },
  { to: '/shop?category=home-living', label: 'Home & Living' },
  { to: '/blog', label: 'Blog' },
];

export default function Header() {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const wishCount = useSelector(selectWishlist).length;
  const compareCount = useSelector(selectCompareItems).length;
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page">
        <div className="flex h-16 items-center gap-3">
          <button className="btn-ghost h-10 w-10 p-0 lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Logo />

          {/* Search — the storefront's primary action */}
          <div className="ml-2 hidden flex-1 md:block">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />

            <Link to="/dashboard/wishlist" className="relative btn-ghost h-10 w-10 p-0" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>

            <Link to="/compare" className="relative btn-ghost h-10 w-10 p-0" aria-label="Compare">
              <Scale className="h-5 w-5" />
              {compareCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {compareCount}
                </span>
              )}
            </Link>

            <button onClick={() => dispatch(openCartDrawer())} className="relative btn-ghost h-10 w-10 p-0" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                onBlur={() => setTimeout(() => setAccountOpen(false), 150)}
                className="btn-ghost h-10 gap-1.5 px-2"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
                <span className="hidden text-sm font-medium sm:inline">
                  {isAuthenticated ? user?.name?.split(' ')[0] : 'Account'}
                </span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-52 animate-slide-up rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
                  {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                          <LayoutDashboard className="h-4 w-4" /> Admin panel
                        </Link>
                      )}
                      <Link to="/dashboard/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">My orders</Link>
                      <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Log in</Link>
                      <Link to="/register" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Create account</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 pb-2 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'text-brand-700' : 'text-ink-soft hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <div className="mb-3">
            <SearchBox onNavigate={() => setMenuOpen(false)} />
          </div>
          <div className="flex flex-col">
            {NAV.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
