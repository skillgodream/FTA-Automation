import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import {
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

export const SourceIntegrationView: React.FC = () => {
  const {
    connectors,
    sourceRecords,
    employees,
    syncSourceConnector,
    importRegionalTrainerCsv,
  } = useFta();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState<string>('ALL');
  const [empFilter, setEmpFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>(
    `EMP-1019,2026-10-26,Pune,Local,Pune West Franchise Training Batch #13\nEMP-1020,2026-10-27,Bengaluru,Local,Whitefield Partner Enablement Session #15`
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
        employeeId: parts[0] || 'EMP-1019',
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

  const filteredRecords = sourceRecords.filter((rec) => {
    if (toolFilter !== 'ALL' && rec.sourceTool !== toolFilter) return false;
    if (empFilter !== 'ALL' && rec.employeeId !== empFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rec.externalRefId.toLowerCase().includes(q) ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.employeeId.toLowerCase().includes(q) ||
        rec.city.toLowerCase().includes(q) ||
        rec.clientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Simulated Enterprise Connectors · Prowl & LeadSquared APIs · Regional Trainer CSV Exception Bridge
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Source Data & Integration Centre
          </h1>
        </div>

        <button
          onClick={() => setShowCsvModal((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Regional Trainer Google Sheet CSV</span>
        </button>
      </div>

      {/* 3 Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {connectors.map((conn) => {
          const isSyncing = syncingId === conn.id;
          return (
            <div
              key={conn.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-700">
                    {conn.toolType}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Simulated Integration
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {conn.name}
                </h2>

                <div className="flex items-center gap-1.5 text-xs mt-1.5">
                  {conn.recordsFailed > 0 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  )}
                  <span
                    className={`font-medium ${
                      conn.recordsFailed > 0
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">Fetched</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900">
                      {conn.recordsFetched}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Successful</div>
                    <div className="font-mono tabular-nums font-bold text-emerald-700">
                      {conn.recordsSuccessful}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Holds/Errors</div>
                    <div
                      className={`font-mono tabular-nums font-bold ${
                        conn.recordsFailed > 0
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {conn.recordsFailed}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Last Sync: {conn.lastSyncTime}
                </span>
                {conn.toolType === 'Google Sheet CSV' ? (
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSyncNow(conn.id)}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>SYNC NOW</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Trainer Google Sheet CSV Import Drawer */}
      {showCsvModal && (
        <div className="bg-white border border-blue-300 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Regional Trainers — Google Sheet CSV Import (Exception Workflow)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format: <code className="font-mono">EmployeeID, YYYY-MM-DD, City, Category (Local|Outstation|New Launch), Description</code>
              </p>
            </div>
            <button
              onClick={() => setShowCsvModal(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleImportCsv} className="space-y-3">
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Importing automatically updates source records and recalculates
                Regional Trainer statements (EMP-1019, EMP-1020).
              </span>
              <button
                type="submit"
                disabled={importingCsv}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {importingCsv ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Import CSV & Recalculate Statements</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Source Activity Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Source Meeting & Travel Activity Ledger ({filteredRecords.length}{' '}
              records)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes synced meetings and unsynced source holds (such as PRW-8841 and PRW-8842 for Rahul Sharma).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ref ID, Employee, City..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={empFilter}
              onChange={(e) => setEmpFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="ALL">All 20 Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {e.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {['ALL', 'Prowl', 'LeadSquared', 'Google Sheet CSV'].map((t) => (
                <button
                  key={t}
                  onClick={() => setToolFilter(t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    toolFilter === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'All Sources' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">City · Tier</th>
                <th className="py-3 px-3">Category · Mode</th>
                <th className="py-3 px-3">Client / Session Detail</th>
                <th className="py-3 px-3">Source Tool</th>
                <th className="py-3 px-4">Sync & Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className={
                    rec.syncStatus !== 'Synced'
                      ? 'bg-amber-50/50 hover:bg-amber-50'
                      : 'hover:bg-slate-50/80'
                  }
                >
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {rec.externalRefId}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-slate-900">
                      {rec.employeeName}
                    </span>
                    <span className="block text-[11px] font-mono text-slate-500">
                      {rec.employeeId} · {rec.department}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    {rec.date}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {rec.city} ({rec.cityCategory})
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="font-medium text-slate-900">
                      {rec.meetingCategory}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {rec.vehicleMode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <div>{rec.clientName}</div>
                    <div className="text-[11px] text-slate-500">{rec.notes}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {rec.sourceTool}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`font-semibold ${
                        rec.syncStatus === 'Synced'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {rec.syncStatus}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {rec.sourceStatus}
                      {rec.ticketRef !== 'NONE' ? ` · ${rec.ticketRef}` : ''}
                    </span>
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
