import { useState, useEffect } from "react";
import { Users, UserCog, Loader2 } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // For role updates
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const ROLES = ["STUDENT", "COORDINATOR", "HOD", "PRINCIPAL", "WARDEN", "SECURITY_GUARD", "ADMIN"];
  const BRANCHES = ["CSE", "AIDS", "MECH", "ECE", "CIVIL", "CSBS"];

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (id) => {
    setIsUpdating(true);
    try {
      await api.put(`/admin/user/${id}/role`, {
        role: newRole,
        telegram_chat_id: newChatId || null,
        department: newDepartment || null
      });
      setEditingId(null);
      await fetchUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (u) => {
    setEditingId(u.id);
    setNewRole(u.role);
    setNewChatId(u.telegram_chat_id || "");
    setNewDepartment(u.department || "CSE");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm"><UserCog size={18} /></div>
          Admin Panel
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm hidden sm:inline font-medium">{user.name}</span>
          <button onClick={logout} className="text-sm font-medium bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded transition shadow-sm">Logout</button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <Users className="w-6 h-6 text-blue-600" /> User Directory
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage system roles, assign departments, and configure Telegram notifications.</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm">
            Total Users: {users.length}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
             <p className="text-slate-500 text-sm font-medium">Fetching roster...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">User Name</th>
                  <th className="px-6 py-4 border-b border-gray-100">Email Address</th>
                  <th className="px-6 py-4 border-b border-gray-100">Assigned Role</th>
                  <th className="px-6 py-4 border-b border-gray-100">Department</th>
                  <th className="px-6 py-4 border-b border-gray-100">Telegram Chat ID</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-normal font-semibold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <select 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : u.role === 'STUDENT' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {u.role.replace("_", " ")}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === u.id && ["STUDENT", "COORDINATOR", "HOD", "WARDEN"].includes(newRole) ? (
                        <select 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                        >
                          <option value="">All/None</option>
                          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      ) : (
                        <span className="text-slate-600 text-xs font-semibold">{u.department || "—"}</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <input 
                          type="text" 
                          placeholder="Numeric ID"
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 w-32"
                          value={newChatId}
                          onChange={(e) => setNewChatId(e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">{u.telegram_chat_id || "—"}</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {editingId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleUpdate(u.id)}
                             disabled={isUpdating}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold shadow-sm disabled:opacity-50"
                           >
                             {isUpdating ? "..." : "Save"}
                           </button>
                           <button 
                             onClick={() => setEditingId(null)}
                             className="bg-white border border-gray-300 text-slate-600 hover:bg-slate-50 px-3 py-1 rounded text-xs font-semibold shadow-sm"
                           >
                             Cancel
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(u)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                        >
                          Edit
                        </button>
                      )}
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
