import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Loader2, AlertCircle, Mail, Map, Building2, Terminal, Globe } from 'lucide-react';
import { validateLogin, registerUser, saveSession, testApiConnection } from '../services/authService';
import { UserSession } from '../types';

const LOGO_URL = "https://depedcaloocan.com/wp-content/uploads/2025/07/webtap.png";

interface LoginProps {
  onSuccess: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [sdo, setSdo] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<string>('System Idle');
  const [isTesting, setIsTesting] = useState(false);

  const runConnectionTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setStatusLog('Requesting handshake (10s limit)...');
    try {
      const result = await testApiConnection();
      setStatusLog(result);
    } catch (e: any) {
      setStatusLog(`Local Crash: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    setError(null);
    setStatusLog('Negotiating SSL...');

    try {
      let session: UserSession | null = null;
      const onStatus = (s: string) => setStatusLog(s);

      if (mode === 'login') {
        session = await validateLogin(username, password, onStatus);
      } else {
        session = await registerUser({ username, passwordPlain: password, email, sdo, schoolName }, onStatus);
      }

      if (session) {
        setStatusLog('Connection Secure.');
        saveSession(session);
        onSuccess(session);
      }
    } catch (err: any) {
      setError(err.message || "Network Failure.");
      setStatusLog('Fault detected.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-6">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900 rounded-full blur-[180px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl p-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl p-2 border border-white/20">
              <img src={LOGO_URL} alt="FTAD Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              FTAD MONITORING
            </h1>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-1">
              Neon Cloud v5.0
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-600"
                placeholder="Username"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-600"
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                <p className="text-[10px] font-bold text-rose-200 uppercase leading-tight tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : 'AUTHORIZE'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Diagnostic Telemetry Console */}
          <div className="mt-8 bg-black/60 rounded-3xl p-5 border border-white/5 font-mono shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-indigo-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Telemetry</span>
              </div>
              {!isAuthenticating && (
                <button 
                  onClick={runConnectionTest} 
                  disabled={isTesting}
                  className="text-[8px] font-black text-indigo-400 hover:text-white uppercase flex items-center gap-1 transition-colors"
                >
                  <Globe size={10} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'SYNCING' : '[SYNC]'}
                </button>
              )}
            </div>
            <p className="text-[10px] text-indigo-200 font-bold tracking-tight">
              <span className="text-slate-700 mr-2">root@node:~$</span>
              {statusLog}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
                setStatusLog('UI State Modified.');
              }}
              className="text-[9px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors"
            >
              {mode === 'login' ? 'Register New Account' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;