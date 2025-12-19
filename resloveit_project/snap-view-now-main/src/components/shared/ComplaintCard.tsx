import React from "react";
import { Calendar, MapPin, MessageSquare, Paperclip } from "lucide-react";
import { Complaint } from "../../types";

interface ComplaintCardProps {
  complaint: Complaint;
  isSelected?: boolean;
  onSelect?: (complaint: Complaint) => void;
  showStatus?: boolean;
  showPriority?: boolean;
  compact?: boolean;
}

const getStatusStyles = (status?: string) => {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "assigned":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
    case "in-progress":
      return {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        text: "text-cyan-700",
        dot: "bg-cyan-500",
      };
    case "resolved":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        dot: "bg-green-500",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
        dot: "bg-slate-500",
      };
  }
};

const getPriorityStyles = (priority?: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "low":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  isSelected,
  onSelect,
  showStatus = true,
  showPriority = false,
  compact = false,
}) => {
  const safeStatus = complaint?.status || "pending";
  const safePriority = complaint?.priority || "medium";
  const safeCategory = complaint?.category || "General";
  const safeTitle = complaint?.title || "Untitled Complaint";
  const safeDescription = complaint?.description || "No description.";
  const safeDate = complaint?.submittedAt
    ? new Date(complaint.submittedAt)
    : new Date();
  const repliesCount = complaint?.replies?.length || 0;

  const statusStyles = getStatusStyles(safeStatus);

  return (
    <div
      onClick={() => onSelect?.(complaint)}
      className={`card p-5 transition-all duration-200 ${
        onSelect ? "cursor-pointer hover:shadow-xl hover:scale-[1.02]" : ""
      } ${isSelected ? "ring-2 ring-cyan-500 shadow-2xl scale-[1.02]" : ""} ${
        compact ? "p-4" : ""
      } animate-fade-in bg-white`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-cyan-600 tracking-wider">
              #{complaint.id || "XXXX"}
            </span>

            {showStatus && (
              <span
                className={`${statusStyles.bg} ${statusStyles.text} px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyles.border} flex items-center gap-2`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${statusStyles.dot} animate-pulse`}
                ></span>
                {safeStatus.replace("-", " ").replace(/\b\w/g, (l) =>
                  l.toUpperCase()
                )}
              </span>
            )}

            {showPriority && (
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getPriorityStyles(
                  safePriority
                )}`}
              >
                {safePriority.toUpperCase()} PRIORITY
              </span>
            )}
          </div>

          <h3
            className={`font-bold text-slate-900 mb-2 line-clamp-2 ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {safeTitle}
          </h3>

          {!compact && (
            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {safeDescription}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4" />
            {safeDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>

          <span className="hidden md:flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {safeCategory}
          </span>
          
          {complaint?.attachments && complaint.attachments.length > 0 && (
            <span className="flex items-center gap-1.5 text-blue-600 font-medium">
              <Paperclip className="w-4 h-4" />
              {complaint.attachments.length} {complaint.attachments.length === 1 ? "File" : "Files"}
            </span>
          )}
        </div>

        {repliesCount > 0 && (
          <span className="flex items-center gap-1.5 font-bold text-cyan-600">
            <MessageSquare className="w-4 h-4" />
            {repliesCount} {repliesCount === 1 ? "Reply" : "Replies"}
          </span>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;
