import { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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

    const [predictions, setPredictions] = useState(() => {
        try {
            const saved = localStorage.getItem("futureyou_predictions");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [trajectory, setTrajectory] = useState(() => {
        try {
            const saved = localStorage.getItem("futureyou_trajectory");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [quests, setQuests] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [sentinelEvents, setSentinelEvents] = useState([]);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("futureyou_settings");
        const defaults = {
            guardianEmail: "",       // Legacy single email (still supported)
            guardianEmails: [],      // Multi-recipient email list
            guardianName: "Guardian",
            sentinelEnabled: true,
            alertPrivacyLevel: "aggregate", // aggregate | full
            pushNotifications: true,
            // Voice Settings
            voiceEnabled: true,
            voiceAutoplay: true,
            voiceGender: "auto", // auto | male | female | neutral
        };
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure guardianEmails array exists even for old saves
            if (!parsed.guardianEmails) parsed.guardianEmails = [];
            return { ...defaults, ...parsed };
        }
        return defaults;
    });

    useEffect(() => {
        localStorage.setItem("futureyou_settings", JSON.stringify(settings));
    }, [settings]);
    
    // Avatar Selection State
    const [selectedAvatar, setSelectedAvatar] = useState(() => {
        const saved = localStorage.getItem("futureyou_selected_avatar");
        return saved ? JSON.parse(saved) : {
            name: "Alucard",
            path: "/avatars/alucard.glb",
            gender: "male"
        };
    });

    useEffect(() => {
        localStorage.setItem("futureyou_selected_avatar", JSON.stringify(selectedAvatar));
    }, [selectedAvatar]);
    
    // Compatibility layer for components still using avatarUrl
    const avatarUrl = selectedAvatar.path;
    const setAvatarUrl = (path) => {
         // This is a legacy setter, we should prefer setSelectedAvatar
         setSelectedAvatar(prev => ({ ...prev, path }));
    };

    // Persist predictions, trajectory, and habits to localStorage for GuardianPortal
    useEffect(() => {
        if (predictions) {
            localStorage.setItem("futureyou_predictions", JSON.stringify(predictions));
        }
    }, [predictions]);

    useEffect(() => {
        if (trajectory) {
            localStorage.setItem("futureyou_trajectory", JSON.stringify(trajectory));
        }
    }, [trajectory]);

    useEffect(() => {
        if (habits) {
            localStorage.setItem("futureyou_habits", JSON.stringify(habits));
        }
    }, [habits]);

    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const loginDemoUser = (customUser) => {
        const demoUser = customUser || {
            id: "demo-user",
            email: "demo@futureyou.local",
            name: "Demo User",
            isDemo: true
        };
        localStorage.setItem("futureyou_demo_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setIsAuthOpen(false);
    };

    const logoutUser = async () => {
        localStorage.removeItem("futureyou_demo_user");
        setUser(null);
        await supabase.auth.signOut();
    };

    useEffect(() => {
        const checkAuth = async () => {
            const demoUser = localStorage.getItem("futureyou_demo_user");
            if (demoUser) {
                setUser(JSON.parse(demoUser));
                setAuthLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!localStorage.getItem("futureyou_demo_user")) {
                setUser(session?.user || null);
            }
            setAuthLoading(false);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!localStorage.getItem("futureyou_demo_user")) {
                setUser(session?.user || null);
                if (session?.user) {
                    setIsAuthOpen(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{
            user, authLoading, loginDemoUser, logoutUser,
            isAuthOpen, setIsAuthOpen,
            habits, setHabits,
            predictions, setPredictions,
            trajectory, setTrajectory,
            quests, setQuests,
            timeline, setTimeline,
            chatHistory, setChatHistory,
            avatarUrl, setAvatarUrl,
            selectedAvatar, setSelectedAvatar,
            settings, setSettings,
            sentinelEvents, setSentinelEvents
        }}>
            {children}
        </AppContext.Provider>
    );
}

