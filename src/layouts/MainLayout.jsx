import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function MainLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
