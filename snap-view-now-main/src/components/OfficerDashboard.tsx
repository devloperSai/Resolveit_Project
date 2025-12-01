import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, FileText, Clock, TrendingUp, CheckCircle2, AlertTriangle,
  User, Calendar, FileImage, MessageSquare, FileText as NoteIcon,
  UserCheck
} from 'lucide-react';
import { Header } from './shared/Header';
import { Footer } from './shared/Footer';
import { StatCard } from './shared/StatCard';
import { ComplaintCard } from './shared/ComplaintCard';
import { Complaint, ComplaintStatus } from '../types';
import toast from 'react-hot-toast';



const API_BASE = "http://localhost:8080/api";

export const OfficerDashboard: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Fetch assigned complaints
  useEffect(() => {
    if (user?.email) {
      fetchAssignedComplaints();
    }
  }, [user]);

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/officer/complaints?email=${user?.email}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const mapped: Complaint[] = data.map((c: any) => {
        const rawPriority = c.priority?.toString().trim();
        const normalizedPriority = rawPriority 
          ? rawPriority.toLowerCase() === 'high' ? 'high' :
            rawPriority.toLowerCase() === 'low' ? 'low' : 'medium'
          : 'medium';

        return {
          ...c,
          id: Number(c.id),
          submittedAt: c.submittedAt || new Date().toISOString(),
          priority: normalizedPriority as 'low' | 'medium' | 'high',
          status: (c.status || 'assigned').toLowerCase() as ComplaintStatus,
          notes: c.notes || [],
          replies: c.replies || [],
          attachments: c.attachments || [],
          isAnonymous: c.isAnonymous ?? false,
          citizenName: c.user?.name || c.submittedBy || 'Citizen',
        };
      });
      setComplaints(mapped);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("No complaints assigned yet.");
    } finally {
      setLoading(false);
    }
  };

 // Update status using context (which has toast notifications)
const updateStatus = async (id: number, status: ComplaintStatus) => {
  try {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status: status.toUpperCase().replace('-', '_') }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to update status');
    }

    const updatedComplaint = await res.json();
    
    // Update local state
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selectedComplaint?.id === id) {
      setSelectedComplaint({ ...selectedComplaint, status });
    }
    
    // ✅ Show success toast
    toast.success(`Status updated to ${status.replace('-', ' ').toUpperCase()}`, {
      duration: 3000,
      position: 'top-right',
    });
    
  } catch (error) {
    console.error('Failed to update status:', error);
    // ❌ Show error toast
    toast.error('Failed to update status. Please try again.', {
      duration: 4000,
      position: 'top-right',
    });
  }
};

  // Send reply to citizen
  const sendReply = async () => {
    if (!selectedComplaint || !replyContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          content: replyContent,
          isAdminReply: false,
        }),
      });
      if (!res.ok) throw new Error();

      const newReply = await res.json();
      const updatedComplaint = {
        ...selectedComplaint,
        replies: [...(selectedComplaint.replies || []), newReply]
      };

      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
      setSelectedComplaint(updatedComplaint);
      setReplyContent('');
      setShowReplyModal(false);
    } catch {
      alert("Failed to send reply.");
    }
  };

  // Add internal note
  const addInternalNote = async () => {
    if (!selectedComplaint || !noteContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          content: noteContent,
          createdBy: user?.email || 'officer',
          isPrivate: true,
        }),
      });
      if (!res.ok) throw new Error();

      const newNote = await res.json();
      const updatedComplaint = {
        ...selectedComplaint,
        notes: [...(selectedComplaint.notes || []), newNote]
      };

      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
      setSelectedComplaint(updatedComplaint);
      setNoteContent('');
      setShowNoteModal(false);
    } catch {
      alert("Failed to save note.");
    }
  };

  const stats = {
    total: complaints.length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    highPriority: complaints.filter(c => c.priority.toLowerCase() === 'high').length, // ← NOW CORRECT!
  };

  if (!user) {
    return <div className="text-center py-32 text-xl">Please log in as an officer.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      <Header 
        title="Officer Portal" 
        subtitle={`Welcome back, ${user.name || user.email.split('@')[0]}`} 
        icon={<Shield className="w-7 h-7 text-white" />} 
      />

      <main className="flex-1 container-custom py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-12">
          <StatCard label="Total Assigned" value={stats.total} icon={<FileText className="w-6 h-6" />} color="blue" />
          <StatCard label="Pending Action" value={stats.assigned} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp className="w-6 h-6" />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Complaints List */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-cyan-600" />
              My Assigned Complaints
            </h2>

            {loading ? (
              <div className="text-center py-20 text-slate-500">Loading complaints...</div>
            ) : complaints.length === 0 ? (
              <div className="card p-16 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600">No complaints assigned yet.</p>
                <p className="text-sm text-slate-500 mt-2">Check back later!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    isSelected={selectedComplaint?.id === complaint.id}
                    onSelect={setSelectedComplaint}
                    showStatus={true}
                    showPriority={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-1">
            {selectedComplaint ? (
              <div className="card p-6 sticky top-24 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto bg-white/90 backdrop-blur">
                {/* Header - BULLETPROOF PRIORITY BADGE */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Complaint ID</p>
                    <p className="font-mono text-2xl font-bold text-slate-900">#{selectedComplaint.id}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider shadow-sm ${
                    selectedComplaint.priority.toLowerCase() === 'high' ? 'bg-red-500 text-white' :
                    selectedComplaint.priority.toLowerCase() === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {selectedComplaint.priority.toUpperCase()} PRIORITY
                  </span>
                </div>

                {/* Citizen Info */}
                <div className="space-y-3 py-4 border-y border-slate-200">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">
                      {selectedComplaint.isAnonymous ? 'Anonymous Citizen' : selectedComplaint.citizenName || 'Citizen'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-600">
                      {new Date(selectedComplaint.submittedAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Attachments */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Attachments ({selectedComplaint.attachments.length})
                    </p>
                    <div className="space-y-2">
                      {selectedComplaint.attachments.map((file, i) => (
                        <a key={i} href={file} target="_blank" rel="noopener noreferrer"
                           className="block text-sm text-blue-600 hover:underline truncate">
                          {file.split('/').pop() || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <label className="text-xs text-slate-600 uppercase font-semibold mb-2 block">Update Status</label>
                  <select
                    value={selectedComplaint.status}
                    onChange={(e) => updateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
                    className="input-field w-full font-medium"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowReplyModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 py-3 text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm font-medium"
                  >
                    <NoteIcon className="w-4 h-4" />
                    Note
                  </button>
                        

                </div>

                {/* Admin Updates */}
                {selectedComplaint.replies?.filter(r => r.isAdminReply).length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Admin Updates</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.replies
                        .filter(r => r.isAdminReply)
                        .map((reply) => (
                          <div key={reply.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                            <p className="font-medium text-slate-800">{reply.content}</p>
                            <p className="text-slate-500 mt-1">
                              {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Your Notes */}
                {selectedComplaint.notes?.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Your Internal Notes</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.notes.map((note) => (
                        <div key={note.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                          <p className="font-medium text-slate-800">{note.content}</p>
                          <p className="text-slate-500 mt-1">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-16 text-center bg-white/80">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600 font-medium">Select a complaint</p>
                <p className="text-sm text-slate-500">to view details and take action</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full animate-slide-in-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-cyan-600" />
              Send Update to Citizen
            </h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4 text-base"
              placeholder="Write a clear and professional update..."
              maxLength={1000}
            />
            <div className="text-right text-sm text-slate-500 mb-4">
              {replyContent.length}/1000
            </div>
            <div className="flex gap-4">
              <button onClick={sendReply} className="btn-primary flex-1 py-3 text-lg font-semibold">
                Send Update
              </button>
        
              <button 
                onClick={() => { setShowReplyModal(false); setReplyContent(''); }} 
                className="btn-ghost flex-1 py-3 text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full animate-slide-in-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <NoteIcon className="w-7 h-7 text-purple-600" />
              Internal Note (Admin Only)
            </h3>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4 text-base"
              placeholder="Add investigation notes, evidence, or completion details..."
              maxLength={2000}
            />
            <div className="text-right text-sm text-slate-500 mb-4">
              {noteContent.length}/2000
            </div>
            <div className="flex gap-4">
              <button onClick={addInternalNote} className="btn-primary flex-1 py-3 text-lg font-semibold">
                Save Note
              </button>
              <button 
                onClick={() => { setShowNoteModal(false); setNoteContent(''); }} 
                className="btn-ghost flex-1 py-3 text-lg"
              >
                Cancel
              </button>
              
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};