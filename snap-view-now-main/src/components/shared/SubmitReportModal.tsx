// src/components/shared/SubmitReportModal.tsx

import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Complaint } from '../../types';
import { useReportService } from '../../hooks/useReportService';
import { useAuth } from '../../context/AuthContext';

interface SubmitReportModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  complaint,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { submitReport, loading } = useReportService();

  const [actionTaken, setActionTaken] = useState('');
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Only JPG, PNG, PDF allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name}: File too large. Max 10MB.`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!actionTaken.trim()) {
      newErrors.actionTaken = 'Action taken is required';
    } else if (actionTaken.trim().length < 20) {
      newErrors.actionTaken = 'Please provide more details (min 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.email || !user?.name) {
      alert('User information not available');
      return;
    }

    const report = await submitReport({
      complaintId: complaint.id,
      officerEmail: user.email,
      officerName: user.name,
      actionTaken,
      description: description.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      files: files.length > 0 ? files : undefined,
    });

    if (report) {
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card p-8 max-w-md w-full text-center animate-slide-in-up">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">Report Submitted!</h3>
          <p className="text-slate-600">Your report has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card p-8 max-w-4xl w-full my-8 animate-slide-in-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-600" />
              Submit Complaint Report
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Complaint ID: #{complaint.id}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Complaint Summary (Read-only) */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Complaint Details</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Title:</strong> {complaint.title}</p>
            <p><strong>Description:</strong> {complaint.description}</p>
            <p><strong>Category:</strong> {complaint.category}</p>
            <p><strong>Priority:</strong> <span className={`font-semibold ${
              complaint.priority === 'high' ? 'text-red-600' :
              complaint.priority === 'medium' ? 'text-amber-600' :
              'text-green-600'
            }`}>{complaint.priority.toUpperCase()}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Taken - REQUIRED */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Action Taken <span className="text-red-500">*</span>
            </label>
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className={`input-field w-full h-32 resize-none ${
                errors.actionTaken ? 'border-red-500' : ''
              }`}
              placeholder="Describe the actions you took to resolve this complaint..."
              disabled={loading}
              maxLength={2000}
            />
            {errors.actionTaken && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.actionTaken}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">{actionTaken.length}/2000</p>
          </div>

          {/* Additional Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full h-24 resize-none"
              placeholder="Add any additional information or context..."
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-slate-500 mt-1">{description.length}/1000</p>
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Recommendations (Optional)
            </label>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="input-field w-full h-24 resize-none"
              placeholder="Suggest preventive measures or improvements..."
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-slate-500 mt-1">{recommendations.length}/1000</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attachments (Optional, Max 5 files, 10MB each)
            </label>
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mr-2" />
              <span className="text-sm text-slate-600">Upload evidence (JPG, PNG, PDF)</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={loading || files.length >= 5}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{file.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={loading}
                      className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important:</p>
                <p>
                  This report is required before marking the complaint as <strong>Resolved</strong>.
                  Make sure all information is accurate and complete.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-ghost py-3 text-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !actionTaken.trim()}
              className="flex-1 btn-primary py-3 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};