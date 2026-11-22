import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await register(name.trim(), email.trim(), password, confirmPassword);
      showToast('Welcome to LeafPulse! Your garden is ready.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F1E6]">
      {/* ── Left Editorial Panel ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12 bg-[#1F3D2B] text-[#F5F1E6] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/plant-shop.webp')` }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo textColor="#F5F1E6" size={36} />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-[#E4EDB8]/15 text-[#E4EDB8] border border-[#E4EDB8]/20">
            Join 3,200+ Houseplant Keepers
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Start simple. Learn your plants rhythms.
          </h2>
          <p className="text-[#C9D8C5] text-sm leading-relaxed">
            Track care schedules by room, log growth milestones, and avoid the guesswork that leads to yellowing leaves.
          </p>
        </div>

        <div className="relative z-10 text-xs text-[#C9D8C5]/60">
          Open, private, and focused strictly on plant care.
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────── */}
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
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-[#736159] mt-1.5">
              Begin your plant care log in less than a minute
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
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tushar Kumar"
                  className="input-botanical pl-10"
                  required
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input-botanical pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm mt-2"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-[#736159] pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#1F3D2B] underline hover:text-[#3E7B52]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
