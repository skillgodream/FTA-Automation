import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { Download, Search, ShieldCheck } from 'lucide-react';

export const AuditReportsView: React.FC = () => {
  const { auditLogs } = useFta();

  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  const filteredLogs = auditLogs.filter((log) => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.eventType.toLowerCase().includes(q) ||
        log.referenceId.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.oldValue.toLowerCase().includes(q) ||
        log.newValue.toLowerCase().includes(q)
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
    a.download = `FTA_Immutable_Audit_Trail_2026_10.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Append-Only Event History · Old Value vs New Value · Actor, Timestamp & Ticket Traceability
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Audit Trail & Compliance Reports
          </h1>
        </div>

        <button
          onClick={handleExportAuditCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log CSV ({filteredLogs.length} Events)</span>
        </button>
      </div>

      {/* Immutable Governance Banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Immutable Append-Only Ledger:</strong> Firestore security
            rules enforce <code className="font-mono">allow update, delete: if false</code> on{' '}
            <code className="font-mono">/audit_logs</code>. Every sync,
            calculation, dispute, source correction, HR lock, and payout is
            permanently recorded.
          </span>
        </div>

        <button
          onClick={() => setSearchQuery('1001')}
          className="text-blue-600 font-medium hover:underline shrink-0 cursor-pointer"
        >
          Filter Rahul Sharma (EMP-1001 / FTA-2026-1042)
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => setModuleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                moduleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Modules ({auditLogs.length})
            </button>
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  moduleFilter === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, EMP-1001, actor..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Event Type · Module</th>
                <th className="py-3 px-3">Actor · Role</th>
                <th className="py-3 px-3">Linked Reference</th>
                <th className="py-3 px-3">Previous Value (Old)</th>
                <th className="py-3 px-3">Updated Value (New)</th>
                <th className="py-3 px-4">Event Description & Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-semibold text-slate-900">
                      {log.eventType}
                    </div>
                    <div className="text-[11px] text-slate-500">{log.module}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-900">
                      {log.actorName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.actorRole}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                    <div>{log.referenceId}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Entity: {log.entityId}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {log.oldValue}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] font-semibold text-emerald-800">
                    {log.newValue}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{log.description}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Source: {log.source}
                    </div>
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
