// src/components/shared/SLABadge.tsx
import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLABadgeProps {
  slaDue: string | null;
  status: string;
  escalationLevel?: number;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ slaDue, status, escalationLevel = 0 }) => {
  if (!slaDue || status === 'resolved') return null;

  const dueDate = new Date(slaDue);
  const now = new Date();
  const hoursRemaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const isOverdue = hoursRemaining < 0;

  if (isOverdue) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
        <AlertTriangle className="w-4 h-4" />
        OVERDUE {Math.abs(hoursRemaining)}h
        {escalationLevel > 0 && <span className="ml-1">⚠️ L{escalationLevel}</span>}
      </div>
    );
  }

  if (hoursRemaining <= 4) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-bold animate-pulse">
        <Clock className="w-4 h-4" />
        {hoursRemaining}h left
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
      <Clock className="w-4 h-4" />
      Due in {hoursRemaining}h
    </div>
  );
};