import React, { useState, useEffect } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  ShieldAlert,
  Wrench,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Lock,
  Loader2,
  Database,
} from 'lucide-react';

export const BaDisputeWorkspaceView: React.FC = () => {
  const {
    disputes,
    sourceRecords,
    statements,
    updateDisputeStatus,
    simulateSourceCorrection,
    triggerTargetedReSync,
    setActiveSection,
    setActiveRole,
    setSelectedEmployeeId,
  } = useFta();

  const [selectedDisputeId, setSelectedDisputeId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [baFilter, setBaFilter] = useState<string>('ALL');
  const [notesInput, setNotesInput] = useState<string>('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Prefer Rahul Sharma's ticket (DSP-1042) if present, otherwise first dispute
  useEffect(() => {
    const rahulDsp = disputes.find((d) => d.employeeId === 'EMP-1001');
    if (rahulDsp) {
      setSelectedDisputeId(rahulDsp.id);
    } else if (disputes.length > 0 && !selectedDisputeId) {
      setSelectedDisputeId(disputes[0].id);
    }
  }, [disputes, selectedDisputeId]);

  const activeDispute =
    disputes.find((d) => d.id === selectedDisputeId) || disputes[0];

  useEffect(() => {
    if (activeDispute) {
      setNotesInput(activeDispute.resolutionNotes);
    }
  }, [activeDispute?.id, activeDispute?.resolutionNotes]);

  const uniqueBas = Array.from(new Set(disputes.map((d) => d.assignedBa)));

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (baFilter !== 'ALL' && d.assignedBa !== baFilter) return false;
    return true;
  });

  const empSourceRecords = activeDispute
    ? sourceRecords.filter((r) => r.employeeId === activeDispute.employeeId)
    : [];
  const unsyncedEmpRecords = empSourceRecords.filter(
    (r) => r.syncStatus !== 'Synced'
  );
  const linkedStmt = activeDispute
    ? statements.find((s) => s.id === activeDispute.statementId)
    : undefined;

  const handleSimulateCorrection = async () => {
    if (!activeDispute) return;
    setBusyAction('correct');
    try {
      await simulateSourceCorrection(activeDispute.id);
    } finally {
      setBusyAction(null);
    }
  };

  const handleTargetedReSync = async () => {
    if (!activeDispute) return;
    setBusyAction('resync');
    try {
      await triggerTargetedReSync(activeDispute.id);
    } finally {
      setBusyAction(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeDispute) return;
    setBusyAction(newStatus);
    try {
      await updateDisputeStatus(activeDispute.id, newStatus, notesInput);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Department & Region Auto-Routing · Source-Only Correction Governance · Targeted Re-Sync
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            BA Dispute Management Workspace
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={baFilter}
            onChange={(e) => setBaFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">All Assigned BAs ({disputes.length})</option>
            {uniqueBas.map((ba) => (
              <option key={ba} value={ba}>
                {ba}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[
              'ALL',
              'Open',
              'Under Review',
              'Clarification Required',
              'Approved',
              'Rejected',
              'Resolved',
            ].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Dispute Queue List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Routed Dispute Tickets ({filteredDisputes.length})
            </h2>
            <span className="text-xs text-slate-500">Click ticket to inspect</span>
          </div>

          <div className="divide-y divide-slate-200 flex-1 overflow-y-auto max-h-[680px]">
            {filteredDisputes.map((d) => {
              const isSelected = activeDispute?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDisputeId(d.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {d.ticketNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        d.status === 'Resolved'
                          ? 'text-emerald-700'
                          : d.status === 'Open'
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 mt-1">
                    {d.employeeName} ({d.employeeId})
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.designation} · {d.department} · {d.baseCity} · Source:{' '}
                    {d.sourceTool}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-600">
                      {d.claimType}: Sys {d.systemRecordedValue} vs Emp{' '}
                      {d.employeeReportedValue}
                    </span>
                    <span className="font-semibold text-slate-900">
                      Delta: +{d.disputedDelta} (₹{d.financialImpact})
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1">
                    Routed to: <span className="font-medium text-slate-700">{d.assignedBa}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Ticket Investigation & Source Correction Workbench */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
          {activeDispute ? (
            <>
              <div className="space-y-5">
                {/* Ticket Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-900">
                        {activeDispute.ticketNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Created {activeDispute.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>Assigned: {activeDispute.assignedBa}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {activeDispute.employeeName} — {activeDispute.claimType}{' '}
                      Discrepancy
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500">Ticket Status</div>
                    <div className="text-sm font-bold text-blue-700">
                      {activeDispute.status}
                    </div>
                  </div>
                </div>

                {/* Comparison Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">
                      System Recorded ({activeDispute.sourceTool})
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {activeDispute.systemRecordedValue} {activeDispute.claimType}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">
                      Employee Reported Figure
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-blue-700 mt-0.5">
                      {activeDispute.employeeReportedValue} {activeDispute.claimType}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">
                      Disputed Delta & Impact
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-amber-800 mt-0.5">
                      +{activeDispute.disputedDelta} (+₹
                      {activeDispute.financialImpact.toLocaleString('en-IN')})
                    </div>
                  </div>
                </div>

                {/* Employee Message & Gemini Interpretation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">
                      Employee Statement Reply:{' '}
                    </span>
                    <span className="text-slate-700 italic">
                      "{activeDispute.employeeMessage}"
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Gemini Dispute Classification:{' '}
                    </span>
                    {activeDispute.aiInterpretation}
                  </div>
                </div>

                {/* Strict Governance Rule Box: No Direct Manual Overwrite */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Governance Control: Direct Meeting Count Overwrite Disabled
                      </span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      Business Associates cannot manually edit tool-sourced
                      meeting counts inside the FTA platform. You must inspect and
                      fix the record in <strong>{activeDispute.sourceTool}</strong>{' '}
                      and trigger a <strong>Targeted Re-Sync</strong>.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <label className="block text-[10px] font-medium text-amber-900">
                      FTA Count (Locked)
                    </label>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-amber-300 rounded-md font-mono text-xs text-slate-500 cursor-not-allowed">
                      <Lock className="w-3 h-3" />
                      <span>
                        {linkedStmt?.eligibleLocalMeetings ??
                          activeDispute.systemRecordedValue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Source System Inspector */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {activeDispute.sourceTool} Source Record Inspector —{' '}
                        {activeDispute.employeeName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {empSourceRecords.filter((r) => r.syncStatus === 'Synced').length}{' '}
                      Synced · {unsyncedEmpRecords.length} Unsynced Hold(s)
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 text-xs">
                    {/* Show unsynced records first, then most recent synced records */}
                    {[
                      ...unsyncedEmpRecords,
                      ...empSourceRecords
                        .filter((r) => r.syncStatus === 'Synced')
                        .slice(-5),
                    ].map((rec) => (
                      <div
                        key={rec.id}
                        className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
                          rec.syncStatus !== 'Synced'
                            ? 'bg-amber-50/40'
                            : 'bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">
                              {rec.externalRefId}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-600">
                              {rec.date}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-800 truncate">
                              {rec.clientName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {rec.notes}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-medium ${
                              rec.syncStatus === 'Synced'
                                ? 'text-emerald-700'
                                : rec.sourceStatus === 'Corrected in Source'
                                ? 'text-blue-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {rec.sourceStatus}
                          </span>
                          <span className="block text-[11px] font-mono text-slate-500">
                            {rec.syncStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary 2-Step BA Source Correction & Targeted Re-Sync Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleSimulateCorrection}
                    disabled={
                      busyAction !== null ||
                      activeDispute.sourceCorrected ||
                      activeDispute.reSynced
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === 'correct' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : activeDispute.sourceCorrected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                    <span>
                      {activeDispute.sourceCorrected
                        ? `1. Source Corrected in ${activeDispute.sourceTool}`
                        : `1. SIMULATE SOURCE CORRECTION (${activeDispute.sourceTool})`}
                    </span>
                  </button>

                  <button
                    onClick={handleTargetedReSync}
                    disabled={
                      busyAction !== null ||
                      !activeDispute.sourceCorrected ||
                      activeDispute.reSynced
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === 'resync' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : activeDispute.reSynced ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>
                      {activeDispute.reSynced
                        ? `2. Re-Synced & Recalculated (₹${linkedStmt?.netAmount.toLocaleString('en-IN')})`
                        : '2. TRIGGER TARGETED RE-SYNC & RECALCULATE'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Footer Workflow Status Controls */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Manual Ticket Workflow State:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      'Open',
                      'Under Review',
                      'Clarification Required',
                      'Approved',
                      'Rejected',
                      'Resolved',
                    ].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        disabled={busyAction !== null}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                          activeDispute.status === st
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {activeDispute.reSynced && linkedStmt && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-emerald-950">
                      <strong>Recalculation Complete:</strong> {linkedStmt.employeeName}{' '}
                      updated to <strong>{linkedStmt.eligibleLocalMeetings} meetings</strong>{' '}
                      and <strong>₹{linkedStmt.netAmount.toLocaleString('en-IN')}</strong>.
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmployeeId(linkedStmt.employeeId);
                        setActiveRole(UserRole.HR);
                        setActiveSection(NavSection.HR_APPROVAL_LOCK);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Proceed to HR Approval & Lock</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
              No dispute tickets match the current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
