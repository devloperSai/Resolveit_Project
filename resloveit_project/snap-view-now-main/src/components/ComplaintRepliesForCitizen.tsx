import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:8080/api";

type Reply = { id: number; content: string; createdAt: string; isAdminReply?: boolean; createdBy?: string; };

export const ComplaintRepliesForCitizen: React.FC<{ complaintId: number | null }> = ({ complaintId }) => {
  const { getAuthHeaders } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!complaintId) return;
    let mounted = true;
    const fetchReplies = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/complaints/${complaintId}/replies`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(await res.text());
        const data: Reply[] = await res.json();
        if (!mounted) return;
        // show officer replies (non-admin)
        setReplies(data.filter(r => !r.isAdminReply));
      } catch (err: any) {
        toast.error('Failed to load officer replies');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReplies();
    return () => { mounted = false; };
  }, [complaintId, getAuthHeaders]);

  if (!complaintId) return null;
  if (loading) return <div className="text-sm text-slate-500">Loading updates...</div>;
  if (replies.length === 0) return <div className="text-sm text-slate-500">No updates from officer yet.</div>;

  return (
    <div className="space-y-3">
      {replies.map(r => (
        <div key={r.id} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-slate-800 whitespace-pre-wrap">{r.content}</p>
          <p className="text-slate-500 mt-1 text-xs">
            {r.createdBy ? `${r.createdBy} • ` : ''}{new Date(r.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};