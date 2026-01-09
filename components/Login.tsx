
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { validateLogin, saveSession } from '../services/authService';
import { UserSession } from '../types';

const LOGO_URL = "https://depedcaloocan.com/wp-content/uploads/2025/07/webtap.png";

interface LoginProps {
  onSuccess: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);

    try {
      const session = await validateLogin(username, password);

      if (session) {
        saveSession(session);
        onSuccess(session);
      } else {
        setError("Invalid credentials. Please verify your SDO access keys.");
      }
    } catch (err) {
      setError("Synchronisation Error: Unable to reach the authentication service.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl p-12">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-white/10 p-2 overflow-hidden border border-white/20">
              <img src={LOGO_URL} alt="FTAD Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">FTAD GATEWAY</h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Cloud Database Auth v3.0</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Identifier</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  placeholder="e.g. sdo_admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-rose-200 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-5 font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 group"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  QUERYING DB...
                </>
              ) : (
                <>
                  SECURE ACCESS
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Vercel Postgres Protected.<br/>Regional Technical Assistance Database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
