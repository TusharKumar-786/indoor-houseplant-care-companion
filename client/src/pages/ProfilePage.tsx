import React, { useState, useRef } from 'react';
import { User, Mail, Lock, Camera, Trash2, Bell, CheckCircle2, MapPin, MailCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from '../components/ui/Button';
import { assetUrl } from '../utils/image';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const { isSupported, isEnabled, toggleNotifications, sendCareAlert } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [weeklyDigest, setWeeklyDigest] = useState(user?.weekly_digest !== false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  const getInitials = (n?: string) => {
    if (!n) return 'LP';
    return n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post('/auth/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser(res.data.data.user);
        showToast('Profile photo updated!');
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to upload photo', 'error');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setIsUploadingAvatar(true);
      const res = await api.delete('/auth/avatar');
      updateUser(res.data.data.user);
      showToast('Profile photo removed');
    } catch (err) {
      showToast('Failed to remove avatar', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleToggleNotifications = async () => {
    const next = await toggleNotifications();
    if (next) {
      showToast('Smart Care Notifications enabled!');
      sendCareAlert('LeafPulse Smart Reminders Active', {
        body: 'You will receive gentle alerts when plants require watering or care.',
      });
    } else {
      showToast('Notifications disabled or permission not granted', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        city: city.trim() || null,
        weekly_digest: weeklyDigest,
      };
      if (newPassword) {
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
          setError('New password must be at least 8 characters and contain both letters and numbers');
          return;
        }
        if (!currentPassword) {
          setError('Current password is required to change password');
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.put('/auth/profile', payload);
      updateUser(res.data.data.user);
      showToast('Profile saved successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
          Gardener Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
          Manage your account credentials, avatar, and notification settings
        </p>
      </div>

      {/* Avatar Card */}
      <div className="card p-6 bg-white border-[#C9D8C5] flex flex-col sm:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={assetUrl(user.avatar_url)}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C9D8C5]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#1F3D2B] text-white flex items-center justify-center font-serif text-xl font-bold">
                {getInitials(user?.name)}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-[#1F3D2B]/50 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h2 className="font-serif font-bold text-lg text-[#1F3D2B]">
              {user?.name || 'Gardener'}
            </h2>
            <p className="text-xs text-[#736159]">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Camera className="w-4 h-4" />}
          >
            Upload Photo
          </Button>

          {user?.avatar_url && (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handleAvatarDelete}
              className="text-[#C8693F] hover:bg-[#FBECE6]"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Remove
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Notifications Card */}
      <div className="card p-5 bg-white border-[#C9D8C5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
              Watering Reminders
            </h3>
            <p className="text-xs text-[#736159]">
              {isSupported
                ? 'Receive browser alerts when plants are due for hydration'
                : 'Browser notifications not supported on this device'}
            </p>
          </div>
        </div>

        {isSupported && (
          <Button
            type="button"
            variant={isEnabled ? 'primary' : 'quiet'}
            size="sm"
            onClick={handleToggleNotifications}
            icon={isEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : undefined}
          >
            {isEnabled ? 'Active' : 'Enable'}
          </Button>
        )}
      </div>

      {/* Account Details Form Card */}
      <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5]">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
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
                className="input-botanical pl-10"
                required
              />
            </div>
          </div>

          {/* Email */}
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
                className="input-botanical pl-10"
                required
              />
            </div>
          </div>

          {/* City (for local weather tips) */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Home City
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Seattle, London"
                className="input-botanical pl-10"
              />
            </div>
            <p className="text-[11px] text-[#736159] mt-1">
              Used to display localized weather tips and humidity recommendations on your dashboard.
            </p>
          </div>

          {/* Weekly Digest Toggle (Disabled / Coming Soon) */}
          <div className="p-4 rounded-xl bg-[#F5F1E6]/50 border border-[#C9D8C5] flex items-center justify-between opacity-75">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
                <MailCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#1F3D2B] flex items-center gap-2">
                  Weekly Botanical Digest
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECE5D4] text-[#736159] font-medium">Coming soon</span>
                </span>
                <span className="text-[11px] text-[#736159]">Receive an email summary of plants requiring care every Monday</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#C9D8C5]/60 rounded-full cursor-not-allowed"></div>
            </label>
          </div>

          {/* Password Section */}
          <div className="pt-4 space-y-4 border-t border-[#C9D8C5]/60">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
                Change Password
              </h3>
              <p className="text-xs text-[#736159] mt-0.5">
                Leave blank if you do not want to alter your password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="input-botanical pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                New Password (min 8 characters, letters and numbers)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-botanical pl-10"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
