import React from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { Logo } from './ui/Logo';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F1E6] text-[#3B2F2A]">
      {/* ── Public Navigation Header ───────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#F5F1E6]/95 backdrop-blur-md border-b border-[#C9D8C5]/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo textColor="#1F3D2B" size={32} />
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-[#1F3D2B] font-bold' : 'text-[#736159] hover:text-[#1F3D2B]'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                isActive ? 'text-[#1F3D2B] font-bold' : 'text-[#736159] hover:text-[#1F3D2B]'
              }
            >
              Botanical Blog
            </NavLink>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1F3D2B] text-white hover:bg-[#14291D] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1F3D2B] hover:bg-[#C9D8C5]/30 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1F3D2B] text-white hover:bg-[#14291D] transition-colors"
                >
                  Join Free
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ── Main Content Area ──────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      {/* ── Public Footer ─────────────────────────────────── */}
      <footer className="bg-[#1F3D2B] text-[#F5F1E6] py-12 border-t border-[#14291D] mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <Logo textColor="#F5F1E6" size={32} />
            <p className="text-xs text-[#C9D8C5] text-center sm:text-right max-w-sm">
              Handcrafted indoor plant care companion. Made with intention for thriving domestic gardens.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#C9D8C5]/60">
            <p>© {new Date().getFullYear()} LeafPulse. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Register
              </Link>
              <Link to="/#contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
