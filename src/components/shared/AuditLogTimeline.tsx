'use client';

import { useEffect, useState } from 'react';

export default function AuditLogTimeline({ entity, entityId }: { entity: string, entityId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audit?entity=${entity}&entityId=${entityId}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data || []);
        setLoading(false);
      });
  }, [entity, entityId]);

  if (loading) return <div className="text-gray-400 text-sm py-4">이력을 불러오는 중...</div>;
  if (logs.length === 0) return <div className="text-gray-500 text-sm py-4">변경 이력이 없습니다.</div>;

  return (
    <div className="space-y-4 mt-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
      {logs.map((log) => (
        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-800 text-slate-400 group-[.is-active]:text-indigo-400 group-[.is-active]:border-indigo-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
            {log.action === 'CREATE' ? '➕' : log.action === 'UPDATE' ? '✏️' : '🗑️'}
          </div>
          
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-slate-200 text-sm">{log.action}</div>
              <time className="text-xs font-medium text-indigo-400">{new Date(log.createdAt).toLocaleString()}</time>
            </div>
            <div className="text-slate-400 text-sm mt-2">
              <span className="text-white font-medium">작업자:</span> {log.actorId} <br/>
              <span className="text-white font-medium">사유:</span> {log.reason || '없음'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
