import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '../services/pushNotifications';

interface UsePushNotifications {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotifications {
  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(
    isPushSupported() ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    getCurrentSubscription().then((sub) => {
      if (!cancelled) setIsSubscribed(!!sub);
    });
    return () => { cancelled = true; };
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || isLoading) return;
    setIsLoading(true);
    try {
      await subscribeToPush();
      setPermission(Notification.permission);
      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isLoading]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || isLoading) return;
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isLoading]);

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
