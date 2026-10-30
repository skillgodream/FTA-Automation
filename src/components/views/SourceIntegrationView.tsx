import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  RefreshCw,
  Upload,
  Loader2,
  FileSpreadsheet,
  Wrench,
  ArrowRight,
} from 'lucide-react';

export const SourceIntegrationView: React.FC = () => {
  const {
    connectors,
    sourceRecords,
    employees,
    syncSourceConnector,
    importRegionalTrainerCsv,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState<string>('ALL');
  const [empFilter, setEmpFilter] = useState<string>('ALL');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>(
    `EMP-1005,2026-10-26,Pune,Local,Pune West Franchise Training Batch #19\nEMP-1005,2026-10-27,Pune,Local,Kothrud Partner Onboarding Workshop #20`
  );
  const [importingCsv, setImportingCsv] = useState<boolean>(false);

  const handleSyncNow = async (connId: string) => {
    setSyncingId(connId);
    try {
      await syncSourceConnector(connId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedRows = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        employeeId: parts[0] || 'EMP-1005',
        date: parts[1] || '2026-10-26',
        city: parts[2] || 'Pune',
        meetingCategory: parts[3] || 'Local',
        clientName: parts[4] || 'Regional Trainer Workshop',
      };
    });

    setImportingCsv(true);
    try {
      await importRegionalTrainerCsv(parsedRows);
      setShowCsvModal(false);
    } finally {
      setImportingCsv(false);
    }
  };

  const holdCount = sourceRecords.filter(
    (r) => r.syncStatus !== 'Synced'
  ).length;

  const filteredRecords = sourceRecords.filter((rec) => {
    if (toolFilter === 'HOLDS' && rec.syncStatus === 'Synced') return false;
    if (
      toolFilter !== 'ALL' &&
      toolFilter !== 'HOLDS' &&
      rec.sourceTool !== toolFilter
    ) {
      return false;
    }
    if (empFilter !== 'ALL' && rec.employeeId !== empFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-[#6B7280]">
            Automated Feed from Prowl, LMS & Regional Trainer CSV
          </div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Meeting Sync
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCsvModal((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#E5E7EB] rounded-full hover:bg-[#F4F5F7] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Trainer CSV</span>
          </button>

          <button
            onClick={() => setActiveSection(NavSection.RATE_CITY_MASTER)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-[#1F2937] transition-colors cursor-pointer"
          >
            <span>Configure Rate Card</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sleek Hold Strip when records are held */}
      {holdCount > 0 && (
        <div className="px-5 py-3.5 rounded-[22px] border border-[#E4CCBD] bg-white flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#B85D2B] shrink-0" />
            <div className="text-xs font-semibold text-[#111827]">
              {holdCount} Prowl Meetings Held (PRW-8841, PRW-8842) · Rahul
              Sharma (EMP-1001)
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setToolFilter('HOLDS')}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#111827] bg-[#F4F5F7] hover:bg-[#E5E7EB] rounded-full cursor-pointer"
            >
              Filter Held ({holdCount})
            </button>
            <button
              onClick={() => {
                setActiveRole(UserRole.BA);
                setActiveSection(NavSection.BA_DISPUTES);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full cursor-pointer"
            >
              <Wrench className="w-3 h-3" />
              <span>Resolve Held Meetings</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Compact Apple Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {connectors.map((conn) => {
          const isSyncing = syncingId === conn.id;
          const hasHolds = conn.recordsFailed > 0;
          return (
            <div
              key={conn.id}
              className={`rounded-2xl p-4 bg-white border flex flex-col justify-between gap-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] ${
                hasHolds ? 'border-amber-300/90' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">
                    {conn.toolType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      hasHolds ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasHolds ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    {hasHolds ? `${conn.recordsFailed} Held` : 'Auto-Pulled'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Pulled</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {conn.recordsFetched}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Eligible</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      {conn.recordsSuccessful}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Held</div>
                    <div
                      className={`text-base font-bold font-mono mt-0.5 ${
                        hasHolds ? 'text-amber-700' : 'text-slate-400'
                      }`}
                    >
                      {conn.recordsFailed}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {conn.lastSyncTime}
                </span>
                {conn.toolType === 'Google Sheet CSV' ? (
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload CSV</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSyncNow(conn.id)}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Pull Now</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CSV Modal */}
      {showCsvModal && (
        <form
          onSubmit={handleImportCsv}
          className="bg-white border border-blue-300 rounded-2xl p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              Regional Trainer CSV (Meera Krishnan · EMP-1005)
            </h3>
            <button
              type="button"
              onClick={() => setShowCsvModal(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
          <textarea
            rows={2}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={importingCsv}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Import Rows
            </button>
          </div>
        </form>
      )}

      {/* Records Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'ALL', label: `All (${sourceRecords.length})` },
              { id: 'HOLDS', label: `Held (${holdCount})` },
              { id: 'Prowl', label: 'Prowl' },
              { id: 'LeadSquared', label: 'LeadSquared' },
              { id: 'Google Sheet CSV', label: 'CSV' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setToolFilter(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  toolFilter === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : t.id === 'HOLDS' && holdCount > 0
                    ? 'text-amber-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-xl text-slate-800"
          >
            <option value="ALL">All 5 Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-400">
              <tr>
                <th className="py-2.5 px-5">ID</th>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Date · City</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Client</th>
                <th className="py-2.5 px-5">Auto-Pull Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className={
                    rec.syncStatus !== 'Synced'
                      ? 'bg-amber-50/40'
                      : 'hover:bg-slate-50/80'
                  }
                >
                  <td className="py-3 px-5 font-mono font-semibold text-slate-900">
                    {rec.externalRefId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {rec.employeeName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {rec.date} · {rec.city}
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {rec.meetingCategory}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rec.clientName}</td>
                  <td className="py-3 px-5">
                    {rec.syncStatus === 'Synced' ? (
                      <span className="font-semibold text-emerald-700">
                        Auto-Pulled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Held</span>
                      </span>
                    )}
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
