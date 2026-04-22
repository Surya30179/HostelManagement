import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ClipboardSignature } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function ApproverDashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null); // stores the req.id being processed

  const fetchPending = async () => {
    setIsListLoading(true);
    try {
      const { data } = await api.get("/requests/pending");
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    setProcessingAction(id);
    try {
      await api.post(`/request/${id}/${action}`);
      await fetchPending();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm">✓</div>
          Approvals <span className="text-slate-400 font-normal hidden sm:inline ml-2">· {user.role.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm hidden sm:inline font-medium">{user.name}</span>
          <button onClick={logout} className="text-sm font-medium bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded transition shadow-sm">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <ClipboardSignature className="w-6 h-6 text-blue-600" /> Pending Requests
            </h1>
            <p className="text-slate-500 text-sm mt-1">Passes requiring your authorization in the hierarchy.</p>
          </div>
          <div className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 shadow-sm">
            {requests.length} Pending
          </div>
        </div>

        {isListLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
             <p className="text-slate-500 text-sm font-medium">Fetching pending requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-slate-500 shadow-sm">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="text-xl font-bold text-slate-700 mb-1">All caught up!</p>
            <p className="text-sm">No requests await your approval at this time.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">Student</th>
                  <th className="px-6 py-4 border-b border-gray-100">Destination</th>
                  <th className="px-6 py-4 border-b border-gray-100">Purpose</th>
                  <th className="px-6 py-4 border-b border-gray-100">Schedule</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{req.student_name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{req.destination}</td>
                    <td className="px-6 py-4 text-slate-600 whitespace-normal max-w-xs">{req.purpose}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      <div><span className="font-semibold text-slate-400">OUT:</span> {new Date(req.exit_time).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                      <div className="mt-1"><span className="font-semibold text-slate-400">IN:</span> {new Date(req.return_time).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {processingAction === req.id ? (
                           <div className="px-4 py-2 flex items-center justify-center">
                             <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                           </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleAction(req.id, "approve")}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm('Are you sure you want to reject this pass?')) {
                                  handleAction(req.id, "reject");
                                }
                              }}
                              className="bg-white border border-gray-300 hover:bg-red-50 text-gray-700 hover:text-red-700 hover:border-red-200 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
