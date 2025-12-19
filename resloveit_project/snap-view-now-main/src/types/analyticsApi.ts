// src/api/analyticsApi.ts
import { DashboardStats, CategoryDistribution, OfficerWorkload, TrendData } from '../types';

const API_BASE = "http://localhost:8080/api";

export const analyticsApi = {
  // Get dashboard statistics
  getDashboardStats: async (token: string): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
  },

  // Get category distribution
  getCategoryDistribution: async (token: string): Promise<CategoryDistribution[]> => {
    const res = await fetch(`${API_BASE}/analytics/categories`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch category data");
    return res.json();
  },

  // Get priority distribution
  getPriorityDistribution: async (token: string) => {
    const res = await fetch(`${API_BASE}/analytics/priorities`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch priority data");
    return res.json();
  },

  // Get officer workload
  getOfficerWorkload: async (token: string): Promise<OfficerWorkload[]> => {
    const res = await fetch(`${API_BASE}/analytics/officer-workload`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch officer workload");
    return res.json();
  },

  // Get trend data
  getTrendData: async (token: string, days: number = 30): Promise<TrendData[]> => {
    const res = await fetch(`${API_BASE}/analytics/trends?days=${days}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch trend data");
    return res.json();
  },
};