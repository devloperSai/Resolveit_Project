// src/components/shared/ComplaintTimeline.tsx
import React from 'react';
import { CheckCircle, Clock, UserCheck, AlertTriangle, MessageSquare } from 'lucide-react';
import { Complaint } from '../../types';

interface ComplaintTimelineProps {
  complaint: Complaint;
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ complaint }) => {
  const events = [];

  // Submitted
  events.push({
    icon: <Clock className="w-5 h-5" />,
    label: 'Submitted',
    time: complaint.submittedAt,
    color: 'bg-blue-500',
  });

  // Assigned
  if (complaint.assignedAt) {
    events.push({
      icon: <UserCheck className="w-5 h-5" />,
      label: `Assigned to ${complaint.assignedTo}`,
      time: complaint.assignedAt,
      color: 'bg-cyan-500',
    });
  }

  // Acknowledged
  if (complaint.acknowledgedAt) {
    events.push({
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Acknowledged',
      time: complaint.acknowledgedAt,
      color: 'bg-purple-500',
    });
  }

  // First Response
  if (complaint.firstResponseAt) {
    events.push({
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'First Response',
      time: complaint.firstResponseAt,
      color: 'bg-indigo-500',
    });
  }

  // Escalations
  if (complaint.escalationLevel > 0 && complaint.escalationHistory) {
    try {
      const history = JSON.parse(complaint.escalationHistory);
      history.forEach((esc: any, idx: number) => {
        events.push({
          icon: <AlertTriangle className="w-5 h-5" />,
          label: `Escalated to Level ${esc.escalation_level || idx + 1}`,
          time: esc.escalated_at,
          color: 'bg-red-500',
        });
      });
    } catch (e) {
      console.error('Failed to parse escalation history');
    }
  }

  // Closed
  if (complaint.closedAt) {
    events.push({
      icon: <CheckCircle className="w-5 h-5" />,
      label: `Resolved by ${complaint.closedBy}`,
      time: complaint.closedAt,
      color: 'bg-green-500',
    });
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-slate-900 mb-4">Timeline</h4>
      <div className="relative">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-4 pb-8 relative">
            {idx < events.length - 1 && (
              <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-slate-200" />
            )}
            <div className={`${event.color} rounded-full p-2 text-white flex-shrink-0 relative z-10`}>
              {event.icon}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{event.label}</p>
              <p className="text-sm text-slate-500">
                {new Date(event.time).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};