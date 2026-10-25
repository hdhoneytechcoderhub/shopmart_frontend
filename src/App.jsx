import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import Loader from './components/common/Loader';
import { useCommerceSync } from './hooks/useCommerceSync';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import SuperAdminRoute from './routes/SuperAdminRoute';
import EngineerRoute from './routes/EngineerRoute';
import SessionTimeoutWarning from './components/auth/SessionTimeoutWarning';
import ErrorBoundary from './components/common/ErrorBoundary';

// Code-split every page for fast first load.
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const SharedWishlist = lazy(() => import('./pages/SharedWishlist'));
const Compare = lazy(() => import('./pages/Compare'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Faq = lazy(() => import('./pages/Faq'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OtpVerification = lazy(() => import('./pages/OtpVerification'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const EngineerDashboard = lazy(() => import('./pages/engineer/EngineerDashboard'));

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Orders = lazy(() => import('./pages/dashboard/Orders'));
const OrderDetail = lazy(() => import('./pages/dashboard/OrderDetail'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Wishlist = lazy(() => import('./pages/dashboard/Wishlist'));
const Addresses = lazy(() => import('./pages/dashboard/Addresses'));
const Payments = lazy(() => import('./pages/dashboard/Payments'));
const Loyalty = lazy(() => import('./pages/dashboard/Loyalty'));
const Returns = lazy(() => import('./pages/dashboard/Returns'));
const AccountSettings = lazy(() => import('./pages/dashboard/AccountSettings'));
const Security = lazy(() => import('./pages/dashboard/Security'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const CustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'));
const CustomerSegments = lazy(() => import('./pages/admin/CustomerSegments'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdvancedAnalytics = lazy(() => import('./pages/admin/AdvancedAnalytics'));
const AdminInventoryReport = lazy(() => import('./pages/admin/AdminInventoryReport'));
const NotificationTemplates = lazy(() => import('./pages/admin/NotificationTemplates'));
const Campaigns = lazy(() => import('./pages/admin/Campaigns'));
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const AdminMachines = lazy(() => import('./pages/admin/AdminMachines'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));

const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const AdminManagement = lazy(() => import('./pages/superadmin/AdminManagement'));
const ProductApprovals = lazy(() => import('./pages/superadmin/ProductApprovals'));
const ActivityLogs = lazy(() => import('./pages/superadmin/ActivityLogs'));
const SystemSettings = lazy(() => import('./pages/superadmin/SystemSettings'));
const SuperAdminReports = lazy(() => import('./pages/superadmin/SuperAdminReports'));
const AttendanceReports = lazy(() => import('./pages/superadmin/AttendanceReports'));
const CompanyManagement = lazy(() => import('./pages/superadmin/CompanyManagement'));
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'));
const SubscriptionManagement = lazy(() => import('./pages/superadmin/SubscriptionManagement'));
const SystemHealth = lazy(() => import('./pages/superadmin/SystemHealth'));

export default function App() {
  // Pull server cart/wishlist into Redux on sign-in (real backend only).
  useCommerceSync();

  return (
    <>
      <ScrollToTop />
      <SessionTimeoutWarning />
      <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Storefront */}
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/wishlist/shared" element={<SharedWishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route
              path="/checkout"
              element={<ProtectedRoute><Checkout /></ProtectedRoute>}
            />
            <Route
              path="/order-success/:id"
              element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>}
            />
            <Route
              path="/payment-failed/:id?"
              element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>}
            />
          </Route>

          {/* Legacy payment route — flow is now consolidated into /checkout */}
          <Route path="/payment" element={<Navigate to="/checkout" replace />} />

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Customer dashboard */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="returns" element={<Returns />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<AccountSettings />} />
            <Route path="security" element={<Security />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Engineer */}
          <Route path="/engineer" element={<EngineerRoute><EngineerDashboard /></EngineerRoute>} />          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/segments" element={<CustomerSegments />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics/advanced" element={<AdvancedAnalytics />} />
            <Route path="inventory-report" element={<AdminInventoryReport />} />
            <Route path="notification-templates" element={<NotificationTemplates />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="machines" element={<AdminMachines />} />
            <Route path="services" element={<AdminServices />} />
          </Route>

          {/* Super Admin */}
          <Route
            path="/superadmin"
            element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="admins" element={<AdminManagement />} />
            <Route path="approvals" element={<ProductApprovals />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="activity" element={<ActivityLogs />} />
            <Route path="reports" element={<SuperAdminReports />} />
            <Route path="attendance" element={<AttendanceReports />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          <Route path="*" element={<MainLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}
