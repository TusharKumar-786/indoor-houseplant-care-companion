import { useState, useEffect, useCallback } from 'react';

const NOTIFICATIONS_PREF_KEY = 'leafpulse_notifications_enabled';

export interface UseNotificationsResult {
  isSupported: boolean;
  isEnabled: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  toggleNotifications: () => Promise<boolean>;
  sendCareAlert: (title: string, options?: NotificationOptions) => void;
}

export const useNotifications = (): UseNotificationsResult => {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return isSupported ? Notification.permission : 'denied';
  });
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATIONS_PREF_KEY) === 'true';
  });

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      if (Notification.permission !== 'granted') {
        setIsEnabled(false);
        localStorage.setItem(NOTIFICATIONS_PREF_KEY, 'false');
      }
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(NOTIFICATIONS_PREF_KEY, 'true');
        return true;
      } else {
        setIsEnabled(false);
        localStorage.setItem(NOTIFICATIONS_PREF_KEY, 'false');
        return false;
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      return false;
    }
  }, [isSupported]);

  const toggleNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    if (permission !== 'granted') {
      return await requestPermission();
    }
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    localStorage.setItem(NOTIFICATIONS_PREF_KEY, String(nextState));
    return nextState;
  }, [isSupported, permission, isEnabled, requestPermission]);

  const sendCareAlert = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !isEnabled) return;
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (err) {
      console.warn('Unable to trigger notification:', err);
    }
  }, [isSupported, permission, isEnabled]);

  return {
    isSupported,
    isEnabled,
    permission,
    requestPermission,
    toggleNotifications,
    sendCareAlert,
  };
};
