import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ComplaintRepliesForCitizen } from './ComplaintRepliesForCitizen';

const API_BASE = "http://localhost:8080/api";

type Note = { id: number; content: string; createdAt: string; createdBy?: string; isPrivate?: boolean; };

export const ComplaintNotesForAdmin: React.FC<{ complaintId: number | null }> = ({ complaintId }) => {
  const { getAuthHeaders } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!complaintId) return;
    let mounted = true;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/complaints/${complaintId}/notes`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(await res.text());
        const data: Note[] = await res.json();
        if (!mounted) return;
        // only internal/private notes for admins
        setNotes(data.filter(n => n.isPrivate !== false));
      } catch (err: any) {
        toast.error('Failed to load internal notes');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchNotes();
    return () => { mounted = false; };
  }, [complaintId, getAuthHeaders]);

  if (!complaintId) return null;
  if (loading) return <div className="text-sm text-slate-500">Loading internal notes...</div>;
  if (notes.length === 0) return <div className="text-sm text-slate-500">No internal notes yet.</div>;

  return (
    <div className="space-y-3">
      {notes.map(n => (
        <div key={n.id} className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
          <p className="font-medium text-slate-800 whitespace-pre-wrap">{n.content}</p>
          <p className="text-slate-500 mt-1 text-xs">
            {n.createdBy ? `${n.createdBy} • ` : ''}{new Date(n.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};