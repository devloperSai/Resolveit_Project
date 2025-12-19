// src/hooks/useReportService.ts

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Report, ReportFormData, ReportValidation } from '../types/report.types';
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:8080/api";

export const useReportService = () => {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (data: ReportFormData): Promise<Report | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('complaintId', data.complaintId.toString());
      formData.append('officerEmail', data.officerEmail);
      formData.append('officerName', data.officerName);
      formData.append('actionTaken', data.actionTaken);
      
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.recommendations) {
        formData.append('recommendations', data.recommendations);
      }
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const res = await fetch(`${API_BASE}/reports/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit report');
      }

      const report = await res.json();
      toast.success('Report submitted successfully!', {
        duration: 4000,
        icon: '✅',
      });

      return report;
    } catch (err: any) {
      const message = err.message || 'Failed to submit report';
      setError(message);
      toast.error(message, {
        duration: 5000,
        icon: '❌',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkReportExists = async (complaintId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/reports/exists/${complaintId}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) return false;

      const data = await res.json();
      return data.exists || false;
    } catch (err) {
      console.error('Error checking report existence:', err);
      return false;
    }
  };

  const getReportByComplaint = async (complaintId: number): Promise<Report | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reports/complaint/${complaintId}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch report');
      }

      const report = await res.json();
      return report;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validateResolution = async (complaintId: number): Promise<ReportValidation> => {
    try {
      const res = await fetch(`${API_BASE}/reports/validate-resolution/${complaintId}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        canResolve: false,
        message: 'Failed to validate resolution',
      };
    }
  };

  return {
    loading,
    error,
    submitReport,
    checkReportExists,
    getReportByComplaint,
    validateResolution,
  };
};