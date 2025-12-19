import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'cyan' | 'green' | 'amber' | 'red';
  trend?: { value: number; isPositive: boolean };
}

const colorMap = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', glow: 'glow-blue' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600', glow: 'glow-cyan' },
  green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', glow: 'glow-green' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', glow: 'shadow-lg shadow-amber-500/20' },
  red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', glow: 'shadow-lg shadow-red-500/20' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, trend }) => {
  const colors = colorMap[color];

  return (
    <div className={`card p-6 ${colors.bg} border-2 ${colors.border} ${colors.glow} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-600 text-sm font-medium">{label}</p>
          <p className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center ${colors.icon} text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
