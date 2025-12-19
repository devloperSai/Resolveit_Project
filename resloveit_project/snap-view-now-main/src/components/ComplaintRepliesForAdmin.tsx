import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:8080/api";

type Reply = { id: number; content: string; createdAt: string; isAdminReply?: boolean; createdBy?: string; };

export const ComplaintRepliesForAdmin: React.FC<{ complaintId: number | null }> = ({ complaintId }) => {
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
        setReplies(data);
      } catch (err: any) {
        toast.error('Failed to load replies');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReplies();
    return () => { mounted = false; };
  }, [complaintId, getAuthHeaders]);

  if (!complaintId) return null;
  if (loading) return <div className="text-sm text-slate-500">Loading replies...</div>;
  if (replies.length === 0) return <div className="text-sm text-slate-500">No replies yet.</div>;

  return (
    <div className="space-y-3 max-h-48 overflow-y-auto">
      {replies.map(r => (
        <div key={r.id} className={`p-3 rounded-lg text-sm ${r.isAdminReply ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className="font-medium text-slate-800 whitespace-pre-wrap">{r.content}</p>
          <p className="text-xs text-slate-600 mt-1">{r.createdBy ? `${r.createdBy} • ` : ''}{new Date(r.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
