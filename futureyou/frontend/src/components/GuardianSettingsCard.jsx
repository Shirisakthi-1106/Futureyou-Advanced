import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, Mail, Bell, Send, CheckCircle2, AlertTriangle, X, Plus, Wifi, WifiOff, Clock, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

// Simple email regex
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function GuardianSettingsCard() {
    const { settings, setSettings, user } = useContext(AppContext);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null); // { type: 'success'|'error', message: string }
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [smtpStatus, setSmtpStatus] = useState(null); // null = loading, object = result
    const [smtpChecking, setSmtpChecking] = useState(false);

    // Check SMTP status on mount
    const checkSmtpStatus = async () => {
        setSmtpChecking(true);
        try {
            const res = await axios.get(`${API}/smtp-status`, { timeout: 15000 });
            setSmtpStatus(res.data);
        } catch (err) {
            setSmtpStatus({ configured: false, reason: 'Could not reach backend API server' });
        }
        setSmtpChecking(false);
    };

    useEffect(() => {
        checkSmtpStatus();
    }, []);

    const emails = settings.guardianEmails || [];

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const addEmail = () => {
        const trimmed = emailInput.trim();
        if (!trimmed) return;
        if (!isValidEmail(trimmed)) {
            setEmailError('Invalid email format');
            return;
        }
        if (emails.includes(trimmed)) {
            setEmailError('Email already added');
            return;
        }
        updateSetting('guardianEmails', [...emails, trimmed]);
        // Also keep legacy guardianEmail in sync with first entry
        if (emails.length === 0) {
            updateSetting('guardianEmail', trimmed);
        }
        setEmailInput('');
        setEmailError('');
    };

    const removeEmail = (email) => {
        const updated = emails.filter(e => e !== email);
        updateSetting('guardianEmails', updated);
        // Keep legacy email in sync
        updateSetting('guardianEmail', updated[0] || '');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail();
        }
    };

    const handleSendTest = async () => {
        if (emails.length === 0 || testLoading) return;
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await axios.post(`${API}/test-alert`, {
                emails: emails,
                name: settings.guardianName || "Guardian",
                user_name: user?.name || user?.email || "FutureYou User"
            }, { timeout: 30000 });
            const data = res.data;
            if (data.status === 'success') {
                setTestResult({ 
                    type: 'success', 
                    message: `✓ Delivered to ${data.sent_to.length} recipient(s)${data.failed.length > 0 ? `. Failed: ${data.failed.join(', ')}` : ''}` 
                });
                // Refresh SMTP status since it worked
                if (!smtpStatus?.configured) checkSmtpStatus();
            } else {
                setTestResult({ type: 'error', message: data.error || data.message || 'Unknown failure' });
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.error || err.message || 'Network error';
            setTestResult({ type: 'error', message: detail });
        }
        setTestLoading(false);
        setTimeout(() => setTestResult(null), 12000);
    };

    const smtpOk = smtpStatus?.configured === true;
    const lastAlertTime = settings._lastAlertTime;

    return (
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] -z-10 group-hover:bg-red-500/10 transition-all duration-700" />
            
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                        <Shield className="text-red-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight italic">Sentinel Intervention</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Early Detection & Proactive Prevention</p>
                    </div>
                </div>
                
                {/* SMTP Status Indicator */}
                <button 
                    onClick={checkSmtpStatus}
                    disabled={smtpChecking}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80 ${
                        smtpStatus === null ? 'border-white/10 text-gray-500' :
                        smtpOk ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'
                    }`}
                    title="Click to recheck SMTP status"
                >
                    {smtpChecking ? (
                        <RefreshCw size={10} className="animate-spin" />
                    ) : smtpStatus === null ? (
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                    ) : smtpOk ? (
                        <Wifi size={10} />
                    ) : (
                        <WifiOff size={10} />
                    )}
                    {smtpChecking ? 'Checking...' : smtpStatus === null ? 'Checking...' : smtpOk ? 'SMTP Ready' : 'SMTP Issue'}
                </button>
            </div>

            <div className="space-y-6">
                {/* SMTP Warning */}
                {smtpStatus && !smtpOk && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">SMTP Configuration Issue</p>
                            <p className="text-[9px] text-gray-500 font-medium">{smtpStatus.reason}</p>
                            <p className="text-[9px] text-gray-600 mt-1">
                                Email alerts require valid SMTP credentials. If using Gmail, you must use an 
                                <strong className="text-red-300"> App Password</strong> (not your regular password). 
                                Go to <span className="text-red-300">myaccount.google.com → Security → 2-Step Verification → App passwords</span>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Sentinel Enable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/3 border border-white/5 group/toggle hover:border-red-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <Bell size={18} className={settings.sentinelEnabled ? "text-red-400" : "text-gray-600"} />
                        <div>
                            <span className="text-sm font-bold uppercase tracking-wider block">Sentinel Mode: {settings.sentinelEnabled ? "Active" : "Halted"}</span>
                            <span className="text-[9px] text-gray-600 font-medium">
                                {settings.sentinelEnabled 
                                    ? "Auto-alerts will fire when high/critical risk detected" 
                                    : "Enable to receive automatic guardian alerts"}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSetting('sentinelEnabled', !settings.sentinelEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.sentinelEnabled ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-gray-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.sentinelEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {/* Guardian Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Guardian Display Name</label>
                    <input
                        value={settings.guardianName}
                        onChange={e => updateSetting('guardianName', e.target.value)}
                        placeholder="Parent / Mentor / Counselor"
                        className="w-full bg-white/3 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:opacity-20"
                    />
                </div>

                {/* Multi-Email Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">
                        Guardian Email Recipients ({emails.length})
                    </label>
                    
                    {/* Email Chips */}
                    {emails.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {emails.map(email => (
                                <div key={email} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-300 group/chip hover:border-red-500/40 transition-colors">
                                    <Mail size={10} />
                                    <span>{email}</span>
                                    <button 
                                        onClick={() => removeEmail(email)}
                                        className="p-0.5 rounded-full hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Email Input */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                            <input
                                value={emailInput}
                                onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Add guardian email address"
                                type="email"
                                className="w-full bg-white/3 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:opacity-20"
                            />
                        </div>
                        <button
                            onClick={addEmail}
                            disabled={!emailInput.trim()}
                            className="px-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400 transition-all disabled:opacity-20"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    {emailError && <p className="text-[10px] text-red-400 ml-2 font-bold">{emailError}</p>}
                </div>

                {/* Automation Status */}
                {settings.sentinelEnabled && emails.length > 0 && smtpOk && (
                    <div className="flex items-center gap-3 p-4 rounded-3xl bg-green-500/5 border border-green-500/10">
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Automatic Protection Active</p>
                            <p className="text-[9px] text-gray-500 font-medium">
                                Sentinel will automatically send SMTP alerts to {emails.length} recipient(s) when a high-risk trajectory is detected. 4-hour cooldown between alerts, bypassed for critical escalation.
                            </p>
                        </div>
                    </div>
                )}

                {settings.sentinelEnabled && emails.length > 0 && !smtpOk && smtpStatus !== null && (
                    <div className="flex items-center gap-3 p-4 rounded-3xl bg-yellow-500/5 border border-yellow-500/10">
                        <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Protection Degraded</p>
                            <p className="text-[9px] text-gray-500 font-medium">
                                SMTP connectivity check failed. Automatic email alerts may not work. Fix the SMTP configuration in the backend .env file.
                            </p>
                        </div>
                    </div>
                )}

                {/* Cooldown Info */}
                {settings.sentinelEnabled && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <Clock size={14} className="text-gray-600 flex-shrink-0" />
                        <p className="text-[9px] text-gray-600 font-medium">
                            <strong className="text-gray-500">Anti-Spam:</strong> 4-hour cooldown between auto-alerts. Critical escalation bypasses cooldown. Manual test alerts are always allowed.
                        </p>
                    </div>
                )}

                {/* Test Alert Button — always allow attempt even if SMTP status check failed */}
                <div className="pt-2">
                    <button
                        onClick={handleSendTest}
                        disabled={emails.length === 0 || testLoading}
                        className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                            testResult?.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-400' :
                            testResult?.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-400' :
                            'bg-white/5 border-white/10 hover:border-red-500/20 text-gray-400 hover:text-white'
                        } disabled:opacity-20 disabled:cursor-not-allowed`}
                    >
                        {testLoading ? (
                            <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        ) : testResult?.type === 'success' ? (
                            <CheckCircle2 size={14} />
                        ) : testResult?.type === 'error' ? (
                            <AlertTriangle size={14} />
                        ) : (
                            <Send size={14} />
                        )}
                        {testResult ? testResult.message : 
                         emails.length === 0 ? "Add Recipients First" :
                         `Send Test Alert to ${emails.length} Recipient(s)`}
                    </button>
                    
                    {/* Error details */}
                    {testResult?.type === 'error' && (
                        <p className="text-[9px] text-red-400/60 mt-2 ml-2 font-medium break-all">
                            {testResult.message}
                        </p>
                    )}
                    
                    {/* Success details */}
                    {testResult?.type === 'success' && (
                        <p className="text-[9px] text-green-400/60 mt-2 ml-2 font-medium">
                            Check your inbox (and spam folder) for the test alert email.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
