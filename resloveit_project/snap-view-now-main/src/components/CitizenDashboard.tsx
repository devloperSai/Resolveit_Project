import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Plus, X, ChevronRight, Upload, FileText, Clock, CheckCircle, AlertCircle, Download,
  MapPin, Loader2, Map
} from "lucide-react";
import { Header } from "./shared/Header";
import { Footer } from "./shared/Footer";
import { StatCard } from "./shared/StatCard";
import { ComplaintCard } from "./shared/ComplaintCard";
import { StatusStepper } from './shared/StatusStepper';
import { EnhancedComplaintModal } from './shared/EnhancedComplaintModal';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE = "http://localhost:8080/api";

export const CitizenDashboard: React.FC = () => {
  const { user, getAuthHeaders, logout } = useAuth(); // ✅ Added logout from AuthContext
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
 
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
 
  // Location fields
  const [locationType, setLocationType] = useState("manual");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
 
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Fetch complaints with proper auth check using getAuthHeaders
  useEffect(() => {
    if (!user?.email) {
      console.warn("⚠️ No user - skipping fetch");
      return;
    }
    fetchComplaints();
  }, [user?.email]);

const fetchComplaints = async () => {
  if (!user?.email) {
    console.warn("⚠️ No user - skipping fetch");
    return;
  }
  
  const headers = getAuthHeaders();
  
  if (!headers.Authorization) {
    console.error("❌ No auth headers found");
    setComplaints([]);
    return;
  }

  setLoading(true);
  
  try {
    const res = await fetch(
      `${API_BASE}/complaints/user?email=${user.email}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    if (res.status === 403 || res.status === 401) {
      console.error("🚫 Authentication failed");
      alert("Session expired. Please login again.");
      logout();
      return;
    }

    if (!res.ok) {
      console.error("Failed to fetch complaints:", res.status);
      return;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      setComplaints(data);
    } else {
      console.warn("Unexpected response format:", data);
      setComplaints([]);
    }
  } catch (error) {
    console.error("Error fetching complaints:", error);
    setComplaints([]);
  } finally {
    setLoading(false);
  }
};

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    setGettingLocation(true);
   
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
       
        setLatitude(lat);
        setLongitude(lon);
       
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();
         
          if (data.address) {
            setAddress(data.display_name || "");
            setCity(data.address.city || data.address.town || data.address.village || "");
            setState(data.address.state || "");
            setPincode(data.address.postcode || "");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }
       
        setGettingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        alert("Failed to get location. Please enter manually.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
   
    if (!title.trim()) newErrors.title = "Title is required";
    if (title.length < 10) newErrors.title = "Title must be at least 10 characters";
    if (!description.trim()) newErrors.description = "Description is required";
    if (description.length < 20) newErrors.description = "Description must be at least 20 characters";
   
    if (locationType === 'manual') {
      if (!address.trim()) newErrors.address = "Address is required";
      if (!city.trim()) newErrors.city = "City is required";
      if (!state.trim()) newErrors.state = "State is required";
      if (!pincode.trim()) newErrors.pincode = "Pincode is required";
      if (pincode && !/^\d{6}$/.test(pincode)) newErrors.pincode = "Invalid pincode format";
    } else {
      if (!latitude || !longitude) newErrors.location = "Please get current location";
    }
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
   
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;
   
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Only JPG, PNG, PDF allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name}: File too large. Max 5MB.`);
        return false;
      }
      return true;
    });
   
    if (attachments.length + validFiles.length > 5) {
      alert("Maximum 5 files allowed");
      return;
    }
   
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit complaint
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    alert("Please fix form errors");
    return;
  }

  if (!user?.email) {
    alert("Not authenticated");
    return;
  }

  setSubmitting(true);

  try {
    const formData = new FormData(); // ✅ Declare it here
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("isAnonymous", isAnonymous.toString());
    
    formData.append("address", address);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("pincode", pincode);
    formData.append("latitude", latitude || "");
    formData.append("longitude", longitude || "");
    
    attachments.forEach((file) => {
      formData.append("files", file);
    });

    const headers = getAuthHeaders(); // ✅ Get auth headers

    // ✅ FIXED: Use the multipart endpoint
    const res = await fetch(`${API_BASE}/complaints/submit-with-files?email=${user.email}`, {
      method: "POST",
      headers: headers, // ✅ Don't manually set Content-Type for FormData
      body: formData,
    });

    if (res.status === 403 || res.status === 401) {
      console.error("🚫 Authentication failed during submission");
      alert("Session expired. Please login again.");
      logout();
      return;
    }

    if (res.ok) {
      alert("✅ Complaint submitted successfully!");
      resetForm();
      setShowForm(false);
      setTimeout(fetchComplaints, 500);
    } else {
      const errorText = await res.text();
      throw new Error(errorText || "Submission failed");
    }
  } catch (error: any) {
    console.error("Submission error:", error);
    alert(`Failed: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Infrastructure");
    setIsAnonymous(false);
    setAttachments([]);
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setLatitude("");
    setLongitude("");
    setLocationType("manual");
    setErrors({});
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    resolved: complaints.filter(c => c.status === 'resolved').length
  };

  const selectedComplaintObj = selectedComplaint
    ? complaints.find((c) => String(c.id) === String(selectedComplaint)) || null
    : null;

  // PDF generation - Updated to include location fields
  const downloadComplaintPDF = async (c: any) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "width:800px;padding:24px;background:#fff;color:#111;font-family:Arial;position:fixed;left:-9999px;top:0;box-sizing:border-box";
    
    const safeTitle = (c.title || "-").replace(/</g, "&lt;");
    const safeDesc = (c.description || "-").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
    
    wrapper.innerHTML = `
      <div style="max-width:760px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <h2 style="margin:0 0 6px 0;font-size:20px;">Complaint ${c.id || "-"}</h2>
            <div style="color:#6b7280;font-size:13px;">Submitted: ${new Date(c.submittedAt).toLocaleString()}</div>
          </div>
          <div style="font-weight:700;background:#f3f4f6;padding:6px 12px;border-radius:9999px;">${(c.status || "pending").toString().toUpperCase()}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#374151;font-weight:600;font-size:12px;">Title</div>
          <div style="margin-top:6px;font-size:14px;color:#111827;">${safeTitle}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#374151;font-weight:600;font-size:12px;">Description</div>
          <div style="margin-top:6px;font-size:14px;color:#111827;line-height:1.4;">${safeDesc}</div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:12px;">
          <div>
            <div style="color:#374151;font-weight:600;font-size:12px;">Category</div>
            <div style="margin-top:6px;font-size:14px;color:#111827;">${c.category || "-"}</div>
          </div>
          <div>
            <div style="color:#374151;font-weight:600;font-size:12px;">Submitted By</div>
            <div style="margin-top:6px;font-size:14px;color:#111827;">${c.isAnonymous ? "Anonymous" : (c.submittedBy || user?.email || "-")}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:12px;">
          <div>
            <div style="color:#374151;font-weight:600;font-size:12px;">City</div>
            <div style="margin-top:6px;font-size:14px;color:#111827;">${c.city || "-"}</div>
          </div>
          <div>
            <div style="color:#374151;font-weight:600;font-size:12px;">State</div>
            <div style="margin-top:6px;font-size:14px;color:#111827;">${c.state || "-"}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#374151;font-weight:600;font-size:12px;">Address</div>
          <div style="margin-top:6px;font-size:14px;color:#111827;">${c.address || "-"}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#374151;font-weight:600;font-size:12px;">Attachments</div>
          <div style="margin-top:6px;font-size:14px;color:#111827;">${(c.attachments && c.attachments.length) ? c.attachments.join(", ") : "None"}</div>
        </div>

        <div style="margin-top:22px;font-size:12px;color:#6b7280;">Generated by ResolveIt — ${new Date().toLocaleString()}</div>
      </div>
    `;
    
    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(wrapper, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("portrait", "pt", "a4");
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 40; // margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
      
      // Handle multi-page if needed
      let heightLeft = imgHeight;
      let position = 0;
      
      if (heightLeft > pageHeight) {
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      const filename = `Complaint-${c.id || "unknown"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF failed:", err);
      alert("PDF generation failed");
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Header
        title="Citizen Portal"
        subtitle="File & Track Complaints"
        icon={<FileText className="w-6 h-6 text-white" />}
      />

      {/* ✅ User Info and Logout Section */}
      {user && (
        <div className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/default-avatar.png"
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total" value={stats.total} icon={<FileText className="w-6 h-6" />} color="blue" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="w-6 h-6" />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Submit New Complaint</h2>
                {showForm && <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>}
              </div>

              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  File Complaint
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                      <option>Infrastructure</option>
                      <option>Utilities</option>
                      <option>Public Safety</option>
                      <option>Sanitation</option>
                      <option>Transportation</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="Brief description"
                    />
                    {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none ${errors.description ? 'border-red-500' : ''}`}
                      placeholder="Detailed information..."
                    />
                    {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                  </div>

                  {/* Location */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />Location *
                    </label>
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setLocationType('manual')} className={`flex-1 py-2 rounded font-semibold transition-colors ${locationType === 'manual' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Manual</button>
                      <button type="button" onClick={() => setLocationType('current')} className={`flex-1 py-2 rounded font-semibold transition-colors ${locationType === 'current' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>GPS</button>
                    </div>
                    {locationType === 'current' && (
                      <button type="button" onClick={getCurrentLocation} disabled={gettingLocation} className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {gettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <Map className="w-5 h-5" />}
                        {gettingLocation ? " Getting..." : " Get Location"}
                      </button>
                    )}
                    {(latitude && longitude) && (
                      <div className="mt-2 text-sm text-slate-600">
                        <p><strong>Detected:</strong> Lat: {latitude}, Lon: {longitude}</p>
                      </div>
                    )}
                  </div>

                  {(locationType === 'manual' || (latitude && longitude)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Address *" 
                        className={`col-span-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${errors.address ? 'border-red-500' : ''}`} 
                      />
                      {errors.address && <p className="text-red-600 text-sm mt-1 col-span-full">{errors.address}</p>}
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        placeholder="City *" 
                        className={`px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${errors.city ? 'border-red-500' : ''}`} 
                      />
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                      <input 
                        type="text" 
                        value={state} 
                        onChange={(e) => setState(e.target.value)} 
                        placeholder="State *" 
                        className={`px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${errors.state ? 'border-red-500' : ''}`} 
                      />
                      {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                      <input 
                        type="text" 
                        value={pincode} 
                        onChange={(e) => setPincode(e.target.value)} 
                        placeholder="Pincode *" 
                        maxLength={6} 
                        className={`col-span-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${errors.pincode ? 'border-red-500' : ''}`} 
                      />
                      {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Attachments (Max 5, 5MB each)</label>
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Upload files</span>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {attachments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {attachments.map((file, i) => (
                          <div key={i} className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                            <button type="button" onClick={() => removeAttachment(i)} className="ml-2 text-red-500 hover:text-red-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input type="checkbox" id="anon" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-blue-600" />
                    <label htmlFor="anon" className="text-sm font-semibold cursor-pointer">Submit Anonymously</label>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Your Complaints</h2>
              {loading ? (
                <div className="text-center py-12"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" /></div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No complaints yet</p>
                  <button onClick={() => setShowForm(true)} className="text-blue-600 font-semibold flex items-center gap-1 mx-auto hover:text-blue-700">
                    File first complaint <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <ComplaintCard 
                      key={c.id} 
                      complaint={c} 
                      isSelected={selectedComplaint === String(c.id)} 
                      onSelect={(comp) => setSelectedComplaint(selectedComplaint === String(comp.id) ? null : String(comp.id))} 
                      showStatus 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="font-bold mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="flex items-start gap-2"><span className="font-bold text-blue-600">1️⃣</span> Fill complaint with location</p>
                <p className="flex items-start gap-2"><span className="font-bold text-blue-600">2️⃣</span> Upload supporting documents</p>
                <p className="flex items-start gap-2"><span className="font-bold text-blue-600">3️⃣</span> Admin assigns to officer</p>
                <p className="flex items-start gap-2"><span className="font-bold text-blue-600">4️⃣</span> Track status updates</p>
                <p className="flex items-start gap-2"><span className="font-bold text-blue-600">5️⃣</span> Get resolution confirmation</p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Need help?</p>
                <a href="mailto:support@resolveit.io" className="text-blue-600 font-semibold hover:text-blue-700">support@resolveit.io</a>
              </div>
            </div>
          </div>
        </div>
      </main>
{/* Detail Modal */}
{selectedComplaintObj && (
  <EnhancedComplaintModal
    complaint={selectedComplaintObj}
    onClose={() => setSelectedComplaint(null)}
    onDownloadPDF={downloadComplaintPDF}
  />
)}

      <Footer />
    </div>
  );
};