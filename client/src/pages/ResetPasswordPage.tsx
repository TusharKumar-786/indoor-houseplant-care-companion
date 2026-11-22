import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password. The link may have expired or already been used.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F1E6]">
      {/* ── Left Editorial Panel (desktop only) ─────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12 bg-[#1F3D2B] text-[#F5F1E6] relative overflow-hidden">
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
            Secure Authentication
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Choose a strong new password for your garden.
          </h2>
          <p className="text-[#C9D8C5] text-sm leading-relaxed">
            Once saved, your new credentials will immediately protect your care logs, room data, and plant profiles.
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
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden relative z-10">
          <Logo textColor="#1F3D2B" size={32} />
        </Link>

        <div className="w-full max-w-sm space-y-6 relative z-10">
          {!token && !success ? (
            <div className="p-6 rounded-2xl bg-white border border-[#C9D8C5] shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#FBECE6] flex items-center justify-center text-[#C8693F]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1F3D2B]">
                Invalid or Missing Link
              </h2>
              <p className="text-xs sm:text-sm text-[#736159] leading-relaxed">
                This password reset link is invalid or incomplete. Please request a new reset email from the forgot password page.
              </p>
              <div className="pt-2">
                <Link to="/forgot-password">
                  <Button variant="primary" className="w-full">
                    Request new link
                  </Button>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="p-6 rounded-2xl bg-white border border-[#C9D8C5] shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#E4EDB8] flex items-center justify-center text-[#1F3D2B]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1F3D2B]">
                Password updated
              </h2>
              <p className="text-xs sm:text-sm text-[#736159] leading-relaxed">
                Your password has been securely reset. You can now sign in using your new credentials.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/login')}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Sign in with new password
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
                  Set new password
                </h1>
                <p className="text-sm text-[#736159] mt-1.5">
                  Must be at least 8 characters with letters and numbers.
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
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="input-botanical pl-10 pr-10"
                      required
                      autoFocus
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

                <div>
                  <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="input-botanical pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Save and sign in
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
