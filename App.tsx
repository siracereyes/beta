
// App.tsx: Integrated session management and Login gateway

import React, { useState, useEffect, useMemo } from 'react';
import { fetchFTADData } from './services/dataService';
import { TARecord, FTADStats, UserSession } from './types';
import StatCard from './components/StatCard';
import DataTable from './components/DataTable';
import Login from './components/Login';
import { getSession, clearSession } from './services/authService';
import { 
  RefreshCw, Database, 
  Target, Info, CheckCircle2, AlertCircle, XCircle, Timer, LogOut, User as UserIcon
} from 'lucide-react';

const LOGO_URL = "https://depedcaloocan.com/wp-content/uploads/2025/07/webtap.png";

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(getSession());
  const [data, setData] = useState<TARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await fetchFTADData();
      setData(records);
    } catch (err) {
      console.error(err);
      setError("Failed to sync with FTAD database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (session) {
      loadData();
    }
  }, [session]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const stats: FTADStats = useMemo(() => {
    const defaultStats: FTADStats = { 
      totalInterventions: 0, 
      resolutionRate: 0, 
      totalTARequests: 0, 
      accomplishedTAPs: 0,
      partialTAPs: 0,
      unaccomplishedTAPs: 0,
      pendingTAPs: 0
    };

    if (data.length === 0) return defaultStats;
    
    const allTargets = data.flatMap(d => d.targets);
    const totalTARequests = allTargets.filter(t => t.objective).length;
    
    let accomplished = 0;
    let partial = 0;
    let unaccomplished = 0;
    let pending = 0;

    allTargets.forEach(t => {
      if (!t.objective) return;
      const s = t.tapStatus?.toLowerCase() || "";
      if (s.includes('accomplished') || s.includes('met') || s.includes('complete') || s.includes('done') || s.includes('yes')) {
        accomplished++;
      } else if (s.includes('partial')) {
        partial++;
      } else if (s.includes('unaccomplished') || s.includes('not met') || s.includes('no')) {
        unaccomplished++;
      } else {
        pending++;
      }
    });

    const resolutionRate = totalTARequests > 0 ? (accomplished / totalTARequests) * 100 : 0;
    
    return {
      totalInterventions: data.length,
      resolutionRate,
      totalTARequests,
      accomplishedTAPs: accomplished,
      partialTAPs: partial,
      unaccomplishedTAPs: unaccomplished,
      pendingTAPs: pending
    };
  }, [data]);

  // If no active session, render the Login component
  if (!session) {
    return <Login onSuccess={setSession} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-20">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-10 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-2xl shadow-xl shadow-indigo-600/10 border border-slate-100 overflow-hidden">
              <img src={LOGO_URL} alt="FTAD Logo" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">FTAD Dashboard</h1>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 block">
                Regional Technical Assistance Monitoring
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator Session</span>
              <div className="flex items-center gap-2">
                <UserIcon size={12} className="text-indigo-600" />
                <span className="text-xs font-black text-slate-700 uppercase">{session.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadData} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Refresh Data">
                <RefreshCw size={20} className={loading ? 'animate-spin text-indigo-600' : ''} />
              </button>
              <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" title="End Session">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-10 mt-12">
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold uppercase text-xs">
            <Info size={18} />
            {error}
          </div>
        )}

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{session.sdo || 'NCR REGION'}</span>
              <span className="text-slate-200">/</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">TAP OVERSIGHT</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">TA Plan Progress</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Monitoring completion and finalization status of Technical Assistance Plans (TAP) for {session.schoolName || 'the regional unit'}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          <StatCard 
            title="TA Request" 
            value={stats.totalTARequests.toString()}
            icon={<Target size={24} />}
          />
          <StatCard 
            title="Accomplished" 
            value={stats.accomplishedTAPs.toString()}
            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          />
          <StatCard 
            title="Partial" 
            value={stats.partialTAPs.toString()}
            icon={<AlertCircle size={24} className="text-amber-600" />}
          />
          <StatCard 
            title="Unaccomplished" 
            value={stats.unaccomplishedTAPs.toString()}
            icon={<XCircle size={24} className="text-rose-600" />}
          />
          <StatCard 
            title="Pending" 
            value={stats.pendingTAPs.toString()}
            icon={<Timer size={24} className="text-slate-600" />}
          />
        </div>

        <div className="mb-20">
          {data.length > 0 ? (
            <DataTable records={data} />
          ) : (
            <div className="bg-white p-32 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8">
                <Database size={48} />
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Syncing Data...</h4>
                  <p className="text-slate-400 font-medium">Connecting to regional technical assistance records.</p>
                </div>
              ) : (
                <>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Record Void</h4>
                  <p className="text-slate-400 font-medium max-w-sm">No operational records found in the current synchronization cycle for the selected unit.</p>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        body { background-color: #FDFDFF; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default App;
