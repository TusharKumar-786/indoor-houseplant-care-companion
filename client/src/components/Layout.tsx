import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  DoorClosed,
  CalendarDays,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  HeartPulse,
  BookMarked,
  Droplets,
  ExternalLink,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './ui/Logo';
import { AskLeafyDrawer } from './AskLeafyDrawer';
import { WelcomeTourModal } from './WelcomeTourModal';
import api from '../api/client';
import { assetUrl } from '../utils/image';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [dueCount, setDueCount] = useState<number>(0);

  // Poll or fetch due today count for the sidebar badge
  useEffect(() => {
    let isMounted = true;
    const fetchDueCount = async () => {
      try {
        const res = await api.get('/dashboard');
        if (isMounted && res.data?.data?.counts?.due_today !== undefined) {
          setDueCount(res.data.data.counts.due_today);
        }
      } catch (err) {
        // Silently tolerate if unauthenticated or network drop
      }
    };
    fetchDueCount();
    window.addEventListener('leafpulse:care-logged', fetchDueCount);
    return () => {
      isMounted = false;
      window.removeEventListener('leafpulse:care-logged', fetchDueCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Plants', path: '/plants', icon: Sprout },
    { label: 'Rooms', path: '/rooms', icon: DoorClosed },
    {
      label: 'Care Schedule',
      path: '/schedule',
      icon: CalendarDays,
      badge: dueCount > 0 ? dueCount : undefined,
    },
    { label: 'Care Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Care Logs', path: '/logs', icon: BookOpen },
    { label: 'Plant Health', path: '/health-assistant', icon: HeartPulse },
    { label: 'Plant Quiz', path: '/quiz', icon: Sparkles },
    { label: 'Botanical Blog', path: '/blog', icon: BookMarked, isPublic: true },
    ...(user?.is_admin
      ? [{ label: 'Admin Console', path: '/admin', icon: ShieldCheck }]
      : []),
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'LP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isPlantRoute =
    location.pathname.startsWith('/plants/') || location.pathname === '/add-plant';

  return (
    <div className="min-h-screen flex bg-[#F5F1E6] text-[#3B2F2A] relative">
      {/* Tactile leaf texture photographic background layer */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-[0.30] z-0"
        style={{ backgroundImage: `url('/images/plants/leaf-texture.webp')` }}
        aria-hidden="true"
      />
      {/* Soft cream gradient overlay so text stays readable over the texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(135deg, rgba(245,241,230,0.70) 0%, rgba(245,241,230,0.45) 60%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* ─── Desktop Sticky Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen bg-[#1F3D2B] border-r border-[#14291D] z-30">
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
          <Link to="/dashboard">
            <Logo textColor="#F5F1E6" size={34} variant="light" />
          </Link>
        </div>

        {/* Navigation items (internal scroll) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/plants' && isPlantRoute);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white bg-white/15 font-semibold shadow-xs'
                    : 'text-[#C9D8C5] hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 flex-shrink-0 transition-opacity ${
                      isActive ? 'opacity-100 text-[#E4EDB8]' : 'opacity-70'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.isPublic && (
                    <ExternalLink className="w-3.5 h-3.5 text-[#C9D8C5]/60" />
                  )}
                  {/* Overdue / Due Today Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#C8693F] text-white">
                      <Droplets className="w-3 h-3" />
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Pinned Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/10 group"
          >
            {user?.avatar_url ? (
              <img
                src={assetUrl(user.avatar_url)}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-[#C9D8C5]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#E4EDB8] text-[#1F3D2B] flex-shrink-0">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Tushar Kumar'}
              </p>
              <p className="text-[11px] text-[#C9D8C5]/70 truncate">
                {user?.email || 'Care Companion'}
              </p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#C9D8C5]/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4 opacity-70" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Slide-in Drawer ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#14291D]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 flex flex-col justify-between p-4 shadow-2xl z-10 bg-[#1F3D2B] text-white">
            <div>
              {/* Mobile brand header */}
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/10">
                <Logo textColor="#F5F1E6" size={30} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'text-white bg-white/20 font-semibold'
                          : 'text-[#C9D8C5] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4.5 h-4.5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#C8693F] text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#C9D8C5] hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Canvas ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between bg-[#F5F1E6]/95 backdrop-blur-sm border-b border-[#C9D8C5]/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-[#3B2F2A] hover:bg-[#C9D8C5]/30 md:hidden transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile inline logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Logo size={26} showText={true} />
            </div>
          </div>

          {/* Top-right quick user profile capsule */}
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#C9D8C5] bg-white hover:bg-[#F5F1E6] transition-colors"
          >
            {user?.avatar_url ? (
              <img
                src={assetUrl(user.avatar_url)}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#1F3D2B] text-white flex-shrink-0">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="text-xs font-semibold text-[#1F3D2B] hidden sm:block">
              {user?.name || 'Tushar Kumar'}
            </span>
          </NavLink>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 px-4 py-2 flex justify-around items-center z-40 bg-[#F5F1E6]/95 backdrop-blur-md border-t border-[#C9D8C5] shadow-lg">
        {[
          { to: '/dashboard', label: 'Home', Icon: LayoutDashboard },
          { to: '/plants', label: 'Plants', Icon: Sprout },
          { to: '/schedule', label: 'Schedule', Icon: CalendarDays, badge: dueCount },
          { to: '/rooms', label: 'Rooms', Icon: DoorClosed },
        ].map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#1F3D2B] font-bold'
                  : 'text-[#736159] hover:text-[#1F3D2B]'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#C8693F]" />
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Mobile More drawer trigger */}
        <div className="relative">
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2.5 rounded-xl transition-colors ${
              moreMenuOpen ||
              ['/logs', '/health-assistant', '/blog', '/profile'].includes(
                location.pathname
              )
                ? 'text-[#1F3D2B] font-bold'
                : 'text-[#736159]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>

          {moreMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMoreMenuOpen(false)}
              />
              <div className="absolute bottom-12 right-0 w-52 rounded-2xl py-2 z-40 mb-2 overflow-hidden bg-white border border-[#C9D8C5] shadow-lifted">
                {[
                  { to: '/logs', label: 'Care Logs', Icon: BookOpen },
                  { to: '/health-assistant', label: 'Plant Health', Icon: HeartPulse },
                  { to: '/blog', label: 'Care Stories', Icon: BookMarked },
                  ...(user?.is_admin
                    ? [{ to: '/admin', label: 'Admin Console', Icon: ShieldCheck }]
                    : []),
                  { to: '/profile', label: 'My Profile', Icon: User },
                ].map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#3B2F2A] hover:bg-[#F5F1E6] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#1F3D2B]" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                <div className="my-1 border-t border-[#C9D8C5]/50" />
                <button
                  onClick={() => {
                    setMoreMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#C8693F] hover:bg-[#FBECE6] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Floating Botanical AI Assistant */}
      <AskLeafyDrawer />

      {/* New User Welcome Onboarding Tour */}
      <WelcomeTourModal />
    </div>
  );
};
