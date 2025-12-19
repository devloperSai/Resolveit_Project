import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserCheck, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

const API_BASE = "http://localhost:8080/api";

interface AssignOfficerModalProps {
  complaintId: number;
  onClose: () => void;
}

export const AssignOfficerModal: React.FC<AssignOfficerModalProps> = ({ complaintId, onClose }) => {
  const { getAuthHeaders } = useAuth();
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${API_BASE}/officers`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOfficers(data);
    } catch (err) {
      alert("Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    setAssigning(true);

    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ officerEmail: selectedOfficer, status: "assigned" }),
      });

      if (!res.ok) throw new Error();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      alert("Failed to assign officer");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-8 max-w-md w-full animate-slide-in-up relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-10 h-10 text-cyan-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Assign Officer</h2>
          <p className="text-slate-600 mt-2">Complaint ID: #{complaintId}</p>
        </div>

        {/* Officer Dropdown */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto" />
          </div>
        ) : success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-green-600">Officer Assigned Successfully!</p>
          </div>
        ) : (
          <>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">
              Select Officer
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="input-field w-full text-base py-3"
            >
              <option value="">Choose an officer...</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.email}>
                  {officer.name} - {officer.department} ({officer.email})
                </option>
              ))}
            </select>

            {officers.length === 0 && (
              <p className="text-amber-600 text-sm mt-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No approved officers found. Approve officers first.
              </p>
            )}

            {/* Assign Button */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleAssign}
                disabled={!selectedOfficer || assigning}
                className="flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {assigning ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UserCheck className="w-6 h-6" />
                )}
                {assigning ? "Assigning..." : "Assign Officer"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-ghost py-4 text-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};