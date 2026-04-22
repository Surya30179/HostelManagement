import { useState, useEffect } from "react";
import { Loader2, PlusCircle, History, UserCircle, MapPin, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import QRModal from "../components/QRModal";

export default function StudentDashboard() {
  const { user, login, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({ destination: "", purpose: "", exit_time: "", return_time: "" });
  const [qrCode, setQrCode] = useState(null);
  
  // Profile Setup State
  const [showProfileSetup, setShowProfileSetup] = useState(!user.department || !user.academic_year);
  const [department, setDepartment] = useState(user.department || "CSE");
  const [academicYear, setAcademicYear] = useState(user.academic_year || "1");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const BRANCHES = ["CSE", "AIDS", "MECH", "ECE", "CIVIL", "CSBS"];
  const YEARS = ["1", "2", "3", "4"];

  // Loading states
  const [isListLoading, setIsListLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsListLoading(true);
    try {
      const { data } = await api.get("/requests/my");
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    if (!showProfileSetup) {
      fetchRequests();
    }
  }, [showProfileSetup]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    try {
      const { data } = await api.put("/user/profile", { department, academic_year: academicYear });
      login(data.token, data.user);
      setShowProfileSetup(false);
    } catch(err) {
      setProfileError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/request", formData);
      setFormData({ destination: "", purpose: "", exit_time: "", return_time: "" });
      fetchRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED": return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold uppercase tracking-wide border border-green-200 flex items-center gap-1 w-max"><CheckCircle2 className="w-3.5 h-3.5"/> Approved</span>;
      case "REJECTED": return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold uppercase tracking-wide border border-red-200 flex items-center gap-1 w-max"><XCircle className="w-3.5 h-3.5"/> Rejected</span>;
      default: 
        let display = status.replace("PENDING_", "");
        if (display === "COORD") display = "COORDINATOR";
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-semibold uppercase tracking-wide border border-yellow-200 flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> PENDING {display}</span>;
    }
  };

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          <div className="flex flex-col items-center text-center mb-6">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
               <UserCircle size={32} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Complete Profile</h2>
             <p className="text-slate-500 text-sm mt-1">Select your branch and year to continue.</p>
          </div>
          
          {profileError && <p className="text-red-600 text-sm mb-4 text-center">{profileError}</p>}
          
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" value={department} onChange={e=>setDepartment(e.target.value)}>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Academic Year</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" value={academicYear} onChange={e=>setAcademicYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <button disabled={profileSaving} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center mt-6 shadow-md shadow-blue-500/20">
              {profileSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm">H</div>
          Hostel Pass
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
             <div className="text-sm font-bold text-slate-800">{user.name}</div>
             <div className="text-xs font-medium text-slate-500">{user.department} • Year {user.academic_year}</div>
          </div>
          <button onClick={logout} className="text-sm font-medium bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded transition shadow-sm">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-8 grid lg:grid-cols-3 gap-8">
        
        {/* Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <PlusCircle className="w-5 h-5 text-blue-600" /> New Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex gap-1.5 items-center"><MapPin className="w-3.5 h-3.5"/> Destination</label>
                <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex gap-1.5 items-center"><FileText className="w-3.5 h-3.5"/> Purpose</label>
                <textarea required className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors h-24 resize-none"
                  value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex gap-1.5 items-center"><Clock className="w-3.5 h-3.5"/> Exit</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.exit_time} onChange={(e) => setFormData({...formData, exit_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex gap-1.5 items-center"><Clock className="w-3.5 h-3.5"/> Return</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.return_time} onChange={(e) => setFormData({...formData, return_time: e.target.value})} />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">My Requests</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-100">Details</th>
                    <th className="px-6 py-4 border-b border-gray-100">Schedule</th>
                    <th className="px-6 py-4 border-b border-gray-100">Status</th>
                    <th className="px-6 py-4 border-b border-gray-100 text-right">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isListLoading ? (
                    // Skeleton state
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-slate-100 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-slate-100 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        No requests found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{req.destination}</div>
                          <div className="text-xs text-slate-500 max-w-[150px] truncate" title={req.purpose}>{req.purpose}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">
                          <div><span className="font-semibold text-slate-400">OUT:</span> {new Date(req.exit_time).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                          <div className="mt-1"><span className="font-semibold text-slate-400">IN:</span> {new Date(req.return_time).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === "APPROVED" && req.qr_code && (
                            <button 
                              onClick={() => setQrCode(req.qr_code)}
                              className="text-white font-medium text-sm transition bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"
                            >
                              View Pass
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <QRModal qrCode={qrCode} onClose={() => setQrCode(null)} />
    </div>
  );
}
