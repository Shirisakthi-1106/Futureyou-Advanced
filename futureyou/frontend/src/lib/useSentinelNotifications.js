import { useEffect, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function useSentinelNotifications(user, predictions, habits) {
    const { setSentinelEvents } = useContext(AppContext);
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }, []);

    const sendNotification = useCallback((title, body, type = 'warning') => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/logo.png', // Fallback to a generic icon if not found
                badge: '/logo.png',
                tag: 'sentinel-alert',
                silent: false,
            });
        }

        // Log to sentinel events for the Guardian Portal
        const newEvent = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: body,
            type
        };

        setSentinelEvents(prev => {
            const updated = [newEvent, ...prev].slice(0, 10);
            localStorage.setItem('futureyou_sentinel_logs', JSON.stringify(updated));
            return updated;
        });
    }, [setSentinelEvents]);

    useEffect(() => {
        if (!user || !predictions) return;

        // Start checking for Sentinel alerts
        const checkSentinel = () => {
            const now = new Date();
            const hour = now.getHours();

            // 1. Time-based Habit Sentinel (11 PM - 5 AM)
            // If user is accessing the app during late hours and has poor sleep habits
            if (hour >= 23 || hour <= 5) {
                if (habits.sleep_hours < 7) {
                    sendNotification(
                        '🌑 Future You is Struggling',
                        `It's ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Every hour awake now cuts into your predicted ${predictions.exam_score.toFixed(0)} academic score.`,
                        'warning'
                    );
                }
            }

            // 2. High Stress Sentinel
            if (predictions.stress_pct > 75) {
                sendNotification(
                    '⚠️ Critical Stress Detected',
                    'Your current trajectory shows peak burnout risk. Take a 5-minute breather to stabilize your future self.',
                    'alert'
                );
            }

            // 3. Dropout Risk Sentinel
            if (predictions.dropout_prob > 30) {
                sendNotification(
                    '🚨 Strategic Warning',
                    'A significant dropout risk has been identified in your 5-year simulation. Review your Micro Recovery Plan now.',
                    'critical'
                );
            }
        };

        // Initial request
        requestPermission();

        // Check every 30 minutes in production, but let's do once on mount for demo
        checkSentinel();

        const interval = setInterval(checkSentinel, 1000 * 60 * 30); // 30 mins
        return () => clearInterval(interval);
    }, [user, predictions, habits, requestPermission, sendNotification]);

    return { requestPermission };
}
