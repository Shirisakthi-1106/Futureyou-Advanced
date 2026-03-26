import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldAlert } from 'lucide-react';

export default function AvatarCreatorModal({ isOpen, onClose, onAvatarCreated }) {
    const iframeRef = useRef(null);
    const [iframeFailed, setIframeFailed] = useState(false);
    const popupRef = useRef(null);

    // Listen for the cross-domain postMessage from either the iframe OR the popup window
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event) => {
            if (!event.data || typeof event.data !== 'string') return;

            if (event.data.startsWith('v1.avatar.exported')) {
                const url = event.data.replace('v1.avatar.exported.', '');
                onAvatarCreated(url);
                if (popupRef.current) popupRef.current.close();
                onClose();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onAvatarCreated, onClose]);

    const openPopup = () => {
        setIframeFailed(true); // Hide the iframe if they use the popup
        popupRef.current = window.open(
            'https://demo.readyplayer.me/avatar?frameApi',
            'ReadyPlayerMeCreator',
            'width=600,height=800,left=100,top=100'
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-5xl h-[85vh] relative rounded-3xl overflow-hidden glass-panel border border-neon/30 flex flex-col bg-dark/90"
                    >
                        {/* Header bar */}
                        <div className="w-full h-14 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 shrink-0 relative bg-dark z-20">
                            <h2 className="text-sm font-bold tracking-widest text-neon uppercase flex items-center gap-2">
                                Neural Link Avatar Initialization
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors flex items-center justify-center -mr-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* The Interstitial Popup Fallback UI */}
                        {iframeFailed && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/95 z-10 px-8 text-center">
                                <ShieldAlert className="text-red-400 mb-6" size={64} />
                                <h3 className="text-2xl font-bold mb-4">Iframe Blocked by Browser Security</h3>
                                <p className="text-gray-400 max-w-md mb-8">
                                    Depending on your adblocker or localhost settings, browsers often block third-party cookies or cross-site iframes. 
                                    <br/><br/>
                                    We fell back to a Secure Popup Window instead. The app will automatically capture your avatar link as soon as you finish in the popup!
                                </p>
                                <button 
                                    onClick={openPopup}
                                    className="h-[50px] px-8 bg-neon text-dark font-bold rounded-xl hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink size={20} />
                                    Re-Open Creator Popup
                                </button>
                            </div>
                        )}

                        {/* The Ready Player Me Iframe */}
                        <div className="w-full h-full flex-1 relative bg-transparent">
                            {/* Loading state behind iframe */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
                                <div className="animate-pulse text-neon text-sm tracking-widest uppercase mb-6">Connecting to Creator Engine...</div>
                                <div className="text-xs text-gray-500 max-w-sm text-center">
                                    Seeing a sad face or grey box? Your browser blocked the connection.
                                </div>
                                <button onClick={openPopup} className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors text-gray-400 flex items-center gap-2">
                                    <ExternalLink size={14} /> Open Secure Popup Instead
                                </button>
                            </div>
                            
                            {!iframeFailed && (
                                <iframe
                                    ref={iframeRef}
                                    src="https://demo.readyplayer.me/avatar?frameApi"
                                    allow="camera *; microphone *"
                                    className="w-full h-full border-none outline-none relative z-0"
                                    title="Ready Player Me Avatar Creator"
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
