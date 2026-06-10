import { MapPin, Clock, CheckCircle, ShieldCheck, Fingerprint, Lock } from "lucide-react";
import Image from "next/image";

interface VerifiedListingProps {
  address: string;
  timestamp: string;
  gpsCoords: string;
  imageUrl: string;
}

export default function VerifiedListing({
  address = "서울시 강남구 테헤란로 123",
  timestamp = "2026-06-10 14:30:22",
  gpsCoords = "37.498095, 127.027610",
  imageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
}: Partial<VerifiedListingProps>) {
  // Generate a consistent pseudo-hash based on props for the tamper-proof look
  const hashString = address + timestamp + gpsCoords;
  let hashNum = 0;
  for (let i = 0; i < hashString.length; i++) {
    hashNum = ((hashNum << 5) - hashNum) + hashString.charCodeAt(i);
    hashNum |= 0;
  }
  const displayHash = Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/10 group relative">
      <div className="absolute top-3 left-3 z-10 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.4)] border border-green-400/50">
        <ShieldCheck className="w-3.5 h-3.5" /> 
        <span>현장 검증 완료</span>
      </div>
      
      <div className="relative h-48 w-full overflow-hidden bg-gray-800">
        <img 
          src={imageUrl} 
          alt="Property" 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-md">
              {address}
            </h3>
          </div>
          <div className="bg-blue-600/80 backdrop-blur-sm p-2 rounded-xl border border-white/20 shadow-[0_0_15px_rgba(37,99,235,0.4)] relative overflow-hidden group-hover:bg-blue-500 transition-colors">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
            <CheckCircle className="w-5 h-5 text-white relative z-10" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-slate-900/60 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-15deg]">
          <ShieldCheck className="w-40 h-40" />
        </div>

        <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5 relative z-10 hover:border-white/10 transition-colors">
          <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5 flex items-center gap-1">
              GPS Coordinates
            </p>
            <p className="text-sm text-slate-200 font-mono tracking-tight">{gpsCoords}</p>
          </div>
          <Lock className="w-4 h-4 text-slate-500 shrink-0 opacity-50" />
        </div>
        
        <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5 relative z-10 hover:border-white/10 transition-colors">
          <Clock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5 flex items-center gap-1">
              Verified Timestamp
            </p>
            <p className="text-sm text-slate-200 font-mono tracking-tight">{timestamp}</p>
          </div>
          <Lock className="w-4 h-4 text-slate-500 shrink-0 opacity-50" />
        </div>

        {/* Digital Signature Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono bg-black/60 py-2 rounded-lg border border-white/5 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
          <Fingerprint className="w-4 h-4 text-green-500/70" />
          <span className="opacity-80">SIGNATURE:</span>
          <span className="text-green-400/90 font-bold tracking-widest">{displayHash}</span>
        </div>
      </div>
      
      <div className="h-1 w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
      </div>
    </div>
  );
}
