"use client";

import { motion, Variants } from "framer-motion";
import { Bell, Search, Filter, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import VerifiedListing from "@/components/VerifiedListing";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useAppStore } from "@/lib/store";

export default function Dashboard() {
  const user = useAppStore(state => state.user);
  
  // SWR Hooks with suspense
  const { data: stats, error: statsError } = useSWR('/api/dashboard/stats', fetcher, { suspense: true, fallbackData: {} });
  const { data: activity, error: activityError } = useSWR('/api/dashboard/activity', fetcher, { suspense: true, fallbackData: [] });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (statsError || activityError) {
    throw new Error("Failed to load dashboard data");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-0 font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Mobile Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 py-4 md:hidden bg-slate-900/80 backdrop-blur-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.substring(0, 2).toUpperCase() || 'JD'}
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase">{user?.role || 'Agent'}</p>
              <h1 className="text-white font-bold">{user?.name || 'User'}</h1>
            </div>
          </div>
          <button className="glass-panel p-2 rounded-full relative border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
          </button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search listings, clients..." 
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 rounded-lg border border-white/5 hover:bg-slate-700 transition">
            <Filter className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative z-10"
      >
        {/* Desktop Header */}
        <motion.div variants={itemVariants} className="hidden md:flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
            <p className="text-slate-400 text-lg">Here's your performance overview for this month.</p>
          </div>
          <div className="flex gap-4">
            <button className="glass-panel px-5 py-2.5 rounded-xl text-white flex items-center gap-2 border border-white/10 hover:bg-white/5 transition">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-white font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-0.5">
              + New Listing
            </button>
          </div>
        </motion.div>

        {/* Quick Stats Carousel (Mobile) / Grid (Desktop) */}
        <motion.div variants={itemVariants} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          <StatCard title="Target Progress" value={(stats as any)?.progress} icon={<Activity className="w-5 h-5 text-blue-400"/>} trend={(stats as any)?.progressTrend} color="blue" />
          <StatCard title="Commission" value={(stats as any)?.commission} icon={<DollarSign className="w-5 h-5 text-emerald-400"/>} trend={(stats as any)?.commissionTrend} color="emerald" />
          <StatCard title="Active Listings" value={(stats as any)?.activeListings} icon={<TrendingUp className="w-5 h-5 text-purple-400"/>} trend={(stats as any)?.listingsTrend} color="purple" />
          <StatCard title="New Leads" value={(stats as any)?.newLeads} icon={<Users className="w-5 h-5 text-orange-400"/>} trend={(stats as any)?.leadsTrend} color="orange" />
        </motion.div>

        {/* Prominent Verified Listings Section */}
        <motion.div variants={itemVariants} className="mt-8 md:mt-12 bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px]" />
          
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Recent Verified Activity
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </h2>
              <p className="text-slate-400 mt-1 text-sm md:text-base">Listings with confirmed GPS and timestamp data</p>
            </div>
            <button className="hidden md:block text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All Activity →
            </button>
          </div>
          
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
          >
            {(activity as any)?.map((item: any, i: number) => (
              <motion.div key={item.id} variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className={i === 2 ? "hidden xl:block" : ""}>
                <VerifiedListing 
                  address={item.address}
                  timestamp={item.timestamp}
                  imageUrl={item.imageUrl}
                  gpsCoords={item.gpsCoords}
                />
              </motion.div>
            ))}
          </motion.div>
          
          <button className="w-full mt-6 py-3 md:hidden glass-panel border border-white/10 rounded-xl text-blue-400 font-semibold flex items-center justify-center gap-2">
            View All Activity
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const isPositive = trend?.startsWith('+');
  
  const colorMaps: Record<string, { bg: string, border: string, blur: string, shadow: string, hoverBlur: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', blur: 'bg-blue-500/10', hoverBlur: 'group-hover:bg-blue-500/20', shadow: 'shadow-blue-500/10' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', blur: 'bg-emerald-500/10', hoverBlur: 'group-hover:bg-emerald-500/20', shadow: 'shadow-emerald-500/10' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', blur: 'bg-purple-500/10', hoverBlur: 'group-hover:bg-purple-500/20', shadow: 'shadow-purple-500/10' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', blur: 'bg-orange-500/10', hoverBlur: 'group-hover:bg-orange-500/20', shadow: 'shadow-orange-500/10' }
  };
  
  const colorStyles = colorMaps[color as keyof typeof colorMaps] || colorMaps.blue;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="glass-panel p-5 md:p-6 rounded-2xl min-w-[240px] snap-center flex-1 border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-lg relative overflow-hidden group"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${colorStyles.blur} ${colorStyles.hoverBlur}`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl border ${colorStyles.bg} ${colorStyles.border} ${colorStyles.shadow} shadow-[0_0_10px_currentColor]`} style={{ color: "transparent" }}>
          <div className="flex items-center justify-center">
            {icon}
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1 relative z-10">{title}</p>
      <h3 className="text-3xl font-bold text-white tracking-tight relative z-10">{value}</h3>
    </motion.div>
  );
}
