import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email address and password');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await login(email.trim(), password);
      showToast('Welcome back to your indoor garden');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F1E6]">
      {/* ── Left Editorial Panel (desktop only) ─────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12 bg-[#1F3D2B] text-[#F5F1E6] relative overflow-hidden">
        {/* Subtle background ambient image with low opacity */}
        <div
          className="absolute inset-0 opacity-[0.35] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/living-room.webp')` }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo textColor="#F5F1E6" size={36} />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-[#E4EDB8]/15 text-[#E4EDB8] border border-[#E4EDB8]/20">
            Daily Garden Journal
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Keep every leaf thriving, season by season.
          </h2>
          <p className="text-[#C9D8C5] text-sm leading-relaxed">
            Log waterings, check room light exposures, record growth photos, and get gentle reminders matched to real plant needs.
          </p>
        </div>

        <div className="relative z-10 text-xs text-[#C9D8C5]/60">
          Handcrafted for plant owners. No spam, no AI slop.
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/leaf-texture.webp')` }}
          aria-hidden="true"
        />
        {/* Mobile Header Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden relative z-10">
          <Logo textColor="#1F3D2B" size={32} />
        </Link>

        <div className="w-full max-w-sm space-y-6 relative z-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-[#736159] mt-1.5">
              Enter your credentials to manage your plants
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-botanical pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1F3D2B]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#3E7B52] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input-botanical pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#736159] hover:text-[#1F3D2B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#736159]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#C9D8C5] text-[#1F3D2B] focus:ring-[#1F3D2B]"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-[#736159] pt-2">
            First time caring with us?{' '}
            <Link to="/register" className="font-semibold text-[#1F3D2B] underline hover:text-[#3E7B52]">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
