"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, ChevronDown, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function SettlementsPage() {
  const [showDetails, setShowDetails] = useState(false);
  const { data: settlementData, error } = useSWR('/api/settlements', fetcher, { suspense: true, fallbackData: {} });

  if (error) {
    throw new Error("Failed to load settlement data");
  }

  const data = settlementData as any;

  const breakdown = [
    { label: "Total Revenue (100%)", amount: `${data?.totalRevenue} ₩`, type: "base" },
    { label: "Platform Fee (Company)", amount: `-${data?.platformFee} ₩`, type: "deduction" },
    { label: "Branch Manager Override", amount: `-${data?.branchOverride} ₩`, type: "deduction" },
    { label: "Division Head Override", amount: `-${data?.divisionOverride} ₩`, type: "deduction" },
    { label: "Team Leader Override", amount: `-${data?.teamOverride} ₩`, type: "deduction" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pt-24 p-6 font-sans">
      {/* Background Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg flex flex-col items-center"
      >
        <div className="flex items-center gap-2 text-emerald-400 mb-6 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide uppercase">Settlement {data?.status}</span>
        </div>

        <h2 className="text-slate-400 text-lg font-medium mb-2 text-center">Your Take-home Pay</h2>
        
        {/* Huge Typography with Glassmorphism Glow */}
        <div className="relative mb-12 w-full flex justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full" />
          <div className="relative glass-panel bg-slate-900/40 border border-white/10 backdrop-blur-2xl rounded-[3rem] px-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full flex justify-center items-center">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-400 drop-shadow-sm tracking-tighter">
              {data?.netEarnings}<span className="text-4xl md:text-5xl font-bold ml-2 text-emerald-500/80">₩</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md"
        >
          <Receipt className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">View Settlement Details</span>
          <motion.div
            animate={{ rotate: showDetails ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100" />
          </motion.div>
        </button>

        {/* Progressive Disclosure Receipt */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full overflow-hidden"
            >
              <div className="glass-panel bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                <div className="space-y-4">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-slate-400 text-sm md:text-base font-medium">{item.label}</span>
                      <span className={`font-mono text-base md:text-lg ${item.type === 'deduction' ? 'text-red-400' : 'text-slate-200'}`}>
                        {item.amount}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4 mt-2 border-t border-dashed border-white/20 flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Net Earnings</span>
                    <span className="font-mono text-2xl text-emerald-400 font-bold">{data?.netEarnings} ₩</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
