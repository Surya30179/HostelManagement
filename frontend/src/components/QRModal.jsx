import { QRCodeSVG } from "qrcode.react";

export default function QRModal({ qrCode, onClose }) {
  if (!qrCode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 w-full max-w-sm rounded-2xl shadow-xl p-8 flex flex-col items-center animate-[slideIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-800">Your Outing Pass</h3>
        <p className="text-slate-500 text-sm text-center mt-1 mb-6">Show this to the security guard at the gate.</p>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
          <QRCodeSVG value={qrCode} size={220} bgColor="#ffffff" fgColor="#0f172a" />
        </div>
        
        <p className="text-slate-600 font-mono text-xs tracking-wider mb-8 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          {qrCode}
        </p>
        
        <button 
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors border border-gray-300 shadow-sm" 
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

