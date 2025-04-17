import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseNotificationsResult {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  setupNotifications: () => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  useEffect(() => {
    const checkPermission = async () => {
      if (isSupported) {
        const permission = await Notification.requestPermission();
        setIsPermissionGranted(permission === 'granted');
      }
    };

    checkPermission();
  }, [isSupported]);

  const setupNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!isSupported) {
        toast({
          title: "Error",
          description: "Push notifications are not supported in your browser.",
          variant: "destructive"
        });
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');

      const permission = await Notification.requestPermission();
      setIsPermissionGranted(permission === 'granted');

      if (permission !== 'granted') {
        toast({
          title: "Error",
          description: "Notification permission was not granted.",
          variant: "destructive"
        });
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
      });

      if (!subscription) {
        toast({
          title: "Error",
          description: "Failed to subscribe to push notifications.",
          variant: "destructive"
        });
        return false;
      }

      // Here you would typically send the subscription to your server
      // so you can send push notifications to this user.
      console.log('Push subscription:', subscription);
      toast({
        title: "Success",
        description: "Successfully subscribed to push notifications."
      });
      return true;

    } catch (error) {
      console.error("Failed to register for notifications", error);
      toast({
        title: "Error",
        description: "Failed to register for notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isPermissionGranted, isLoading, setupNotifications };
};
