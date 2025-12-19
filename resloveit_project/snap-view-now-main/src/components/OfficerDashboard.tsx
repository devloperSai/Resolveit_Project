import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, FileText, Clock, TrendingUp, CheckCircle2, AlertTriangle,
  User, Calendar, FileImage, MessageSquare, StickyNote,
  UserCheck, AlertCircle, Download
} from 'lucide-react';
import { Header } from './shared/Header';
import { Footer } from './shared/Footer';
import { StatCard } from './shared/StatCard';
import { ComplaintCard } from './shared/ComplaintCard';
import { SubmitReportModal } from './shared/SubmitReportModal';
import { ImageViewerModal } from './shared/ImageViewerModal';
import { Complaint, ComplaintStatus } from '../types';
import { useReportService } from '../hooks/useReportService';
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:8080/api";

export const OfficerDashboard: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { validateResolution, checkReportExists } = useReportService();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState<Record<number, boolean>>({});
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchAssignedComplaints();
    }
  }, [user]);

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

  const updateStatus = async (id: number, status: ComplaintStatus) => {
    if (status === 'resolved') {
      const validation = await validateResolution(id);
      
      if (!validation.canResolve) {
        toast.error(validation.message, {
          duration: 5000,
          icon: '🚫',
        });
        return;
      }
    }

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
      
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status });
      }
      
      toast.success(`Status updated to ${status.replace('-', ' ').toUpperCase()}`, {
        duration: 3000,
        position: 'top-right',
      });
      
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update status. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

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
      toast.success('Reply sent successfully');
    } catch {
      toast.error("Failed to send reply.");
    }
  };

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
      toast.success('Note saved successfully');
    } catch {
      toast.error("Failed to save note.");
    }
  };

  const handleReportSuccess = () => {
    fetchAssignedComplaints();
  };

  const stats = {
    total: complaints.length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    highPriority: complaints.filter(c => c.priority.toLowerCase() === 'high').length,
  };

  if (!user) {
    return <div className="text-center py-32 text-xl">Please log in as an officer.</div>;
  }

  const hasReport = selectedComplaint ? reportStatus[selectedComplaint.id] : false;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      <Header 
        title="Officer Portal" 
        subtitle={`Welcome back, ${user.name || user.email.split('@')[0]}`} 
        icon={<Shield className="w-7 h-7 text-white" />} 
      />

      <main className="flex-1 container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-12">
          <StatCard label="Total Assigned" value={stats.total} icon={<FileText className="w-6 h-6" />} color="blue" />
          <StatCard label="Pending Action" value={stats.assigned} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp className="w-6 h-6" />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="relative">
                    <ComplaintCard
                      complaint={complaint}
                      isSelected={selectedComplaint?.id === complaint.id}
                      onSelect={setSelectedComplaint}
                      showStatus={true}
                      showPriority={true}
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                        reportStatus[complaint.id]
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        <FileText className="w-3 h-3" />
                        {reportStatus[complaint.id] ? 'Report Submitted' : 'No Report'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedComplaint ? (
              <div className="card p-6 sticky top-24 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto bg-white/90 backdrop-blur">
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

                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Attachments ({selectedComplaint.attachments.length})
                    </p>
                    <div className="space-y-2">
                      {selectedComplaint.attachments.map((file, i) => {
                        const filename = typeof file === 'string' ? file : String(file);
                        const isPdf = filename.toLowerCase().endsWith('.pdf');
                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);
                        const downloadUrl = `http://localhost:8080/api/files/complaints/${filename}`;
                        
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isImage ? (
                                <img 
                                  src={downloadUrl} 
                                  alt={filename}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : isPdf ? (
                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                  <span className="text-xs font-bold text-red-600">PDF</span>
                                </div>
                              ) : (
                                <FileText className="w-4 h-4 text-slate-600" />
                              )}
                              <span className="text-sm text-slate-700 truncate">
                                {filename}
                              </span>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {isImage && (
                                <button
                                  onClick={() => setViewingImageIndex(i)}
                                  className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                  title="View"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              )}
                              <a
                                href={downloadUrl}
                                download={filename}
                                className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                title="Download"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!hasReport && selectedComplaint.status !== 'resolved' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <strong>Report Required:</strong> Submit a report before resolving this complaint.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={hasReport}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                    hasReport
                      ? 'bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  {hasReport ? 'Report Submitted ✓' : 'Submit Report'}
                </button>

                <div>
                  <label className="text-xs text-slate-600 uppercase font-semibold mb-2 block">Update Status</label>
                  <select
                    value={selectedComplaint.status}
                    onChange={(e) => updateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
                    className="input-field w-full font-medium"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved" disabled={!hasReport}>
                      Resolved {!hasReport && '(Report Required)'}
                    </option>
                  </select>
                </div>

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
                    <StickyNote className="w-4 h-4" />
                    Note
                  </button>
                </div>

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

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full animate-slide-in-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <StickyNote className="w-7 h-7 text-purple-600" />
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

      {showReportModal && selectedComplaint && (
        <SubmitReportModal
          complaint={selectedComplaint}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}

      {viewingImageIndex !== null && selectedComplaint && selectedComplaint.attachments && (() => {
        const attachments = selectedComplaint.attachments || [];
        const normalized = attachments
          .map(a => (typeof a === 'string' ? a : String(a)))
          .filter(a => a && /\.(jpg|jpeg|png|gif)$/i.test(a));

        const images = normalized.map(name => `${API_BASE}/files/complaints/${encodeURIComponent(name)}`);

        const original = attachments[viewingImageIndex as number];
        const originalName = original ? (typeof original === 'string' ? original : String(original)) : null;
        const initialIndex = originalName ? normalized.findIndex(n => n === originalName) : 0;

        return (
          <ImageViewerModal
            images={images}
            initialIndex={initialIndex >= 0 ? initialIndex : 0}
            onClose={() => setViewingImageIndex(null)}
          />
        );
      })()}

      <Footer />
    </div>
  );
};