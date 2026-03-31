import { createContext, useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const isSyncing = useRef(false);

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
    
    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("futureyou_settings");
        const defaults = {
            guardianEmail: "",
            guardianEmails: [],
            guardianName: "Guardian",
            sentinelEnabled: true,
            alertPrivacyLevel: "aggregate",
            pushNotifications: true,
            voiceEnabled: true,
            voiceAutoplay: true,
            voiceGender: "auto",
        };
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (!parsed.guardianEmails) parsed.guardianEmails = [];
                return { ...defaults, ...parsed };
            } catch { return defaults; }
        }
        return defaults;
    });

    // --- AVATAR STATE ---
    const [selectedAvatar, setSelectedAvatar] = useState(() => {
        const saved = localStorage.getItem("futureyou_selected_avatar");
        try {
            return saved ? JSON.parse(saved) : {
                name: "Alucard",
                path: "/avatars/alucard.glb",
                gender: "male"
            };
        } catch {
            return { name: "Alucard", path: "/avatars/alucard.glb", gender: "male" };
        }
    });

    // --- PERSISTENCE LOGIC (LOCAL) ---
    useEffect(() => {
        localStorage.setItem("futureyou_settings", JSON.stringify(settings));
        if (user?.uid && !isSyncing.current) {
            // Save to Firestore if real user
            setDoc(doc(db, "configs", user.uid), { settings }, { merge: true }).catch(console.error);
        }
    }, [settings, user]);

    useEffect(() => {
        localStorage.setItem("futureyou_selected_avatar", JSON.stringify(selectedAvatar));
        if (user?.uid && !isSyncing.current) {
            // Save to Firestore if real user
            setDoc(doc(db, "configs", user.uid), { selectedAvatar }, { merge: true }).catch(console.error);
        }
    }, [selectedAvatar, user]);

    useEffect(() => {
        if (predictions) localStorage.setItem("futureyou_predictions", JSON.stringify(predictions));
    }, [predictions]);

    useEffect(() => {
        if (trajectory) localStorage.setItem("futureyou_trajectory", JSON.stringify(trajectory));
    }, [trajectory]);

    useEffect(() => {
        if (habits) localStorage.setItem("futureyou_habits", JSON.stringify(habits));
    }, [habits]);

    // --- FIREBASE SYNC (FETCH) ---
    useEffect(() => {
        if (user && !user.isDemo) {
            isSyncing.current = true;
            getDoc(doc(db, "configs", user.uid)).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.settings) setSettings(data.settings);
                    if (data.selectedAvatar) setSelectedAvatar(data.selectedAvatar);
                }
                isSyncing.current = false;
            }).catch(err => {
                console.error("Firestore sync error:", err);
                isSyncing.current = false;
            });
        }
    }, [user]);

    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const loginDemoUser = (customUser) => {
        const demoUser = customUser || {
            uid: "demo-user",
            email: "demo@futureyou.local",
            displayName: "Demo User",
            isDemo: true
        };
        localStorage.setItem("futureyou_demo_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setIsAuthOpen(false);
    };

    const logoutUser = async () => {
        localStorage.removeItem("futureyou_demo_user");
        setUser(null);
        await signOut(auth);
    };

    // --- SESSION INITIALIZATION ---
    useEffect(() => {
        const demoUser = localStorage.getItem("futureyou_demo_user");
        if (demoUser) {
            try {
                setUser(JSON.parse(demoUser));
                setAuthLoading(false);
            } catch {
                localStorage.removeItem("futureyou_demo_user");
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // If we have a demo user, ignore firebase state unless manually asked
            if (!localStorage.getItem("futureyou_demo_user")) {
                setUser(firebaseUser);
                if (firebaseUser) setIsAuthOpen(false);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const avatarUrl = selectedAvatar?.path || "/avatars/alucard.glb";
    const setAvatarUrl = (path) => setSelectedAvatar(prev => ({ ...prev, path }));

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

