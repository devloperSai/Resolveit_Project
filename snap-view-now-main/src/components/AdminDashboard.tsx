import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Shield, Search, MessageSquare, CheckCircle2,
  AlertTriangle, TrendingUp, Clock, FileText, User, UserCheck,
  Users, Calendar, StickyNote, X, Loader2, AlertCircle, Bell, AlertOctagon, Download
} from "lucide-react";
import { Header } from "./shared/Header";
import { Footer } from "./shared/Footer";
import { StatCard } from "./shared/StatCard";
import { ComplaintCard } from "./shared/ComplaintCard";
import { Complaint, ComplaintStatus, ComplaintPriority } from "../types";
import type { Officer } from "../types";
import AdminAnalytics from "./shared/AdminAnalytics";
import { useComplaints } from "../context/ComplaintContext";
import { useReportService } from "../hooks/useReportService";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:8080/api";

export const AdminDashboard: React.FC = () => {
  const { getAuthHeaders } = useAuth();
  const { getOfficerWorkload } = useComplaints();
  const { checkReportExists } = useReportService();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // Notification states
  const [notificationCounts, setNotificationCounts] = useState({
    newComplaints: 0,
    pendingReports: 0,
    highAlerts: 0,
  });

  // Modal states
  const [showOfficerRequestModal, setShowOfficerRequestModal] = useState(false);
  const [showNewComplaintsModal, setShowNewComplaintsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHighAlertsModal, setShowHighAlertsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReportViewModal, setShowReportViewModal] = useState(false);
  // ADDED: State for triage alerts modal
  const [showTriageAlertsModal, setShowTriageAlertsModal] = useState(false);

  // Data states
  const [pendingOfficerRequests, setPendingOfficerRequests] = useState<any[]>([]);
  const [newComplaints, setNewComplaints] = useState<Complaint[]>([]);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [highAlerts, setHighAlerts] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportStatus, setReportStatus] = useState<Record<number, boolean>>({});

  // Form states
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedOfficerEmail, setSelectedOfficerEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [noteContent, setNoteContent] = useState("");
  // ADDED: State for selected priority in assignment
  const [selectedPriority, setSelectedPriority] = useState("MEDIUM");

  // ADDED: State for triage alerts
  const [triageAlerts, setTriageAlerts] = useState({
    critical: [],
    overdue: [],
    counts: { critical: 0, overdue: 0 }
  });

  const [daySummary, setDaySummary] = useState({
  newComplaintsToday: 0,
  reportsSubmittedToday: 0,
  resolvedToday: 0,
  inProgress: 0,
  escalationsToday: 0,
  avgResolutionTimeHours: 0,
  highPriorityPending: 0,
  activeOfficers: 0,
  slaComplianceToday: 100,
});



  // Fetch notification counts on mount and every 30 seconds
  useEffect(() => {
    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch complaints and officers
  useEffect(() => {
    fetchComplaints();
    fetchOfficers();
  }, []);
  // Fetch day summary on mount and every minute
useEffect(() => {
  fetchDaySummary();
  const interval = setInterval(fetchDaySummary, 60000); // Update every minute
  return () => clearInterval(interval);
}, []);

  // ADDED: Fetch triage alerts
  useEffect(() => {
    fetchTriageAlerts();
    const interval = setInterval(fetchTriageAlerts, 60000); // Every minute
    return () => clearInterval(interval);
  }, [getAuthHeaders]);

  // Check report status for complaints
  useEffect(() => {
    const checkReports = async () => {
      const statusMap: Record<number, boolean> = {};
      for (const complaint of complaints) {
        const hasReport = await checkReportExists(complaint.id);
        statusMap[complaint.id] = hasReport;
      }
      setReportStatus(statusMap);
    };

    if (complaints.length > 0) {
      checkReports();
    }
  }, [complaints]);

  const fetchNotificationCounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/counts`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationCounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch notification counts:", err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/complaints`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComplaints(
        data.map((c: any) => ({
          ...c,
          id: Number(c.id),
          priority: typeof c.priority === "string" ? c.priority.toLowerCase() : "medium",
          submittedAt: c.submittedAt || new Date().toISOString(),
          notes: c.notes || [],
          replies: c.replies || [],
          attachments: c.attachments || [],
        }))
      );
    } catch (err) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${API_BASE}/officers`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOfficers(
        data.map((o: any) => ({
          id: Number(o.id),
          email: o.email,
          name: o.name,
          department: o.department ?? "No Department",
        }))
      );
    } catch (err) {
      console.error("Failed to load officers");
    }
  };

  const fetchNewComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/new`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNewComplaints(data);
        setShowNewComplaintsModal(true);
      }
    } catch (err) {
      toast.error("Failed to load new complaints");
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/all`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
        setShowReportsModal(true);
      }
    } catch (err) {
      toast.error("Failed to load reports");
    }
  };

  const fetchHighAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/high-alerts`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setHighAlerts(data);
        setShowHighAlertsModal(true);
      }
    } catch (err) {
      toast.error("Failed to load high alerts");
    }
  };

  const fetchPendingOfficerRequests = async () => {
    setLoadingOfficers(true);
    try {
      const res = await fetch(`${API_BASE}/officers/pending`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPendingOfficerRequests(data);
    } catch (err) {
      toast.error("Failed to load officer requests");
    } finally {
      setLoadingOfficers(false);
    }
  };

  // ADDED: Fetch triage alerts function
  const fetchTriageAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/triage`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTriageAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch triage alerts:", err);
    }
  };

  const fetchDaySummary = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/day-summary`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      setDaySummary(data);
    }
  } catch (err) {
    console.error("Failed to fetch day summary:", err);
  }
};

  const handleApproveOfficer = async (id: number) => {
    if (!confirm("Approve officer?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/approve/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setPendingOfficerRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success("Officer approved!");
      fetchOfficers();
    } catch {
      toast.error("Failed to approve officer");
    }
  };

  const handleRejectOfficer = async (id: number) => {
    if (!confirm("Reject officer?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reject/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setPendingOfficerRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success("Officer rejected");
    } catch {
      toast.error("Failed to reject officer");
    }
  };

  // UPDATED: Assign officer function with priority support
  const assignOfficer = async () => {
    if (!selectedComplaint || !selectedOfficerEmail || !selectedPriority) return;
    setAssigning(true);
   
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${selectedComplaint.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          officerEmail: selectedOfficerEmail,
          priority: selectedPriority // ✅ NOW includes priority
        }),
      });
     
      if (!res.ok) throw new Error();
     
      const updated = await res.json();
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setShowAssignModal(false);
      toast.success("✅ Officer assigned and SLA clock reset!");
    } catch {
      toast.error("Failed to assign.");
    } finally {
      setAssigning(false);
    }
  };

  const updateStatus = async (id: number, status: ComplaintStatus) => {
    try {
      await fetch(`${API_BASE}/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      if (selectedComplaint?.id === id)
        setSelectedComplaint((prev) => (prev ? { ...prev, status } : null));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updatePriority = async (id: number, priority: ComplaintPriority) => {
    try {
      const payload = { priority: priority.toUpperCase() };
      const res = await fetch(`${API_BASE}/complaints/${id}/priority`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update priority");
      const updatedComplaint = await res.json();

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updatedComplaint, priority: updatedComplaint.priority.toLowerCase() }
            : c
        )
      );

      if (selectedComplaint?.id === id) {
        setSelectedComplaint((prev) =>
          prev
            ? { ...prev, ...updatedComplaint, priority: updatedComplaint.priority.toLowerCase() }
            : null
        );
      }
      toast.success("Priority updated");
    } catch (err) {
      toast.error("Failed to update priority");
    }
  };

  const sendReply = async () => {
    if (!selectedComplaint || !replyContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ content: replyContent, isAdminReply: true }),
      });
      if (!res.ok) throw new Error();
      const newReply = await res.json();
      const updated = {
        ...selectedComplaint,
        replies: [...(selectedComplaint.replies || []), newReply],
      };
      setComplaints((prev) => prev.map((c) => (c.id === selectedComplaint.id ? updated : c)));
      setSelectedComplaint(updated);
      setReplyContent("");
      setShowReplyModal(false);
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const addNote = async () => {
    if (!selectedComplaint || !noteContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ content: noteContent, isPrivate: true }),
      });
      if (!res.ok) throw new Error();
      const newNote = await res.json();
      const updated = {
        ...selectedComplaint,
        notes: [...(selectedComplaint.notes || []), newNote],
      };
      setComplaints((prev) => prev.map((c) => (c.id === selectedComplaint.id ? updated : c)));
      setSelectedComplaint(updated);
      setNoteContent("");
      setShowNoteModal(false);
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    }
  };

  const viewReport = (reportData: any) => {
    setSelectedReport(reportData);
    setShowReportViewModal(true);
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => ["assigned", "in-progress"].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    highPriority: complaints.filter((c) => c.priority === "high").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      <Header
        title="Admin Panel"
        subtitle="System Control Center"
        icon={<Shield className="w-7 h-7 text-white" />}
      />

      <main className="flex-1 container-custom py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <StatCard label="Total" value={stats.total} icon={<FileText />} color="blue" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="green" />
          <StatCard
            label="High Priority"
            value={stats.highPriority}
            icon={<AlertTriangle />}
            color="red"
          />
        </div>

        {/* Analytics */}
        <div className="card p-6 mb-8 shadow-lg">
          <AdminAnalytics
            complaints={complaints}
            officers={officers}
            getOfficerWorkload={getOfficerWorkload}
          />
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints..."
                className="input-field pl-12"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full lg:w-64"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              onClick={() => {
                fetchPendingOfficerRequests();
                setShowOfficerRequestModal(true);
              }}
              className="btn-primary whitespace-nowrap"
            >
              <Users className="w-5 h-5" /> Officer Requests
            </button>
     {/* Complaint Detail Modal */}
{selectedComplaint && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-in-up">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs uppercase text-slate-600 font-bold">Complaint ID</p>
            <p className="text-2xl font-mono font-bold text-cyan-600">#{selectedComplaint.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            selectedComplaint.priority === 'high' ? 'bg-red-100 text-red-700' :
            selectedComplaint.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {selectedComplaint.priority.toUpperCase()}
          </span>
        </div>
        <button onClick={() => setSelectedComplaint(null)} className="text-slate-500 hover:text-slate-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 mb-2">Title</p>
          <p className="text-lg font-semibold text-slate-900">{selectedComplaint.title}</p>
        </div>

        {/* Citizen */}
        <div className="py-4 border-y">
          <p className="text-xs uppercase font-bold text-slate-600 mb-3">Citizen</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{selectedComplaint.isAnonymous ? 'Anonymous' : selectedComplaint.citizenName || 'Citizen'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(selectedComplaint.submittedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 mb-2">Description</p>
          <p className="text-sm bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">{selectedComplaint.description}</p>
        </div>

        {/* Report Badge */}
        {reportStatus[selectedComplaint.id] && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-800">Report Submitted</p>
                <p className="text-xs text-green-600">Officer has submitted a report for this complaint</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/reports/complaint/${selectedComplaint.id}`, {
                      headers: getAuthHeaders(),
                    });
                    if (res.ok) {
                      const report = await res.json();
                      viewReport({ report, complaint: selectedComplaint });
                    }
                  } catch (err) {
                    toast.error("Failed to load report");
                  }
                }}
                className="btn-primary px-4 py-2 text-sm"
              >
                View Report
              </button>
            </div>
          </div>
        )}

        {/* Assign Officer Button */}
        <button
          onClick={() => {
            setSelectedOfficerEmail(selectedComplaint.assignedTo || "");
            // ADDED: Set default priority from complaint
            setSelectedPriority(selectedComplaint.priority?.toUpperCase() || "MEDIUM");
            setShowAssignModal(true);
          }}
          className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3"
        >
          <UserCheck className="w-6 h-6" />
          {selectedComplaint.assignedTo ? "Reassign Officer" : "Assign Officer"}
        </button>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase font-bold text-slate-600 block mb-2">Status</label>
            <select
              value={selectedComplaint.status}
              onChange={e => updateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase font-bold text-slate-600 block mb-2">Priority</label>
            <select
              value={selectedComplaint.priority}
              onChange={e => updatePriority(selectedComplaint.id, e.target.value as ComplaintPriority)}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowReplyModal(true)} className="btn-primary py-3">
            <MessageSquare className="w-5 h-5" /> Reply
          </button>
          <button onClick={() => setShowNoteModal(true)} className="btn-secondary py-3">
            <StickyNote className="w-5 h-5" /> Note
          </button>
        </div>

        {/* Replies & Notes */}
        {selectedComplaint.replies?.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-bold mb-3">Replies</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedComplaint.replies.map(r => (
                <div key={r.id} className="p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium">{r.content}</p>
                  <p className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedComplaint.notes?.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-bold mb-3">Notes</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedComplaint.notes.map(n => (
                <div key={n.id} className="p-3 bg-purple-50 rounded-lg text-sm">
                  <p className="font-medium">{n.content}</p>
                  <p className="text-xs text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Assign Officer Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-lg w-full animate-slide-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-cyan-600" />
                Assign Officer
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-2xl"><X /></button>
            </div>

            <p className="text-slate-600 mb-6">Complaint ID: <span className="font-mono font-bold">#{selectedComplaint.id}</span></p>

            <select
              value={selectedOfficerEmail}
              onChange={e => setSelectedOfficerEmail(e.target.value)}
              className="input-field w-full text-lg py-4 mb-6"
            >
              <option value="">-- Select Officer --</option>
              {officers.map(o => (
                <option key={o.id} value={o.email}>
                  {o.name} ({o.department || "No Dept"}) – {o.email}
                </option>
              ))}
            </select>

            {/* ADDED: Priority selection in assignment modal */}
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="input-field w-full mb-4"
            >
              <option value="">-- Select Priority --</option>
              <option value="HIGH">High (24hrs)</option>
              <option value="MEDIUM">Medium (3 days)</option>
              <option value="LOW">Low (7 days)</option>
            </select>

            {officers.length === 0 && (
              <p className="text-amber-600 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                No approved officers. Approve from requests.
              </p>
            )}

            <div className="flex gap-4">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 btn-ghost py-4 text-lg">Cancel</button>
              <button
                onClick={assignOfficer}
                disabled={assigning || !selectedOfficerEmail || !selectedPriority}
                className="flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {assigning ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserCheck className="w-6 h-6" />}
                {assigning ? "Assigning..." : "Assign Officer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6">Reply to Citizen</h3>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4"
              placeholder="Write your reply..."
            />
            <div className="flex gap-4">
              <button onClick={() => { setShowReplyModal(false); setReplyContent(""); }} className="flex-1 btn-ghost py-4">Cancel</button>
              <button onClick={sendReply} className="flex-1 btn-primary py-4 font-bold">Send Reply</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6">Internal Note</h3>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4"
              placeholder="Private note..."
            />
            <div className="flex gap-4">
              <button onClick={() => { setShowNoteModal(false); setNoteContent(""); }} className="flex-1 btn-ghost py-4">Cancel</button>
              <button onClick={addNote} className="flex-1 btn-primary py-4 font-bold">Save Note</button>
            </div>
          </div>
        </div>
      )}
      

      {/* Officer Requests Modal */}
      {showOfficerRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Officer Approval Requests</h3>
              <button onClick={() => setShowOfficerRequestModal(false)}><X className="w-8 h-8" /></button>
            </div>
            {loadingOfficers ? (
              <p className="text-center py-20">Loading...</p>
            ) : pendingOfficerRequests.length === 0 ? (
              <p className="text-center py-20 text-slate-500">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingOfficerRequests.map(r => (
                  <div key={r.id} className="card p-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{r.name}</p>
                      <p className="text-slate-600">{r.email} • {r.department}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleApproveOfficer(r.id)} className="btn-primary px-6 py-3">Approve</button>
                      <button onClick={() => handleRejectOfficer(r.id)} className="btn-ghost px-6 py-3 text-red-600">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

            {/* New Complaints */}
            <button
              onClick={fetchNewComplaints}
              className="btn-primary flex items-center justify-center space-x-2 px-4 py-2 whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              <Bell className="w-4 h-4" />
              <span>New Complaints</span>
              <span className="bg-white text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {notificationCounts.newComplaints}
              </span>
            </button>

            {/* Reports */}
            <button
              onClick={fetchReports}
              className="btn-primary flex items-center justify-center space-x-2 px-4 py-2 whitespace-nowrap bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
              <span className="bg-white text-violet-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {notificationCounts.pendingReports}
              </span>
            </button>

            {/* UPDATED: High Alerts button with triage data */}
            <button
              onClick={() => setShowTriageAlertsModal(true)}
              className="btn-primary flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>High Alerts</span>
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {triageAlerts.counts.critical + triageAlerts.counts.overdue}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Complaint List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-20">Loading...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="card p-20 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl text-slate-500">No complaints found</p>
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div key={c.id} className="relative">
                  <ComplaintCard
                    complaint={c}
                    isSelected={selectedComplaint?.id === c.id}
                    onSelect={setSelectedComplaint}
                    showStatus={true}
                    showPriority={true}
                  />
                  {/* Report Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                        reportStatus[c.id]
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      {reportStatus[c.id] ? "Report Available" : "No Report"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Enhanced Day Summary Card */}
<div className="lg:col-span-1">
  <div className="card p-6 sticky top-24 bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/60 shadow-xl space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between border-b pb-4">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <Clock className="w-5 h-5 text-cyan-600" />
        Today's Summary
      </h3>
      <span className="text-xs text-slate-500">
        {new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}
      </span>
    </div>

    {/* New Complaints */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-slate-600 font-medium">New Complaints</span>
        </div>
        <span className="text-2xl font-bold text-emerald-600">
          {daySummary.newComplaintsToday}
        </span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
          style={{ width: `${Math.min(daySummary.newComplaintsToday * 10, 100)}%` }}
        />
      </div>
    </div>

    {/* Reports Submitted */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-600" />
          <span className="text-sm text-slate-600 font-medium">Reports Submitted</span>
        </div>
        <span className="text-2xl font-bold text-violet-600">
          {daySummary.reportsSubmittedToday}
        </span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500"
          style={{ width: `${Math.min(daySummary.reportsSubmittedToday * 10, 100)}%` }}
        />
      </div>
    </div>

    {/* Escalations */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <span className="text-sm text-slate-600 font-medium">Escalations</span>
        </div>
        <span className={`text-2xl font-bold ${
          daySummary.escalationsToday > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          {daySummary.escalationsToday}
        </span>
      </div>
      {daySummary.escalationsToday > 0 && (
        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          <AlertTriangle className="w-3 h-3" />
          <span>Requires immediate attention</span>
        </div>
      )}
    </div>

    {/* Performance Metrics */}
    <div className="pt-4 border-t border-slate-200 space-y-3">
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
        Performance
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Resolved Today */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-green-800">{daySummary.resolvedToday}</p>
        </div>

        {/* In Progress */}
        <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-cyan-700 font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-cyan-800">{daySummary.inProgress}</p>
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-600 font-medium">SLA Compliance</span>
          <span className={`text-sm font-bold ${
            daySummary.slaComplianceToday >= 85 ? 'text-green-600' :
            daySummary.slaComplianceToday >= 70 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {daySummary.slaComplianceToday}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              daySummary.slaComplianceToday >= 85 ? 'bg-gradient-to-r from-green-500 to-green-600' :
              daySummary.slaComplianceToday >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${daySummary.slaComplianceToday}%` }}
          />
        </div>
      </div>

      {/* Avg Resolution Time */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-700 font-medium">Avg Resolution Time</span>
          <div className="text-right">
            <span className="text-xl font-bold text-blue-800">
              {daySummary.avgResolutionTimeHours}
            </span>
            <span className="text-xs text-blue-600 ml-1">hrs</span>
          </div>
        </div>
      </div>

      {/* Active Officers */}
      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <span className="text-xs text-slate-600">Active Officers</span>
        </div>
        <span className="text-sm font-bold text-slate-800">{daySummary.activeOfficers}</span>
      </div>

      {/* High Priority Pending */}
      {daySummary.highPriorityPending > 0 && (
        <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-medium">High Priority Pending</span>
          </div>
          <span className="text-sm font-bold text-red-800">{daySummary.highPriorityPending}</span>
        </div>
      )}
    </div>

    {/* Last Updated */}
    <div className="pt-3 border-t border-slate-200 text-center">
      <span className="text-xs text-slate-400">
        Updates every minute
      </span>
    </div>
  </div>
</div>
        </div>
      </main>

      {/* Complaint Detail Modal - ADD ALL YOUR EXISTING MODAL CODE HERE */}

{/* New Complaints Modal */}
{showNewComplaintsModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Bell className="w-7 h-7 text-emerald-600" />
          New Complaints (Last 24 Hours)
        </h3>
        <button onClick={() => setShowNewComplaintsModal(false)}>
          <X className="w-8 h-8" />
        </button>
      </div>
      {newComplaints.length === 0 ? (
        <p className="text-center py-20 text-slate-500">No new complaints</p>
      ) : (
        <div className="space-y-4">
          {newComplaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              isSelected={false}
              onSelect={() => {
                setSelectedComplaint(c);
                setShowNewComplaintsModal(false);
              }}
              showStatus={true}
              showPriority={true}
            />
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* Reports Modal */}
{showReportsModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-6xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <FileText className="w-7 h-7 text-violet-600" />
          Officer Reports
        </h3>
        <button onClick={() => setShowReportsModal(false)}>
          <X className="w-8 h-8" />
        </button>
      </div>
      {reportsData.length === 0 ? (
        <p className="text-center py-20 text-slate-500">No reports submitted yet</p>
      ) : (
        <div className="space-y-4">
          {reportsData.map((data, idx) => (
            <div key={idx} className="card p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm font-bold text-violet-600">
                      Report #{data.report.id}
                    </span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      Complaint #{data.complaint?.id}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">
                    {data.complaint?.title || "Unknown Complaint"}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    <strong>Officer:</strong> {data.report.officerName} ({data.report.officerEmail})
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Submitted:</strong>{" "}
                    {new Date(data.report.submittedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {data.report.actionTaken}
                  </p>
                </div>
                <button
                  onClick={() => viewReport(data)}
                  className="ml-4 btn-primary px-4 py-2 text-sm"
                >
                  View Full Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* High Alerts Modal */}
{showHighAlertsModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <AlertOctagon className="w-7 h-7 text-red-600" />
          High Priority Alerts
        </h3>
        <button onClick={() => setShowHighAlertsModal(false)}>
          <X className="w-8 h-8" />
        </button>
      </div>
      {highAlerts.length === 0 ? (
        <p className="text-center py-20 text-slate-500">No high alerts</p>
      ) : (
        <div className="space-y-4">
          {highAlerts.map((alert) => (
            <div key={alert.id} className="card p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg font-bold text-red-600">
                      #{alert.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alert.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {alert.priority?.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{alert.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Assigned to:</strong> {alert.assignedTo || "Unassigned"}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-red-600">
                      {alert.hoursUntilEscalation} hours until escalation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* ADDED: Triage Alerts Modal */}
{showTriageAlertsModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <AlertOctagon className="w-7 h-7 text-red-600" />
          Triage Alerts
        </h3>
        <button onClick={() => setShowTriageAlertsModal(false)}>
          <X className="w-8 h-8" />
        </button>
      </div>
      <div className="space-y-4">
        {/* Critical Section */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-bold text-amber-800 mb-2">Critical (9+ hrs remaining): {triageAlerts.counts.critical}</h4>
          {triageAlerts.critical.map((alert: any) => (
            <div key={alert.id} className="p-3 bg-white rounded border-l-4 border-amber-500 mb-2">
              <p className="font-semibold">#{alert.id}: {alert.title}</p>
              <p className="text-sm text-slate-600">{alert.hoursRemaining} hrs left</p>
            </div>
          ))}
        </div>
        {/* Overdue Section */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-bold text-red-800 mb-2">Overdue: {triageAlerts.counts.overdue}</h4>
          {triageAlerts.overdue.map((alert: any) => (
            <div key={alert.id} className="p-3 bg-white rounded border-l-4 border-red-500 mb-2">
              <p className="font-semibold">#{alert.id}: {alert.title}</p>
              <p className="text-sm text-red-600">Breached!</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{/* Report View Modal */}
{showReportViewModal && selectedReport && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Full Report Details</h3>
        <button onClick={() => setShowReportViewModal(false)}>
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Complaint Info */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h4 className="font-bold mb-2">Associated Complaint</h4>
          <p className="text-sm">
            <strong>ID:</strong> #{selectedReport.complaint?.id}
          </p>
          <p className="text-sm">
            <strong>Title:</strong> {selectedReport.complaint?.title}
          </p>
          <p className="text-sm">
            <strong>Category:</strong> {selectedReport.complaint?.category}
          </p>
        </div>

        {/* Officer Info */}
        <div>
          <h4 className="font-bold mb-2">Officer Information</h4>
          <p className="text-sm">
            <strong>Name:</strong> {selectedReport.report.officerName}
          </p>
          <p className="text-sm">
            <strong>Email:</strong> {selectedReport.report.officerEmail}
          </p>
        </div>

        {/* Action Taken */}
        <div>
          <h4 className="font-bold mb-2">Action Taken</h4>
          <p className="text-sm bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
            {selectedReport.report.actionTaken}
          </p>
        </div>

        {/* Description */}
        {selectedReport.report.description && (
          <div>
            <h4 className="font-bold mb-2">Additional Details</h4>
            <p className="text-sm bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
              {selectedReport.report.description}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {selectedReport.report.recommendations && (
          <div>
            <h4 className="font-bold mb-2">Recommendations</h4>
            <p className="text-sm bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
              {selectedReport.report.recommendations}
            </p>
          </div>
        )}

        {/* Attachments */}
        {selectedReport.report.attachments && selectedReport.report.attachments.length > 0 && (
          <div>
            <h4 className="font-bold mb-2">Attachments</h4>
            <div className="space-y-2">
              {selectedReport.report.attachments.map((file: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 p-3 rounded-lg">
                  <Download className="w-4 h-4" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-slate-500">
            Submitted on {new Date(selectedReport.report.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
};

export default AdminDashboard;