import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Complaint, ComplaintStatus, ComplaintPriority, Note, Reply, Officer } from '../types';

const API_BASE = "http://localhost:8080/api";

interface ComplaintContextType {
  complaints: Complaint[];
  officers: Officer[];
  addComplaint: (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'>) => number;
  updateComplaintStatus: (id: number, status: ComplaintStatus) => void;
  updateComplaintPriority: (id: number, priority: ComplaintPriority) => void;
  assignComplaint: (id: number, officerEmail: string) => Promise<void>;
  addNote: (complaintId: number, note: Omit<Note, 'id' | 'createdAt'>) => void;
  addReply: (complaintId: number, reply: Omit<Reply, 'id' | 'createdAt'>) => void;
  getOfficerWorkload: (officerEmail: string) => { assigned: number; inProgress: number; completed: number; };
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

// keep string IDs generator for notes/replies if those types expect string IDs
const generateId = () => `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
// numeric id generator for Complaint.id (matches your Complaint type which expects number)
const generateComplaintId = () => Date.now();

/**
 * Helper: normalize server complaint payload into your front-end Complaint shape
 */
const normalizeComplaint = (c: any, fallbackId?: number): Complaint => {
  const id = typeof c.id === 'number' ? c.id : (Number(c.id) || fallbackId || generateComplaintId());
  return {
    id,
    title: c.title ?? '',
    description: c.description ?? '',
    category: c.category ?? '',
    // server uses enum strings like "PENDING"/"RESOLVED". Convert to lowercase front-end style if needed.
    status: (typeof c.status === 'string' ? c.status.toLowerCase() : (c.status ?? 'pending')) as ComplaintStatus,
    priority: (typeof c.priority === 'string' ? c.priority.toLowerCase() : (c.priority ?? 'medium')) as ComplaintPriority,
    submittedBy: c.submittedBy ?? '',
    citizenName: c.citizenName ?? '',
    isAnonymous: typeof c.isAnonymous === 'boolean' ? c.isAnonymous : false,
    submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : new Date().toISOString(),
    assignedTo: c.assignedTo ?? null,
    attachments: Array.isArray(c.attachments) ? c.attachments : [],
    notes: Array.isArray(c.notes) ? c.notes : [],
    replies: Array.isArray(c.replies) ? c.replies : [],
  } as Complaint;
};

export const ComplaintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/complaints`, { headers });
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map((c: any) => normalizeComplaint(c)) : [];
      setComplaints(normalized);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/officers`, { headers });
      if (!res.ok) throw new Error("Failed to fetch officers");
      const data = await res.json();

      const normalized: Officer[] = Array.isArray(data)
        ? data.map((o: any) => {
            const idNum = typeof o.id === 'number' ? o.id : (Number(o.id) || generateComplaintId());
            return {
              id: idNum,
              name: o.name ?? 'Unknown Officer',
              email: o.email ?? '',
              department: o.department ?? 'Unknown',
            } as Officer;
          })
        : [];

      setOfficers(normalized);
    } catch (err) {
      console.error("Error fetching officers:", err);
      setOfficers([]);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // addComplaint now returns number (id) and uses submittedAt as ISO string
  const addComplaint = (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'>) => {
    const id = generateComplaintId();
    const newComplaint: Complaint = {
      ...data,
      id,
      status: 'pending',
      priority: 'medium',
      submittedAt: new Date().toISOString(),
      notes: [],
      replies: [],
    } as Complaint;

    setComplaints(prev => [newComplaint, ...prev]);
    return id;
  };

  /**
   * Update complaint status:
   * - Optimistic update locally
   * - Send PATCH /api/complaints/{id}/status with { status: "IN_PROGRESS" }
   * - On success replace local complaint with normalized server response
   * - On failure roll back and notify user
   */
  const updateComplaintStatus = (id: number, status: ComplaintStatus) => {
    // snapshot for rollback
    const prevSnapshot = complaints;
    // optimistic (display immediate)
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));

    // prepare payload: server expects enum-style uppercase value
    const payload = { status: String(status).toUpperCase().replace('-', '_') };

    // include token if placed in localStorage under 'token'
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`API failed: ${res.status} ${txt}`);
        }
        return res.json();
      })
      .then((updatedComplaint) => {
        const normalized = normalizeComplaint(updatedComplaint, id);
        setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
        // ✅ SUCCESS TOAST
        toast.success(`Status updated to ${status.replace('-', ' ').toUpperCase()}`, {
          duration: 3000,
          position: 'top-right',
        });
      })
      .catch((err) => {
        console.error('Failed to update status:', err);
        // rollback
        setComplaints(prevSnapshot);
        // ❌ ERROR TOAST
        toast.error('Failed to update status. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      });
  };

  /**
   * Update priority:
   * - Optimistic update locally
   * - Send PUT /api/complaints/{id}/priority with { priority: "HIGH" }
   * - On success replace local complaint with normalized server response
   * - On failure roll back and notify user
   */
  const updateComplaintPriority = (id: number, priority: ComplaintPriority) => {
    // snapshot for rollback
    const prevSnapshot = complaints;
    // optimistic (display immediate)
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, priority } : c)));

    // prepare payload: server expects enum-style uppercase value
    const payload = { priority: String(priority).toUpperCase() };

    // include token if placed in localStorage under 'token'
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/complaints/${id}/priority`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`API failed: ${res.status} ${txt}`);
        }
        return res.json();
      })
      .then((updatedComplaint) => {
        const normalized = normalizeComplaint(updatedComplaint, id);
        setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
        // ✅ SUCCESS TOAST
        toast.success(`Priority updated to ${priority.toUpperCase()}`, {
          duration: 3000,
          position: 'top-right',
        });
      })
      .catch((err) => {
        console.error('Failed to update priority:', err);
        // rollback
        setComplaints(prevSnapshot);
        // ❌ ERROR TOAST
        toast.error('Failed to update priority. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      });
  };

  const assignComplaint = async (id: number, officerEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/complaints/assign/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ officerEmail }),
      });

      if (!res.ok) throw new Error('Failed to assign complaint');
      const updatedComplaint = await res.json();

      const normalized = normalizeComplaint(updatedComplaint, id);
      setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
      
      // ✅ SUCCESS TOAST
      toast.success('Complaint assigned successfully', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (err) {
      console.error('Error assigning complaint:', err);
      // ❌ ERROR TOAST
      toast.error('Failed to assign complaint', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const addNote = (complaintId: number, note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = { ...note, id: generateId(), createdAt: new Date().toISOString() } as unknown as Note;
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, notes: [...c.notes, newNote] } : c))
    );
  };

  const addReply = (complaintId: number, reply: Omit<Reply, 'id' | 'createdAt'>) => {
    const newReply: Reply = {
      ...reply,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isAdminReply: typeof (reply as any).createdBy === 'string' ? (reply as any).createdBy.includes('admin') : false,
    } as unknown as Reply;

    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, replies: [...c.replies, newReply] } : c))
    );
  };

  const getOfficerWorkload = (officerEmail: string) => {
    const officerComplaints = complaints.filter(c => (c as any).assignedTo === officerEmail);
    return {
      assigned: officerComplaints.filter(c => c.status === 'assigned' || c.status === 'pending').length,
      inProgress: officerComplaints.filter(c => c.status === 'in-progress').length,
      completed: officerComplaints.filter(c => c.status === 'resolved').length,
    };
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        officers,
        addComplaint,
        updateComplaintStatus,
        updateComplaintPriority,
        assignComplaint,
        addNote,
        addReply,
        getOfficerWorkload,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};