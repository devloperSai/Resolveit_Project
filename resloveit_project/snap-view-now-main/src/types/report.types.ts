// src/types/report.types.ts

export type ReportStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED';

export interface Report {
  id: number;
  complaintId: number;
  officerEmail: string;
  officerName: string;
  actionTaken: string;
  description?: string;
  recommendations?: string;
  attachments: string[];
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  completionTimeHours?: number;
  citizenNotified: boolean;
}

export interface ReportFormData {
  complaintId: number;
  officerEmail: string;
  officerName: string;
  actionTaken: string;
  description?: string;
  recommendations?: string;
  files?: File[];
}

export interface ReportValidation {
  canResolve: boolean;
  message: string;
}