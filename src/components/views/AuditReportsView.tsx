import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { Download } from 'lucide-react';

export const AuditReportsView: React.FC = () => {
  const { auditLogs } = useFta();

  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [rahulOnly, setRahulOnly] = useState<boolean>(false);

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  const filteredLogs = auditLogs.filter((log) => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (rahulOnly) {
      return (
        log.entityId.includes('1001') ||
        log.referenceId.includes('1001') ||
        log.description.toLowerCase().includes('rahul')
      );
    }
    return true;
  });

  const handleExportAuditCsv = () => {
    const headers = [
      'AuditID',
      'Timestamp',
      'EventType',
      'Module',
      'ActorName',
      'ActorRole',
      'EntityID',
      'ReferenceID',
      'OldValue',
      'NewValue',
      'SourceSystem',
      'Description',
    ];
    const rows = filteredLogs.map((l) =>
      [
        l.id,
        `"${l.timestamp}"`,
        l.eventType,
        `"${l.module}"`,
        `"${l.actorName}"`,
        `"${l.actorRole}"`,
        l.entityId,
        l.referenceId,
        `"${l.oldValue.replace(/"/g, '""')}"`,
        `"${l.newValue.replace(/"/g, '""')}"`,
        `"${l.source}"`,
        `"${l.description.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FTA_Audit_History_2026_10.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Apple-Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Immutable Event Log · {auditLogs.length} Events
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Audit Trail
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setRahulOnly((prev) => !prev)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              rahulOnly
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {rahulOnly ? 'Showing Rahul Only' : 'Rahul Journey'}
          </button>

          <button
            onClick={handleExportAuditCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setModuleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                moduleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({auditLogs.length})
            </button>
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  moduleFilter === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">Before</th>
                <th className="py-3 px-6">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-6 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {log.eventType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">
                      {log.actorName.split(' (')[0]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {log.referenceId}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {log.oldValue}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] font-bold text-emerald-700">
                    {log.newValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
