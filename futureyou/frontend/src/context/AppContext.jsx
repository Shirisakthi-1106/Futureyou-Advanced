import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [habits, setHabits] = useState({
        sleep_hours: 6.5,
        study_hours: 3.0,
        screen_time: 6.0,
        social_media_hours: 3.0,
        exercise_frequency: 2,
        mood_score: 6,
        diet_quality: 1,
        mental_health_rating: 6,
        years_ahead: 5
    });

    const [predictions, setPredictions] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    const [quests, setQuests] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [sentinelEvents, setSentinelEvents] = useState([]);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('futureyou_settings');
        return saved ? JSON.parse(saved) : {
            guardianEmail: '',
            sentinelEnabled: true,
            alertPrivacyLevel: 'aggregate', // aggregate | full
            pushNotifications: true
        };
    });

    useEffect(() => {
        localStorage.setItem('futureyou_settings', JSON.stringify(settings));
    }, [settings]);
    
    // Store user's custom avatar URL, persist in localStorage for simplicity
    const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('futureyou_avatar_url') || '');

    useEffect(() => {
        if (avatarUrl) {
            localStorage.setItem('futureyou_avatar_url', avatarUrl);
        } else {
            localStorage.removeItem('futureyou_avatar_url');
        }
    }, [avatarUrl]);

    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                // If they successfully log in, we can close the modal automatically
                setIsAuthOpen(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{
            user, authLoading,
            isAuthOpen, setIsAuthOpen,
            habits, setHabits,
            predictions, setPredictions,
            trajectory, setTrajectory,
            quests, setQuests,
            timeline, setTimeline,
            chatHistory, setChatHistory,
            avatarUrl, setAvatarUrl,
            settings, setSettings,
            sentinelEvents, setSentinelEvents
        }}>
            {children}
        </AppContext.Provider>
    );
}
