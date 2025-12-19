import React from 'react';
import { Check, Clock, UserCheck, TrendingUp, CheckCircle } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface StatusStepperProps {
  currentStatus: string;
  assignedAt?: string | null;
  acknowledgedAt?: string | null;
  closedAt?: string | null;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  currentStatus,
  assignedAt,
  acknowledgedAt,
  closedAt,
}) => {
  const steps: Step[] = [
    { key: 'pending', label: 'Submitted', icon: <Clock className="w-5 h-5" /> },
    { key: 'assigned', label: 'Assigned', icon: <UserCheck className="w-5 h-5" /> },
    { key: 'in-progress', label: 'In Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'resolved', label: 'Resolved', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const statusOrder = ['pending', 'assigned', 'in-progress', 'resolved'];
  const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());

  const getStepState = (index: number): 'completed' | 'active' | 'upcoming' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'upcoming';
  };

  const getStepStyles = (state: 'completed' | 'active' | 'upcoming') => {
    switch (state) {
      case 'completed':
        return {
          circle: 'bg-green-500 border-green-500 text-white',
          label: 'text-green-700 font-semibold',
          line: 'bg-green-500',
        };
      case 'active':
        return {
          circle: 'bg-blue-500 border-blue-500 text-white animate-pulse',
          label: 'text-blue-700 font-bold',
          line: 'bg-slate-300',
        };
      case 'upcoming':
        return {
          circle: 'bg-white border-slate-300 text-slate-400',
          label: 'text-slate-500',
          line: 'bg-slate-300',
        };
    }
  };

  return (
    <div className="w-full py-8">
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between relative">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const styles = getStepStyles(state);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Step */}
              <div className="flex flex-col items-center relative z-10">
                {/* Circle with Icon */}
                <div
                  className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-lg ${styles.circle}`}
                >
                  {state === 'completed' ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Label */}
                <span className={`mt-3 text-sm text-center transition-all duration-300 ${styles.label}`}>
                  {step.label}
                </span>

                {/* Timestamp (if available) */}
                {state === 'completed' && (
                  <span className="text-xs text-slate-500 mt-1">
                    {index === 0 && 'Submitted'}
                    {index === 1 && assignedAt && new Date(assignedAt).toLocaleDateString()}
                    {index === 2 && acknowledgedAt && new Date(acknowledgedAt).toLocaleDateString()}
                    {index === 3 && closedAt && new Date(closedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-1 mx-2 relative">
                  <div className={`h-full rounded transition-all duration-500 ${styles.line}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile View - Vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const styles = getStepStyles(state);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-4">
              {/* Left: Icon Column */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${styles.circle}`}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    React.cloneElement(step.icon as React.ReactElement, { className: 'w-4 h-4' })
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 mt-2 transition-all duration-500 ${styles.line}`} />
                )}
              </div>

              {/* Right: Label & Info */}
              <div className="flex-1 pt-1">
                <p className={`text-sm font-semibold ${styles.label}`}>{step.label}</p>
                {state === 'completed' && (
                  <p className="text-xs text-slate-500 mt-1">
                    {index === 0 && 'Complaint submitted'}
                    {index === 1 && assignedAt && new Date(assignedAt).toLocaleDateString()}
                    {index === 2 && acknowledgedAt && new Date(acknowledgedAt).toLocaleDateString()}
                    {index === 3 && closedAt && new Date(closedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};