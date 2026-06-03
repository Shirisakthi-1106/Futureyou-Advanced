import { useState, useContext } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ isOpen, onClose }) {
    const { loginDemoUser } = useContext(AppContext);
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage("");

        if (!auth) {
            console.warn("Firebase Auth not initialized. Logging in locally...");
            setMessage("Sync limited. Logging you in locally...");
            setTimeout(() => {
                loginAsLocalUser(email || "demo@futureyou.local");
                navigate("/dashboard");
            }, 800);
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                onClose();
                navigate("/dashboard");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                setMessage("Timeline Initialized. Future Sync Complete.");
                setTimeout(() => {
                    onClose();
                    navigate("/dashboard");
                }, 1500);
            }
        } catch (err) {
            console.error("Auth Error:", err);
            const msg = err.message || "Unknown error";
            
            // Auto-fallback strategy for demo-friendliness
            if (msg.includes("network-request-failed") || msg.includes("quota-exceeded")) {
                console.warn("Auth issue — switching to local mode.");
                setMessage("Sync limited. Logging you in locally...");
                setTimeout(() => {
                    loginAsLocalUser(email);
                    navigate("/dashboard");
                }, 800);
                return;
            }

            if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
                setError("Invalid coordinates. Please verify your email and security key.");
            } else if (msg.includes("auth/email-already-in-use")) {
                setError("This email is already linked to a timeline. Try authenticating.");
            } else if (msg.includes("auth/weak-password")) {
                setError("Security key too weak. Use at least 6 characters.");
            } else {
                setError(msg.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        setMessage("");

        if (!auth) {
            console.warn("Firebase Auth not initialized. Logging in locally...");
            setMessage("Sync limited. Logging you in locally...");
            setTimeout(() => {
                loginAsLocalUser("google-user@futureyou.local");
                navigate("/dashboard");
            }, 800);
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            onClose();
            navigate("/dashboard");
        } catch (err) {
            console.error("Google Auth Error:", err);
            const msg = err.message || "Unknown error";
            setError(msg.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    // Create a local user profile (independent of Firebase)
    const loginAsLocalUser = (userEmail) => {
        const localUser = {
            uid: `local-${btoa(userEmail).replace(/[=+/]/g, '').slice(0, 16)}`,
            email: userEmail,
            displayName: userEmail.split("@")[0],
            isLocal: true,
            isDemo: true
        };
        localStorage.setItem("futureyou_demo_user", JSON.stringify(localUser));
        loginDemoUser(localUser);
    };

    const handleSkipLogin = () => {
        loginDemoUser();
        navigate("/dashboard");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-md relative"
                    >
                        <div className="neon-border absolute inset-0 -z-10 rounded-3xl opacity-50"></div>
                        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                            <div className="relative z-10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <h2 className="text-3xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-neon to-purple bg-clip-text text-transparent">
                                    {isLogin ? "Access Timeline" : "Initialize Profile"}
                                </h2>
                                <p className="text-gray-400 text-sm mb-8">
                                    {isLogin ? "Welcome back to your quantum trajectory." : "Synchronizing your neural link to the future."}
                                </p>

                                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 block">Email Coordinates</label>
                                        <input
                                            type="email"
                                            value={email}
                                            autoFocus
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 block">Security Key</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon transition-colors"
                                        />
                                    </div>

                                    {error && (
                                        <div className="mt-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <div className="text-red-400 text-sm">{error}</div>
                                        </div>
                                    )}
                                    {message && (
                                        <div className="mt-1 p-3 rounded-xl bg-neon/10 border border-neon/20">
                                            <div className="text-neon text-sm">{message}</div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-2 py-4 bg-white text-dark font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] hover:text-neon transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Processing..." : (isLogin ? "Authenticate" : "Create Profile")}
                                    </button>
                                </form>

                                <div className="w-full flex items-center gap-3 mt-5 mb-4">
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">or</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Sign in with Google
                                </button>

                                <div className="mt-6 flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError(null);
                                            setMessage("");
                                        }}
                                        className="text-gray-400 text-sm hover:text-white transition-colors"
                                    >
                                        {isLogin ? "Don't have a timeline yet? Initialize one." : "Already linked? Authenticate here."}
                                    </button>

                                    <div className="w-full flex items-center gap-3 mt-2">
                                        <div className="flex-1 h-px bg-white/10"></div>
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">or</span>
                                        <div className="flex-1 h-px bg-white/10"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSkipLogin}
                                        className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
                                    >
                                        Continue without account →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
