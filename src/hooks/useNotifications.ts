'use client';

import { useEffect } from 'react';

export function useNotifications() {
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        });
      }
    }
  }, []);

  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
    return null;
  };

  return { showNotification };
}


