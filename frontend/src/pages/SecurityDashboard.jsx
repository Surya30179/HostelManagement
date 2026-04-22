import { useState } from "react";
import { QrReader } from "react-qr-reader";
import { Shield } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function SecurityDashboard() {
  const { user, logout } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  const handleScan = async (data) => {
    if (data && scanning) {
      setScanning(false);
      try {
        const res = await api.post("/scan", { qr_code: data });
        setScanResult(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "Invalid QR Code");
        setScanResult(null);
      }
      
      // Auto-resume scanning after 4 seconds
      setTimeout(() => setScanning(true), 4000);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError("Camera access denied or unavailable.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Security Gate
        </div>
        <button onClick={logout} className="text-sm font-medium bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded transition">Logout</button>
      </nav>

      <main className="max-w-md mx-auto px-6 mt-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
          
          <div className="p-4 bg-slate-50 border-b border-gray-200 text-center">
            <h2 className="text-lg font-bold text-slate-800">Scanner</h2>
            <p className="text-xs text-slate-500 mt-1">Scan student outgoing/incoming pass</p>
          </div>

          <div className="bg-slate-900 aspect-square relative">
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: "100%" }}
            />
            {!scanning && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-300">Processing scan...</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 h-48 bg-white">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <span className="text-red-500 text-xl">❌</span>
                <div>
                  <h3 className="text-red-700 font-semibold mb-1">Scan Failed</h3>
                  <p className="text-sm text-red-600/80">{error}</p>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                 <span className="text-emerald-500 text-xl">✅</span>
                 <div>
                   <h3 className="text-emerald-800 font-semibold mb-1">Pass Verified</h3>
                   <p className="text-sm text-emerald-700 mb-1"><strong>Student:</strong> {scanResult.student_name}</p>
                   <p className="text-sm text-emerald-700"><strong>Action:</strong> <span className="uppercase text-xs tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">{scanResult.action}</span> Recorded</p>
                 </div>
              </div>
            )}

            {!error && !scanResult && (
              <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-gray-200 rounded-lg bg-slate-50/50">
                <p>Waiting for QR Scan...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
