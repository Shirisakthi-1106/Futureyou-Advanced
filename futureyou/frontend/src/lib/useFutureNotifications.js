import { useState, useEffect, useRef } from 'react';

/**
 * Hook to trigger toast and browser notifications based on user state / time.
 * @param {Object} predictions - Prediction parameters
 * @returns {{ notification: Object|null, dismissNotification: function }}
 */
export function useFutureNotifications(predictions) {
  const [notification, setNotification] = useState(null);
  
  // Keep track of what we've alerted so we don't spam
  const triggersFired = useRef({
    lateNight: false,
    highStress: false,
  });

  // Request browser notification permission upon mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!predictions) return;

    // Checks periodically, or upon prediction updates
    const checkTriggers = () => {
      const currentHour = new Date().getHours();
      
      // Setup triggers
      // 1. Time trigger: past 1 AM and before 5 AM
      const isLateNight = currentHour >= 1 && currentHour < 5;
      
      // 2. High stress trigger
      const stressLevel = predictions.stress_pct ?? 0;
      const isHighStress = stressLevel > 80;

      // Evaluate and fire Notification 1 (Late Night)
      if (isLateNight && !triggersFired.current.lateNight) {
        fireNotification({
          id: 'late-night-alert',
          title: 'Late Night Alert',
          message: 'You’re still awake. This is affecting your future stress.',
          type: 'warning'
        });
        triggersFired.current.lateNight = true;
      }

      // Evaluate and fire Notification 2 (High Stress)
      if (isHighStress && !triggersFired.current.highStress) {
        fireNotification({
          id: 'high-stress-alert',
          title: 'Stress Alert',
          message: 'A 30-minute break now will improve your trajectory.',
          type: 'alert'
        });
        triggersFired.current.highStress = true;
      }
    };

    // Check immediately, then poll every 60s
    checkTriggers();
    const interval = setInterval(checkTriggers, 60000);

    return () => clearInterval(interval);
  }, [predictions]);

  const fireNotification = ({ id, title, message, type }) => {
    // 1. Set internal state to show Toast
    setNotification({ id, title, message, type, timestamp: Date.now() });

    // 2. Browser native push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico' // Optionally provide a relevant image here
      });
    }

    // 3. Auto dismiss toast state after 6 seconds
    setTimeout(() => {
      setNotification(prev => prev?.id === id ? null : prev);
    }, 6000);
  };

  const dismissNotification = () => setNotification(null);

  return { notification, dismissNotification };
}
