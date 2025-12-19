// src/api/complaintApi.ts
import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';

const API_BASE = "http://localhost:8080/api";

export const complaintApi = {
  // Submit complaint
  submitComplaint: async (data: any, email: string, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/submit?email=${email}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit complaint");
    return res.json();
  },

  // Get user complaints
  getUserComplaints: async (email: string, token: string): Promise<Complaint[]> => {
    const res = await fetch(`${API_BASE}/complaints/user?email=${email}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch complaints");
    return res.json();
  },

  // Get all complaints (Admin/Officer)
  getAllComplaints: async (token: string): Promise<Complaint[]> => {
    const res = await fetch(`${API_BASE}/complaints`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch complaints");
    return res.json();
  },

  // Get single complaint
  getComplaintById: async (id: number, token: string): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Complaint not found");
    return res.json();
  },

  // Update priority
  updatePriority: async (id: number, priority: ComplaintPriority, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ priority: priority.toUpperCase() }),
    });
    if (!res.ok) throw new Error("Failed to update priority");
    return res.json();
  },

  // Update status
  updateStatus: async (id: number, status: ComplaintStatus, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ status: status.toUpperCase().replace('-', '_') }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  },

  // Assign complaint
  assignComplaint: async (id: number, officerEmail: string, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        complaintId: id,
        officerEmail,
        assignedBy: "admin" // This should come from context
      }),
    });
    if (!res.ok) throw new Error("Failed to assign complaint");
    return res.json();
  },

  // Close complaint
  closeComplaint: async (id: number, resolutionNotes: string, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        resolutionNotes,
        closedBy: "officer" // Should come from context
      }),
    });
    if (!res.ok) throw new Error("Failed to close complaint");
    return res.json();
  },

  // Add feedback
  addFeedback: async (id: number, rating: number, feedback: string, token: string) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, feedback }),
    });
    if (!res.ok) throw new Error("Failed to add feedback");
    return res.json();
  },

  // Get overdue complaints
  getOverdueComplaints: async (token: string): Promise<Complaint[]> => {
    const res = await fetch(`${API_BASE}/complaints/overdue`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch overdue complaints");
    return res.json();
  },

  // Get complaints needing escalation
  getEscalationNeeded: async (token: string): Promise<Complaint[]> => {
    const res = await fetch(`${API_BASE}/complaints/escalation-needed`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch escalation data");
    return res.json();
  },
};