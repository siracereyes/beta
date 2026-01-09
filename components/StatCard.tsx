
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-xl hover:border-indigo-100 group">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        {change && (
          <p className={`text-xs mt-2 font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '↑' : '↓'} {change}
            <span className="text-slate-400 font-normal ml-1">vs last period</span>
          </p>
        )}
      </div>
      <div className="p-3 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl transition-colors">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
