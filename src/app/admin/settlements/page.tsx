"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, ChevronDown, CheckCircle2, ShieldCheck, X, Server, Send } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

function PayoutModal({ isOpen, onClose, amount }: { isOpen: boolean; onClose: () => void; amount: string }) {
  const [step, setStep] = useState<"pin" | "processing" | "success">("pin");
  const [pin, setPin] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === "processing") {
      setProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 20 + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => setStep("success"), 600);
        }
        setProgress(p);
      }, 250);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      setStep("pin");
      setPin("");
      setProgress(0);
    }
  }, [isOpen]);

  const handleKey = (k: string) => {
    if (step !== "pin") return;
    if (k === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + k;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => setStep("processing"), 400);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={step === 'processing' ? undefined : onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl overflow-hidden glass-panel"
            onClick={e => e.stopPropagation()}
          >
            {/* Glossy top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold text-sm tracking-wide">OPEN BANKING API</span>
              </div>
              {step !== "processing" && (
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 relative min-h-[380px]">
              <AnimatePresence mode="wait">
                {step === "pin" && (
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center h-full absolute inset-0 p-6"
                  >
                    <h3 className="text-xl font-medium text-white mb-2">Authorize Payout</h3>
                    <p className="text-slate-400 text-sm mb-6 text-center">Enter your 4-digit PIN to transfer <strong className="text-white">{amount} ₩</strong></p>

                    {/* PIN Dots */}
                    <div className="flex gap-4 mb-8">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${i < pin.length ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-slate-600 bg-slate-800/50'}`} />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                          key={num}
                          onClick={() => handleKey(num.toString())}
                          className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors text-white font-medium text-lg flex items-center justify-center border border-white/5"
                        >
                          {num}
                        </button>
                      ))}
                      <div />
                      <button
                        onClick={() => handleKey('0')}
                        className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors text-white font-medium text-lg flex items-center justify-center border border-white/5"
                      >
                        0
                      </button>
                      <button
                        onClick={() => handleKey('del')}
                        className="h-12 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center h-full absolute inset-0 p-6"
                  >
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                      <div className="relative bg-slate-800 rounded-full p-4 border border-emerald-500/30">
                        <Server className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium text-white mb-2">Executing Transfer</h3>
                    <p className="text-slate-400 text-sm mb-8 text-center">Connecting to Open Banking Network...</p>
                    
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                        style={{ width: `${progress}%` }}
                        layout
                      />
                    </div>
                    <div className="w-full flex justify-between text-xs text-slate-500 font-mono">
                      <span>{Math.round(progress)}%</span>
                      <span>SECURE_NODE_TX</span>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                    className="flex flex-col items-center justify-center h-full absolute inset-0 p-6"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full" />
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                        className="relative bg-emerald-500 rounded-full p-4 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                      >
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </motion.div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Transfer Complete</h3>
                    <p className="text-emerald-400/80 mb-8 text-center text-sm">{amount} ₩ has been securely deposited to your account.</p>
                    
                    <button
                      onClick={onClose}
                      className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl font-medium transition-colors border border-white/10"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function SettlementsPage() {
  const [showDetails, setShowDetails] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
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

      <PayoutModal 
        isOpen={showPayoutModal} 
        onClose={() => setShowPayoutModal(false)} 
        amount={data?.netEarnings} 
      />

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

        <div className="flex flex-col sm:flex-row gap-4 w-full mb-8">
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex-1 group flex justify-center items-center gap-2 text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all border border-emerald-400/50 px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] font-bold text-lg"
          >
            <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            <span>[실시간 송금 집행]</span>
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-none group flex justify-center items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md"
            title="View Details"
          >
            <Receipt className="w-6 h-6" />
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </motion.div>
          </button>
        </div>

        {/* Progressive Disclosure Receipt */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full overflow-hidden"
            >
              <div className="glass-panel bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative mt-4">
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
