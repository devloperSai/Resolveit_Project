import React, { useState } from 'react';
import { X, Download, MapPin, User, Calendar, FileText, Clock, AlertCircle, CheckCircle2, MessageSquare, Paperclip } from 'lucide-react';
import { StatusStepper } from './StatusStepper';
import { ImageViewerModal } from './ImageViewerModal';
import { ComplaintRepliesForCitizen } from '../ComplaintRepliesForCitizen';

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  priority?: string;
  submittedAt: string;
  assignedTo?: string | null;
  assignedAt?: string | null;
  acknowledgedAt?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  resolutionNotes?: string | null;
  city?: string;
  state?: string;
  address?: string;
  attachments?: string[];
  replies?: any[];
  rating?: number;
  isAnonymous?: boolean;
  citizenName?: string;
  submittedBy?: string;
}

interface EnhancedComplaintModalProps {
  complaint: Complaint;
  onClose: () => void;
  onDownloadPDF: (complaint: Complaint) => void;
}

export const EnhancedComplaintModal: React.FC<EnhancedComplaintModalProps> = ({
  complaint,
  onClose,
  onDownloadPDF,
}) => {
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: 'bg-amber-100 border-amber-300',
        text: 'text-amber-700',
        icon: <Clock className="w-4 h-4" />,
      },
      assigned: {
        bg: 'bg-blue-100 border-blue-300',
        text: 'text-blue-700',
        icon: <User className="w-4 h-4" />,
      },
      'in-progress': {
        bg: 'bg-cyan-100 border-cyan-300',
        text: 'text-cyan-700',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      resolved: {
        bg: 'bg-green-100 border-green-300',
        text: 'text-green-700',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    };

    const config = statusMap[status.toLowerCase()] || statusMap.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('-', ' ').toUpperCase()}
      </div>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const priorityMap: Record<string, string> = {
      high: 'bg-red-100 text-red-700 border-red-300',
      medium: 'bg-amber-100 text-amber-700 border-amber-300',
      low: 'bg-green-100 text-green-700 border-green-300',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${priorityMap[priority.toLowerCase()] || ''}`}>
        {priority.toUpperCase()} PRIORITY
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold uppercase tracking-wide opacity-90">Complaint ID</span>
                {getPriorityBadge(complaint.priority)}
              </div>
              <h2 className="text-3xl font-bold font-mono">#{complaint.id}</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onDownloadPDF(complaint)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Status Stepper */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Complaint Journey
            </h3>
            <StatusStepper
              currentStatus={complaint.status}
              assignedAt={complaint.assignedAt}
              acknowledgedAt={complaint.acknowledgedAt}
              closedAt={complaint.closedAt}
            />
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title & Description */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Complaint Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Title</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{complaint.title}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Category:</span>
                    <span className="font-bold text-blue-600">{complaint.category}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              {complaint.city && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Location
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    {complaint.address && <p>{complaint.address}</p>}
                    <p className="font-semibold text-slate-900">
                      {complaint.city}, {complaint.state}
                    </p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    Attachments ({complaint.attachments.length})
                  </h3>
                  <div className="space-y-3">
                    {complaint.attachments.map((file, i) => {
                      const filename = typeof file === 'string' ? file : file.toString();
                      const isPdf = filename.toLowerCase().endsWith('.pdf');
                      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);
                      const downloadUrl = `http://localhost:8080/api/files/complaints/${filename}`;
                      
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {isImage ? (
                                <img 
                                  src={downloadUrl} 
                                  alt={filename}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : isPdf ? (
                                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                                  <span className="text-xs font-bold text-red-600">PDF</span>
                                </div>
                              ) : (
                                <FileText className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {filename}
                              </p>
                              {isImage && (
                                <p className="text-xs text-slate-500">Image</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {isImage && (
                              <button
                                onClick={() => setViewingImageIndex(i)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                title="View"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                            <a
                              href={downloadUrl}
                              download={filename}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Submission Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Submitted By</p>
                      <p className="font-semibold text-slate-900">
                        {complaint.isAnonymous ? 'Anonymous' : (complaint.citizenName || complaint.submittedBy || 'Citizen')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Submitted On</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(complaint.submittedAt).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Current Status</h3>
                <div className="mb-4">{getStatusBadge(complaint.status)}</div>
                {complaint.assignedTo && (
                  <div className="text-sm">
                    <p className="text-slate-600 mb-1">Assigned to:</p>
                    <p className="font-bold text-blue-600">{complaint.assignedTo}</p>
                    {complaint.assignedAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        on {new Date(complaint.assignedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Info */}
              {complaint.status === 'resolved' && (
                <div className="bg-green-50 rounded-xl border-2 border-green-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Resolution
                  </h3>
                  <div className="space-y-3 text-sm">
                    {complaint.resolutionNotes && (
                      <div>
                        <p className="text-slate-600 font-semibold mb-1">Notes:</p>
                        <p className="text-slate-700 leading-relaxed">{complaint.resolutionNotes}</p>
                      </div>
                    )}
                    {complaint.closedAt && (
                      <div>
                        <p className="text-slate-600 font-semibold">Closed on:</p>
                        <p className="text-slate-900 font-bold">
                          {new Date(complaint.closedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {complaint.closedBy && (
                      <div>
                        <p className="text-slate-600 font-semibold">Closed by:</p>
                        <p className="text-slate-900 font-bold">{complaint.closedBy}</p>
                      </div>
                    )}
                    {complaint.rating && (
                      <div>
                        <p className="text-slate-600 font-semibold">Your Rating:</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < complaint.rating! ? 'text-yellow-400' : 'text-slate-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Replies/Updates - live from server */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Updates
                </h3>
                {/* Fetch live replies for citizens (filters out admin replies internally) */}
                {/* Component lazy-load: import at top would be ideal but keeping relative import here */}
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <div>
                  {/** Use dynamic import to avoid circular issues in some setups */}
                  <ComplaintRepliesForCitizen complaintId={complaint.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImageIndex !== null && complaint.attachments && (
        <ImageViewerModal
          images={complaint.attachments
            .map((file, i) => ({
              file: typeof file === 'string' ? file : file.toString(),
              index: i,
            }))
            .filter(({ file }) => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .map(({ file }) => `http://localhost:8080/api/files/complaints/${file}`)}
          initialIndex={complaint.attachments
            .map((file, i) => ({
              file: typeof file === 'string' ? file : file.toString(),
              index: i,
            }))
            .filter(({ file }) => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .findIndex((_, i) => complaint.attachments![viewingImageIndex] ? /\.(jpg|jpeg|png|gif)$/i.test(typeof complaint.attachments![viewingImageIndex] === 'string' ? complaint.attachments![viewingImageIndex] : complaint.attachments![viewingImageIndex].toString()) : false)}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
    </div>
  );
};