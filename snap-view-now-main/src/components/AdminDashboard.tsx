import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Shield, Search, Filter, ChevronDown, MessageSquare, CheckCircle2,
  AlertTriangle, TrendingUp, Clock, FileText, User, UserCheck,
  Users, FileImage, Calendar, StickyNote, X, Loader2, AlertCircle
} from "lucide-react";
import { Header } from "./shared/Header";
import { Footer } from "./shared/Footer";
import { StatCard } from "./shared/StatCard";
import { ComplaintCard } from "./shared/ComplaintCard";
import { Complaint, ComplaintStatus, ComplaintPriority } from "../types";
// NEW: import analytics
import AdminAnalytics from "./shared/AdminAnalytics";
// <<< NEW: import useComplaints to get the workload function >>>
import { useComplaints } from "../context/ComplaintContext";

const API_BASE = "http://localhost:8080/api";

export const AdminDashboard: React.FC = () => {
  const { getAuthHeaders } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Officer Requests Modal
  const [showOfficerRequestModal, setShowOfficerRequestModal] = useState(false);
  const [pendingOfficerRequests, setPendingOfficerRequests] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedOfficerEmail, setSelectedOfficerEmail] = useState("");

  // Reply & Note Modals
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Officers list
  const [officers, setOfficers] = useState<{ id: number; email: string; name: string; department?: string }[]>([]);

  // <<< NEW: pull only getOfficerWorkload from context (no name collisions) >>>
  const { getOfficerWorkload } = useComplaints();

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
  }, [getAuthHeaders]);

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
    priority:
      typeof c.priority === "string"
        ? c.priority.toLowerCase()
        : "medium",
    submittedAt: c.submittedAt || new Date().toISOString(),
    notes: c.notes || [],
    replies: c.replies || [],
    attachments: c.attachments || [],
  }))
);

    } catch (err) {
      alert("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch officers
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const res = await fetch(`${API_BASE}/officers`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setOfficers(data.map((o: any) => ({
          id: Number(o.id),
          email: o.email,
          name: o.name,
          department: o.department,
        })));
      } catch (err) {
        console.error("Failed to load officers");
      }
    };
    fetchOfficers();
  }, [getAuthHeaders]);

  // Fetch pending officer requests
  const fetchPendingOfficerRequests = async () => {
    setLoadingOfficers(true);
    try {
      const res = await fetch(`${API_BASE}/officers/pending`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPendingOfficerRequests(data);
    } catch (err) {
      alert("Failed to load requests.");
    } finally {
      setLoadingOfficers(false);
    }
  };

  // Approve/Reject officer
  const handleApproveOfficer = async (id: number) => {
    if (!confirm("Approve officer?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/approve/${id}`, { method: "POST", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setPendingOfficerRequests(prev => prev.filter(r => r.id !== id));
      alert("Officer approved!");
    } catch {
      alert("Failed.");
    }
  };

  const handleRejectOfficer = async (id: number) => {
    if (!confirm("Reject officer?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reject/${id}`, { method: "POST", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setPendingOfficerRequests(prev => prev.filter(r => r.id !== id));
      alert("Officer rejected.");
    } catch {
      alert("Failed.");
    }
  };

  // Assign officer
  const assignOfficer = async () => {
    if (!selectedComplaint || !selectedOfficerEmail) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${selectedComplaint.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ officerEmail: selectedOfficerEmail }),
      });
      if (!res.ok) throw new Error();

      const updated = { ...selectedComplaint, assignedTo: selectedOfficerEmail, status: "assigned" as ComplaintStatus };
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setShowAssignModal(false);
      setSelectedOfficerEmail("");
      alert("Officer assigned!");
    } catch {
      alert("Failed to assign.");
    } finally {
      setAssigning(false);
    }
  };

  // Update status/priority
  const updateStatus = async (id: number, status: ComplaintStatus) => {
    try {
      await fetch(`${API_BASE}/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      if (selectedComplaint?.id === id) setSelectedComplaint(prev => prev ? { ...prev, status } : null);
    } catch { alert("Failed"); }
  };

  const updatePriority = async (id: number, priority: ComplaintPriority) => {
  try {
    const payload = { priority: priority.toUpperCase() }; // convert to enum format

    const res = await fetch(`${API_BASE}/complaints/${id}/priority`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to update priority");

    const updatedComplaint = await res.json();

    // Update the UI with backend truth
    setComplaints(prev =>
  prev.map(c =>
    c.id === id
      ? { ...c, ...updatedComplaint, priority: updatedComplaint.priority.toLowerCase() }
      : c
  )
);


    if (selectedComplaint?.id === id) {
      setSelectedComplaint(prev =>
  prev
    ? { ...prev, ...updatedComplaint, priority: updatedComplaint.priority.toLowerCase() }
    : null
);

    }

  } catch (err) {
    console.error(err);
    alert("Failed to update priority");
  }
};


  // Send reply
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
      const updated = { ...selectedComplaint, replies: [...(selectedComplaint.replies || []), newReply] };
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setReplyContent("");
      setShowReplyModal(false);
    } catch { alert("Failed"); }
  };

  // Add note
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
      const updated = { ...selectedComplaint, notes: [...(selectedComplaint.notes || []), newNote] };
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setNoteContent("");
      setShowNoteModal(false);
    } catch { alert("Failed"); }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    inProgress: complaints.filter(c => ["assigned", "in-progress"].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    highPriority: complaints.filter(c => c.priority === "high").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      <Header title="Admin Panel" subtitle="System Control Center" icon={<Shield className="w-7 h-7 text-white" />} />

      <main className="flex-1 container-custom py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <StatCard label="Total" value={stats.total} icon={<FileText />} color="blue" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="green" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<AlertTriangle />} color="red" />
        </div>

        {/* Insert AdminAnalytics here (full-width card above the lists) */}
         <div className="card p-6 mb-8 shadow-lg">
      <AdminAnalytics
        complaints={complaints}
        officers={officers}
        getOfficerWorkload={getOfficerWorkload} // pass the function from context
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
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search complaints..."
                className="input-field pl-12"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input-field w-full lg:w-64"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              onClick={() => { fetchPendingOfficerRequests(); setShowOfficerRequestModal(true); }}
              className="btn-primary whitespace-nowrap"
            >
              <Users className="w-5 h-5" /> Officer Requests
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-20">Loading...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="card p-20 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl text-slate-500">No complaints found</p>
              </div>
            ) : (
              filteredComplaints.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  isSelected={selectedComplaint?.id === c.id}
                  onSelect={setSelectedComplaint}
                  showStatus={true}
                  showPriority={true}
                />
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedComplaint ? (
              <div className="card p-6 sticky top-24 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
                <div className="flex justify-between items-start">
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
                  <p className="text-sm bg-slate-50 p-4 rounded-lg">{selectedComplaint.description}</p>
                </div>

                {/* Assign Officer Button */}
                <button
                  onClick={() => {
                    setSelectedOfficerEmail(selectedComplaint.assignedTo || "");
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
                   onChange={e => updatePriority(selectedComplaint.id,e.target.value as ComplaintPriority)}
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
            ) : (
              <div className="card p-20 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl text-slate-600">Select a complaint</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
                disabled={assigning || !selectedOfficerEmail}
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
