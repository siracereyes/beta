
import React, { useState, useMemo } from 'react';
import { TARecord } from '../types';
import { 
  Search, ChevronRight, Activity, Target, AlertCircle, 
  Calendar, Info, MapPin, CheckCircle2,
  Map, Building2, Clock, Briefcase, CloudUpload, Loader2
} from 'lucide-react';
import { updateTAPStatus } from '../services/dataService';
import { getSession } from '../services/authService';

interface DataTableProps {
  records: TARecord[];
}

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-slate-100 text-slate-400';
  const s = status.toLowerCase();
  if (s.includes('accomplished') || s.includes('met') || s.includes('complete') || s.includes('done') || s.includes('yes')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('unaccomplished') || s.includes('not met') || s.includes('issue') || s.includes('no')) return 'bg-rose-100 text-rose-700';
  if (s.includes('partial')) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-400';
};

const DataTable: React.FC<DataTableProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'targets' | 'matatag' | 'misc'>('targets');
  
  const [syncing, setSyncing] = useState<string | null>(null);
  const session = getSession();

  const filterOptions = useMemo(() => {
    const periods = Array.from(new Set(records.map(r => r.period))).filter(Boolean).sort();
    const districts = Array.from(new Set(records.map(r => r.district))).filter(Boolean).sort();
    const offices = Array.from(new Set(records.map(r => r.office))).filter(Boolean).sort();
    return { periods, districts, offices };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = [r.office, r.district, r.divisionSchool, r.taReceiver, r.taProvider]
        .some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPeriod = selectedPeriod === 'all' || r.period === selectedPeriod;
      const matchesDistrict = selectedDistrict === 'all' || r.district === selectedDistrict;
      const matchesOffice = selectedOffice === 'all' || r.office === selectedOffice;

      return matchesSearch && matchesPeriod && matchesDistrict && matchesOffice;
    });
  }, [records, searchTerm, selectedPeriod, selectedDistrict, selectedOffice]);

  const handleStatusUpdate = async (record: TARecord, targetIdx: number, newStatus: string) => {
    const syncId = `${record.id}-${targetIdx}`;
    setSyncing(syncId);
    try {
      await updateTAPStatus({
        office: record.office,
        division: record.divisionSchool,
        period: record.period,
        targetIndex: targetIdx,
        status: newStatus,
        username: session?.username || 'anonymous'
      });
      // Locally update to reflect change immediately
      record.targets[targetIdx].tapStatus = newStatus;
    } catch (err: any) {
      console.error(err);
      alert("Cloud Sync Failed: " + (err.message || "Unknown error"));
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
      <div className="px-10 py-8 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              Monitoring Console
              <span className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-full tracking-tighter font-black">
                {filteredRecords.length} MATCHES
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-[0.15em] italic">Technical Assistance Oversight v5.1</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative group min-w-[180px]">
              <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${selectedOffice !== 'all' ? 'text-indigo-600' : 'text-slate-400'}`} size={16} />
              <select 
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className={`w-full pl-11 pr-8 py-3 bg-slate-50 border rounded-2xl text-[11px] font-black uppercase tracking-wider appearance-none focus:outline-none transition-all cursor-pointer ${selectedOffice !== 'all' ? 'border-indigo-200 text-indigo-700 bg-indigo-50/30' : 'border-slate-100 text-slate-500'}`}
              >
                <option value="all">All Offices</option>
                {filterOptions.offices.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="relative group min-w-[180px]">
              <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${selectedPeriod !== 'all' ? 'text-indigo-600' : 'text-slate-400'}`} size={16} />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`w-full pl-11 pr-8 py-3 bg-slate-50 border rounded-2xl text-[11px] font-black uppercase tracking-wider appearance-none focus:outline-none transition-all cursor-pointer ${selectedPeriod !== 'all' ? 'border-indigo-200 text-indigo-700 bg-indigo-50/30' : 'border-slate-100 text-slate-500'}`}
              >
                <option value="all">All Periods</option>
                {filterOptions.periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="relative group min-w-[220px]">
              <Map className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${selectedDistrict !== 'all' ? 'text-indigo-600' : 'text-slate-400'}`} size={16} />
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={`w-full pl-11 pr-8 py-3 bg-slate-50 border rounded-2xl text-[11px] font-black uppercase tracking-wider appearance-none focus:outline-none transition-all cursor-pointer ${selectedDistrict !== 'all' ? 'border-indigo-200 text-indigo-700 bg-indigo-50/30' : 'border-slate-100 text-slate-500'}`}
              >
                <option value="all">All Districts/Clusters</option>
                {filterOptions.districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-grow lg:flex-grow-0 lg:w-[250px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-14 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto custom-scrollbar bg-slate-50/20">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] sticky top-0 z-10 border-b border-slate-100 shadow-sm">
            <tr>
              <th className="px-10 py-6">Reporting Office</th>
              <th className="px-10 py-6">Recipient Entity</th>
              <th className="px-10 py-6">Period</th>
              <th className="px-10 py-6">Active Targets</th>
              <th className="px-10 py-6 text-center">Status</th>
              <th className="px-10 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {filteredRecords.map((record) => (
              <React.Fragment key={record.id}>
                <tr 
                  onClick={() => setSelectedRow(selectedRow === record.id ? null : record.id)}
                  className={`group cursor-pointer transition-all ${selectedRow === record.id ? 'bg-indigo-50/50' : 'hover:bg-white'}`}
                >
                  <td className="px-10 py-7">
                    <span className="text-[13px] font-black text-indigo-900 block mb-1">{record.office}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{record.district || 'Regional Unit'}</span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                        <MapPin size={14} />
                      </div>
                      <span className="text-[12px] font-black text-slate-700 truncate max-w-[250px]">
                        {record.divisionSchool}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} className="text-indigo-400" />
                      <span className="text-[11px] font-black uppercase tracking-tight">{record.period}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-indigo-500" />
                      <span className="text-[11px] font-black text-slate-900">{record.targets.length} Objectives</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <div className="flex justify-center gap-1.5">
                      {[1,2,3,4,5].map((num) => {
                        const hasTarget = record.targets[num-1];
                        return (
                          <div key={num} className={`w-2.5 h-2.5 rounded-full ${hasTarget ? 'bg-indigo-600' : 'bg-slate-200'}`} title={`Objective ${num} ${hasTarget ? 'Configured' : 'Empty'}`}></div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${selectedRow === record.id ? 'bg-indigo-600 text-white rotate-90 shadow-xl' : 'text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50'}`}>
                      <ChevronRight size={22} />
                    </div>
                  </td>
                </tr>

                {selectedRow === record.id && (
                  <tr>
                    <td colSpan={6} className="p-0 border-y border-slate-200">
                      <div className="bg-white p-10">
                        <div className="flex gap-4 mb-10 bg-slate-100 p-1.5 rounded-[1.8rem] w-fit border border-slate-200">
                          {[
                            { id: 'targets', label: 'Technical Objectives', icon: Target },
                            { id: 'matatag', label: 'Operational (MATATAG)', icon: Activity },
                            { id: 'misc', label: 'System Info', icon: Info },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              <tab.icon size={14} />
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
                          {activeTab === 'targets' && (
                            <div className="space-y-8">
                              <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-6 flex justify-between items-center">
                                <div>
                                  <h4 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                    <Target className="text-indigo-400" />
                                    Support Objectives Registry
                                  </h4>
                                  <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-wider italic">Updates to 'TAP Status Completion' will synchronize with the Cloud DB.</p>
                                </div>
                                <div className="hidden lg:flex items-center gap-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Accomplished</div>
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Partial</div>
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Unaccomplished</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-12">
                                {record.targets.length > 0 ? (
                                  record.targets.map((target, idx) => {
                                    const syncId = `${record.id}-${idx}`;
                                    const isSyncing = syncing === syncId;

                                    return (
                                      <div key={idx} className="relative overflow-hidden rounded-[2.5rem] border bg-white border-slate-200 shadow-2xl shadow-slate-900/5">
                                        <div className="flex flex-col lg:flex-row">
                                          <div className="w-full lg:w-20 shrink-0 flex items-center justify-center text-3xl font-black bg-indigo-600 text-white shadow-xl">
                                            {idx + 1}
                                          </div>
                                          
                                          <div className="p-10 flex-grow">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                                              
                                              <div className="lg:col-span-2 space-y-6">
                                                <div>
                                                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
                                                    <Target size={12}/> Objective
                                                  </label>
                                                  <p className="text-[15px] font-black text-slate-900 leading-tight">{target.objective}</p>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Planned Action</label>
                                                  <p className="text-[12px] text-slate-600 font-medium italic border-l-2 border-slate-100 pl-4">{target.plannedAction || '---'}</p>
                                                </div>
                                              </div>

                                              <div className="space-y-6">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Due Date</label>
                                                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
                                                      <Calendar size={12} className="text-indigo-500" />
                                                      {target.dueDate || 'N/A'}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Sheet Status</label>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(target.status)}`}>
                                                      {target.status || 'Pending'}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">TA Needed / Help Needed</label>
                                                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-50">{target.helpNeeded || 'None requested.'}</p>
                                                </div>
                                              </div>

                                              <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                                <div>
                                                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                                    <CheckCircle2 size={12}/> Agreements
                                                  </label>
                                                  <p className="text-[13px] font-black text-slate-900 leading-tight">{target.agree || '---'}</p>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Specific Office</label>
                                                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                                                    <Briefcase size={12} className="text-slate-400" />
                                                    {target.specificOffice || '---'}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-6 bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/50">
                                                <div>
                                                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2 flex justify-between items-center">
                                                    Finalization
                                                    {isSyncing && <Loader2 size={10} className="animate-spin text-indigo-500" />}
                                                  </label>
                                                  <div className="space-y-4">
                                                    <div>
                                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">TAP Due Date</label>
                                                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                                        <Clock size={11} className="text-indigo-400" />
                                                        {target.tapDueDate || '---'}
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">TAP Status Completion</label>
                                                      <div className="relative">
                                                        <select 
                                                          value={target.tapStatus || ''}
                                                          onChange={(e) => handleStatusUpdate(record, idx, e.target.value)}
                                                          disabled={isSyncing}
                                                          className={`w-full appearance-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/20 outline-none ${getStatusColor(target.tapStatus)}`}
                                                        >
                                                          <option value="">Pending Choice</option>
                                                          <option value="Accomplished">Accomplished</option>
                                                          <option value="Partial">Partial</option>
                                                          <option value="Unaccomplished">Unaccomplished</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-indigo-400">
                                                          {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="bg-white p-20 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <Target className="text-slate-200 mb-6" size={64} />
                                    <h5 className="text-xl font-black text-slate-900">No Objectives Recorded</h5>
                                    <p className="text-slate-400 font-medium">This registry entry has no active technical objectives defined.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === 'matatag' && (
                             <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                              {[
                                { name: 'Access', data: record.access },
                                { name: 'Equity', data: record.equity },
                                { name: 'Quality', data: record.quality },
                                { name: 'Resilience', data: record.resilience },
                                { name: 'Enabling', data: record.enabling }
                              ].map((cat) => (
                                <div key={cat.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6">{cat.name}</h5>
                                  <div className="space-y-4">
                                    {cat.data.map((item, idx) => (
                                      <div key={idx} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full mb-2 inline-block ${getStatusColor(item.status)}`}>
                                          {item.status}
                                        </span>
                                        <p className="text-[11px] text-slate-600 leading-snug">{item.issue || '---'}</p>
                                      </div>
                                    ))}
                                    {cat.data.length === 0 && <p className="text-[9px] text-slate-300 italic">No entry</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {activeTab === 'misc' && (
                            <div className="bg-slate-900 p-10 rounded-[3rem] text-white grid grid-cols-2 md:grid-cols-4 gap-8">
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Team Sync (Dept)</p>
                                  <p className="text-sm font-bold">{record.misc.deptTeamDate || '---'}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Team Sync (TA)</p>
                                  <p className="text-sm font-bold">{record.misc.taTeamDate || '---'}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Rep #4</p>
                                  <p className="text-xs font-bold">{record.misc.taName4 || '---'}</p>
                                  <p className="text-[9px] text-slate-400 italic">{record.misc.taPosition4}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Rep #5</p>
                                  <p className="text-xs font-bold">{record.misc.taName5 || '---'}</p>
                                  <p className="text-[9px] text-slate-400 italic">{record.misc.taPosition5}</p>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
