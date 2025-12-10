// src/api/slaApi.ts
import { SLAMetrics } from '.';

const API_BASE = "http://localhost:8080/api";

export const slaApi = {
  // Get SLA metrics
  getMetrics: async (token: string): Promise<SLAMetrics> => {
    const res = await fetch(`${API_BASE}/sla/metrics`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch SLA metrics");
    return res.json();
  },

  // Trigger manual escalation
  triggerEscalation: async (token: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/sla/escalate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to trigger escalation");
    return res.text();
  },

  // Get SLA configuration
  getConfig: async (token: string) => {
    const res = await fetch(`${API_BASE}/sla/config`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch SLA config");
    return res.json();
  },
};