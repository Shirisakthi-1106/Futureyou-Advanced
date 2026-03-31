import { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * Global Avatar Voice Hook
 * Manages SpeechSynthesis, voice selection, and persona-based adjustments.
 */
export function useAvatarVoice() {
    const { settings, selectedAvatar, predictions } = useContext(AppContext);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Stop any ongoing speech when the component unmounts
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const playVoice = useCallback((text, personaId = 'future') => {
        if (!settings.voiceEnabled || !text || !('speechSynthesis' in window)) return;

        // Cancel previous speech
        window.speechSynthesis.cancel();

        // Strip markdown/special chars for cleaner speech
        const cleanText = text.replace(/[*#_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // 1. Determine Voice Gender
        const voices = window.speechSynthesis.getVoices();
        const targetGender = settings.voiceGender === 'auto' 
            ? (selectedAvatar?.gender || 'male') 
            : settings.voiceGender;

        // 2. Find matching voice (More robust prioritized list)
        const getPreferredVoice = () => {
            const matches = voices.filter(v => v.lang.includes('en-'));
            if (targetGender === 'female') {
                return matches.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria')) || matches[0];
            } else if (targetGender === 'male') {
                return matches.find(v => v.name.includes('Male') || v.name.includes('Google UK English Male') || v.name.includes('David') || v.name.includes('Alex') || v.name.includes('Daniel')) || matches[0];
            }
            return matches.find(v => !v.name.includes('Female') && !v.name.includes('Male')) || matches[0];
        };

        const preferredVoice = getPreferredVoice();
        if (preferredVoice) utterance.voice = preferredVoice;

        // 3. Persona & Wellbeing Adjustments (Calibrated for Hackathon Demo)
        let pitch = 1.0;
        let rate = 1.0;
        
        if (personaId === 'burnout') {
            pitch = 0.82;
            rate = 0.82; // Slower, regretful
        } else if (personaId === 'future') {
            pitch = 1.05;
            rate = 1.08; // Confident, slightly faster
        } else if (personaId === 'present') {
            pitch = 0.95;
            rate = 1.0; // Analytical, regular
        }

        // Wellbeing modifier
        if (predictions) {
            const wb = predictions.wellbeing_score || 5;
            if (wb >= 8) {
                pitch += 0.1;
                rate += 0.05;
            } else if (wb <= 4) {
                pitch -= 0.1;
                rate -= 0.05;
            }
        }

        utterance.pitch = pitch;
        utterance.rate = rate;

        // 4. Lifecycle events
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [settings, selectedAvatar, predictions]);

    const stopVoice = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        isSpeaking,
        playVoice,
        stopVoice
    };
}
