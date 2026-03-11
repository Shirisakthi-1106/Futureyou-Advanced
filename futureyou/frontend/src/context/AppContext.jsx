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
    const [chatHistory, setChatHistory] = useState([]);

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
            chatHistory, setChatHistory
        }}>
            {children}
        </AppContext.Provider>
    );
}
