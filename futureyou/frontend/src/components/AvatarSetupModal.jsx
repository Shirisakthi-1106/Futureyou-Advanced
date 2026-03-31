import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { getAvatar, saveAvatar } from "../lib/avatarService";

const AVATAR_OPTIONS = [
  { id: "neutral", label: "Neutral Avatar", url: "/avatars/default_neutral.glb", type: "default" },
  { id: "male", label: "Male Avatar", url: "/avatars/default_male.glb", type: "default" },
  { id: "female", label: "Female Avatar", url: "/avatars/default_female.glb", type: "default" },
  { id: "custom", label: "Custom Avatar", url: "/avatars/demo_custom.glb", type: "custom" },
];

export default function AvatarSetupModal({ isOpen, onClose, onComplete }) {
  const { user } = useContext(AppContext);
  const [selectedId, setSelectedId] = useState("neutral");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      getAvatar(user.id).then(data => {
        if (data?.avatar_preference) {
          setSelectedId(data.avatar_preference);
        } else if (data?.avatar_model_url) {
          const matching = AVATAR_OPTIONS.find(opt => opt.url === data.avatar_model_url);
          if (matching) setSelectedId(matching.id);
        }
      });
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    const selectedOption = AVATAR_OPTIONS.find(o => o.id === selectedId);
    setIsSaving(true);
    
    if (user) {
      await saveAvatar(user.id, {
        avatar_preference: selectedOption.id,
        avatar_model_url: selectedOption.url,
        avatar_type: selectedOption.type
      });
    }
    
    setIsSaving(false);
    if (onComplete) onComplete(selectedOption.url);
    if (onClose) onClose();
  };

  const handleSkip = () => {
    if (onComplete) onComplete("/avatars/default_neutral.glb");
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
          >
            <div className="w-full px-6 py-5 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                <User className="text-neon" size={20} />
                Choose Your FutureYou Avatar
              </h2>
              <p className="text-xs text-gray-400 mt-1">Select the visualization that best represents your simulated future self.</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = selectedId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedId(opt.id)}
                      className={`relative p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${
                        isSelected 
                          ? "border-neon bg-neon/5 shadow-[0_0_15px_rgba(0,255,204,0.15)]" 
                          : "border-white/5 bg-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black uppercase transition-colors ${
                          isSelected ? "bg-neon text-dark" : "bg-dark border border-white/10 text-white"
                      }`}>
                        {opt.id[0]}
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
                        {opt.label}
                      </span>
                      
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-neon">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-5 border-t border-white/5 flex items-center justify-end gap-3 bg-dark">
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                disabled={isSaving}
              >
                Skip for now
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-neon text-dark text-sm font-black uppercase tracking-wider rounded-xl hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

