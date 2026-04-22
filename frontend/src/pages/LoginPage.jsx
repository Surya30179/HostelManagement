import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Info } from "lucide-react";
import api from "../api";

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      const { data } = await api.post("/google-login", {
        credential: credentialResponse.credential,
      });
      // Set to local storage and auth context
      login(data.token, data.user);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.error || `Connection Failed: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-sm">
            H
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Hostel Pass</h1>
          <p className="text-slate-500 text-sm">Please sign in with your official account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm flex items-start gap-2">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center w-full py-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError("Login Failed at the Google Provider level.");
            }}
            shape="rectangular"
            theme="filled_blue"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 bg-blue-50/50 p-4 rounded-lg">
          <h4 className="flex items-center gap-1.5 font-bold text-blue-800 text-sm mb-2">
            <Info className="w-4 h-4" /> Production Notice
          </h4>
          <p className="text-xs text-blue-700/80 leading-relaxed">
            This system now uses Single Sign-On (SSO). New users logging in will be automatically assigned the <strong>STUDENT</strong> role. 
            <br/><br/>
            Wait! Notice an error? The administrator must configure the <code>GOOGLE_CLIENT_ID</code> in both the frontend (<code>.env</code>) and backend configuration for SSO to activate.
          </p>
          <p className="text-[10px] text-gray-400 mt-2 break-all">API: {import.meta.env.VITE_API_URL || "localhost:5000 (fallback)"}</p>
        </div>
      </div>
    </div>
  );
}
