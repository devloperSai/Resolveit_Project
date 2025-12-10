// src/types.ts
export type UserRole = "citizen" | "officer" | "admin";

export type ComplaintStatus = "pending" | "assigned" | "in-progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high";

export interface User {
  id?: number | null;
  email: string;
  name: string;
  role: UserRole; // This now only accepts normalized roles
}

export interface Officer {
  id: number;
  name: string;
  email: string;
  department: string;
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Reply {
  id: string;
  content: string;
  createdAt: string;
  isAdminReply: boolean;
}

// ✅ UPDATED: Complete Complaint interface with all new fields
export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  
  // Assignment
  assignedTo: string | null;
  assignedAt: string | null;
  
  // SLA Tracking (NEW)
  acknowledgedAt: string | null;
  firstResponseAt: string | null;
  slaStart: string | null;
  slaDue: string | null;
  responseSladue: string | null;
  escalationLevel: number;
  escalationHistory: string | null; // JSON string
  
  // Audit (NEW)
  createdBy: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  version: number;
  
  // Workflow (NEW)
  workflowState: string | null;
  resolutionNotes: string | null;
  closedAt: string | null;
  closedBy: string | null;
  
  // Feedback (NEW)
  rating: number | null;
  feedback: string | null;
  ratedAt: string | null;
  
  // Submission Info
  submittedBy: string;
  submittedAt: string;
  isAnonymous: boolean;
  citizenName?: string;
  
  // Related Data
  attachments: string[];
  notes: Note[];
  replies: Reply[];
  
  // Virtual/Computed (from backend)
  isOverdue?: boolean;
  hoursUntilBreach?: number;
  resolutionTimeHours?: number;
}

// ✅ NEW: SLA Metrics
export interface SLAMetrics {
  totalComplaints: number;
  overdueComplaints: number;
  resolvedOnTime: number;
  resolvedLate: number;
  slaComplianceRate: number;
  avgResolutionHours?: number;
  highPriorityOverdue?: number;
  mediumPriorityOverdue?: number;
  lowPriorityOverdue?: number;
}

// ✅ NEW: Dashboard Stats
export interface DashboardStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  highPriority: number;
  avgResolutionHours: number;
  slaCompliance: number;
}

// ✅ NEW: Officer Workload
export interface OfficerWorkload {
  officer: string;
  total: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  overdue: number;
}

// ✅ NEW: Trend Data
export interface TrendData {
  date: string;
  submitted: number;
  resolved: number;
  high_priority: number;
}

// ✅ NEW: Category Distribution
export interface CategoryDistribution {
  category: string;
  count: number;
}