
import React, { useState } from 'react';
import { Settings, Map, Building2, Lock, Save, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';
import { updateAccount, saveSession } from '../services/authService';

interface AccountSettingsProps {
  session: UserSession;
  onClose: () => void;
  onUpdate: (newSession: UserSession) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ session, onClose, onUpdate }) => {
  const [sdo, setSdo] = useState(session.sdo);
  const [schoolName, setSchoolName] = useState(session.schoolName);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await updateAccount({
        username: session.username,
        sdo,
        schoolName,
        passwordPlain: newPassword || undefined
      });
      
      saveSession(updated);
      setSuccess(true);
      setTimeout(() => {
        onUpdate(updated);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Account Settings</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Update your profile parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Division / SDO Name</label>
              <div className="relative group">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="text"
                  value={sdo}
                  onChange={(e) => setSdo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
                  placeholder="e.g. Caloocan"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">School / Office Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
                  placeholder="e.g. Caloocan HS"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Change Password (Optional)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-rose-500 shrink-0" size={16} />
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight leading-tight">Settings updated successfully.</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
