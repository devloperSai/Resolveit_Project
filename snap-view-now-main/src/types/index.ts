// src/types/index.ts

export type UserRole = 'citizen' | 'officer' | 'admin';

export type OfficerAvailability = 'Free' | 'Busy' | 'Overloaded';

export interface Officer {
  id: number;
  name: string;
  email: string;
  department?: string;
  availability?: OfficerAvailability;
}

export type ComplaintStatus = 'pending' | 'assigned' | 'in-progress' | 'resolved';

export type ComplaintPriority = 'low' | 'medium' | 'high';

export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export interface Note {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Reply {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isAdminReply?: boolean;
}

export interface Feedback {
  id: number;
  content: string;
  rating?: number;
  createdAt: string;
  visibleToOfficer: boolean;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
  isAnonymous: boolean;
  submittedBy: string;
  submittedAt: string;
  attachments?: string[];

  // ✅ Fixed: citizenName now exists
  citizenName?: string;

  // Relations
  user?: {
    id: number;
    email: string;
    name: string;
  };

  assignedOfficer?: Officer;

  notes: Note[];
  replies: Reply[];
  feedback?: Feedback;
}

// ✅ Fixed: ComplaintCardProps now includes showPriority
export interface ComplaintCardProps {
  complaint: Complaint;
  isSelected?: boolean;
  onSelect?: (complaint: Complaint) => void;
  showStatus?: boolean;
  showPriority?: boolean;  // ← THIS WAS MISSING
}