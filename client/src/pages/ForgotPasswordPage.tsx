import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err: any) {
      // Even on error, show the safe confirmation or network error
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
            Account Recovery
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Rest easy. Your plant garden history is safe.
          </h2>
          <p className="text-[#C9D8C5] text-sm leading-relaxed">
            Enter the email associated with your account and we will send a secure link to reset your password.
          </p>
        </div>
        <div className="relative z-10 text-xs text-[#C9D8C5]/60">
          Handcrafted for plant owners. No spam, no AI slop.
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.045] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/leaf-texture.webp')` }}
          aria-hidden="true"
        />
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden relative z-10">
          <Logo textColor="#1F3D2B" size={32} />
        </Link>

        <div className="w-full max-w-sm space-y-6 relative z-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#3E7B52] hover:text-[#1F3D2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
              Reset password
            </h1>
            <p className="text-sm text-[#736159] mt-1.5">
              Enter your email address and we'll send a 30-minute recovery link.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="p-6 rounded-2xl bg-white border border-[#C9D8C5] shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#E4EDB8] flex items-center justify-center text-[#1F3D2B]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1F3D2B]">
                Check your inbox
              </h2>
              <p className="text-xs sm:text-sm text-[#736159] leading-relaxed">
                If an account exists with <strong className="text-[#1F3D2B]">{email}</strong>, we have sent a secure password reset link. Please check your inbox and spam folder.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Return to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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
                    autoFocus
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
                Send reset link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
