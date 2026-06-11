"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, CheckCircle2, TrendingUp, DollarSign, Briefcase, FileText } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function SettlementsPage() {
  const { data: settlementData, error } = useSWR('/api/settlements', fetcher, { suspense: true, fallbackData: {} });

  if (error) {
    throw new Error("Failed to load settlement data");
  }

  const data = settlementData as any;
  const netEarnings = parseInt(data?.netEarnings?.replace(/[^0-9]/g, '') || "0");
  const totalRevenue = parseInt(data?.totalRevenue?.replace(/[^0-9]/g, '') || "0");
  const platformFee = parseInt(data?.platformFee?.replace(/[^0-9]/g, '') || "0");

  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const ledgerEntries = [
    { id: "REV-001", account: "매출 (Gross Revenue)", description: "당월 중개 수수료 총액", amount: totalRevenue, type: "revenue" },
    { id: "FEE-001", account: "지급수수료 (Platform Fee)", description: "플랫폼 이용 및 본사 라이선스비", amount: platformFee, type: "expense" },
    { id: "OVR-001", account: "판매관리비 (지점장)", description: "지점장 오버라이딩 배분", amount: parseInt(data?.branchOverride?.replace(/[^0-9]/g, '') || "0"), type: "expense" },
    { id: "OVR-002", account: "판매관리비 (본부장)", description: "본부장 오버라이딩 배분", amount: parseInt(data?.divisionOverride?.replace(/[^0-9]/g, '') || "0"), type: "expense" },
    { id: "OVR-003", account: "판매관리비 (팀장)", description: "팀장 오버라이딩 배분", amount: parseInt(data?.teamOverride?.replace(/[^0-9]/g, '') || "0"), type: "expense" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans pt-24">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            정산 및 회계 장부 (General Ledger)
          </h1>
          <p className="text-slate-400 text-sm mt-1">공식 손익계산서(P&L) 및 월별 정산 내역서입니다.</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wider">STATUS: {data?.status}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">총 매출 (Gross)</span>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white">{formatKrw(totalRevenue)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">본사 수수료 (Fee)</span>
              <Receipt className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-red-400">-{formatKrw(platformFee)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-400">오버라이딩 (Overrides)</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-red-400">
              -{formatKrw(ledgerEntries.filter(e => e.id.startsWith('OVR')).reduce((a, b) => a + b.amount, 0))}
            </div>
          </div>
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full" />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-sm font-medium text-indigo-300">순수익 (Net Income)</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-indigo-400 relative z-10">{formatKrw(netEarnings)}</div>
          </div>
        </div>

        {/* Accounting Ledger Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              손익계산서 상세 내역 (P&L Breakdown)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">전표 번호 (Ref)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">계정과목 (Account)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">적요 (Description)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">차변 (Debit)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">대변 (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{entry.id}</td>
                    <td className="px-6 py-3 font-medium text-slate-200">{entry.account}</td>
                    <td className="px-6 py-3 text-slate-400">{entry.description}</td>
                    <td className="px-6 py-3 text-right font-mono">
                      {entry.type === 'expense' ? (
                        <span className="text-red-400">{formatKrw(entry.amount)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-mono">
                      {entry.type === 'revenue' ? (
                        <span className="text-emerald-400">{formatKrw(entry.amount)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800/30 border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold text-slate-300">당기순이익 (Net Income)</td>
                  <td colSpan={2} className="px-6 py-4 text-right">
                    <span className="text-lg font-bold tracking-wider text-indigo-400 border-double border-b-4 border-indigo-400/50 pb-1">
                      {formatKrw(netEarnings)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
