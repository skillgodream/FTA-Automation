import React, { useState, useEffect, useMemo } from 'react';
import { useFta } from '../../context/FtaContext';
import { DisputeTicket, NavSection, UserRole } from '../../types/fta';
import {
  Wrench,
  CheckCircle2,
  ArrowRight,
  Lock,
  Loader2,
  Database,
  Sparkles,
} from 'lucide-react';

export const BaDisputeWorkspaceView: React.FC = () => {
  const {
    employees,
    disputes,
    sourceRecords,
    statements,
    selectedEmployeeId,
    triggerTargetedReSync,
    setActiveSection,
    setActiveRole,
    setSelectedEmployeeId,
  } = useFta();

  const [selectedDisputeId, setSelectedDisputeId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [busy, setBusy] = useState<boolean>(false);

  const allDisputeItems: DisputeTicket[] = useMemo(() => {
    const hasRahulDispute = disputes.some((d) => d.employeeId === 'EMP-1001');
    if (hasRahulDispute) {
      return disputes;
    }

    const rahulEmp = employees.find((e) => e.id === 'EMP-1001');
    const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
    const rahulUnsynced = sourceRecords.filter(
      (r) => r.employeeId === 'EMP-1001' && r.syncStatus !== 'Synced'
    );

    if (rahulEmp && rahulStmt && rahulUnsynced.length > 0) {
      const virtualRahulDispute: DisputeTicket = {
        id: 'DSP-1042',
        ticketNumber: 'FTA-2026-1042',
        statementId: rahulStmt.id,
        employeeId: rahulEmp.id,
        employeeName: rahulEmp.name,
        designation: rahulEmp.designation,
        department: rahulEmp.department,
        baseCity: rahulEmp.baseCity,
        month: rahulStmt.month,
        claimType: 'Local Meetings',
        systemRecordedValue: rahulStmt.eligibleLocalMeetings,
        employeeReportedValue:
          rahulStmt.eligibleLocalMeetings + rahulUnsynced.length,
        disputedDelta: rahulUnsynced.length,
        financialImpact: rahulUnsynced.length * rahulStmt.localRate,
        employeeMessage:
          'I completed 42 meetings, but the system shows only 40.',
        aiInterpretation:
          '2 Prowl meetings (PRW-8841, PRW-8842) held pending GPS check-in verification.',
        assignedBa: rahulEmp.baOwner,
        baRegion: rahulEmp.baRegion,
        sourceTool: rahulEmp.sourceTool,
        status: 'Open',
        sourceCorrected: false,
        reSynced: false,
        resolutionNotes: 'Pending BD/BA fix in Prowl.',
        ownerId: rahulEmp.ownerId,
        createdAt: '2026-10-29 10:15 IST',
      };
      return [virtualRahulDispute, ...disputes];
    }

    return disputes;
  }, [disputes, employees, statements, sourceRecords]);

  useEffect(() => {
    const matchByEmp = allDisputeItems.find(
      (d) => d.employeeId === selectedEmployeeId
    );
    if (matchByEmp) {
      setSelectedDisputeId(matchByEmp.id);
    } else if (allDisputeItems.length > 0 && !selectedDisputeId) {
      setSelectedDisputeId(allDisputeItems[0].id);
    }
  }, [selectedEmployeeId, allDisputeItems.length]);

  const activeDispute =
    allDisputeItems.find((d) => d.id === selectedDisputeId) ||
    allDisputeItems[0];

  const filteredDisputes = allDisputeItems.filter((d) => {
    if (statusFilter === 'OPEN') return d.status !== 'Resolved';
    if (statusFilter === 'RESOLVED') return d.status === 'Resolved';
    return true;
  });

  const empSourceRecords = activeDispute
    ? sourceRecords.filter((r) => r.employeeId === activeDispute.employeeId)
    : [];
  const unsyncedEmpRecords = empSourceRecords.filter(
    (r) => r.syncStatus !== 'Synced'
  );
  const linkedStmt = activeDispute
    ? statements.find(
        (s) =>
          s.id === activeDispute.statementId ||
          s.employeeId === activeDispute.employeeId
      )
    : undefined;

  const nextOpenDispute = allDisputeItems.find(
    (d) => d.id !== activeDispute?.id && !d.reSynced && d.status !== 'Resolved'
  );

  const handleFixAndRecalculate = async () => {
    if (!activeDispute || busy) return;
    setBusy(true);
    try {
      await triggerTargetedReSync(activeDispute.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#6B7280]">
            Source Tool Verification · Prowl & LMS Sync
          </p>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Dispute Resolution
          </h1>
        </div>

        <button
          onClick={() => {
            setActiveRole(UserRole.HR);
            setActiveSection(NavSection.HR_APPROVAL_LOCK);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Approve Exceptions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MOBILE ONLY (< lg): Compact Pill Tabs for Dispute Selection */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {allDisputeItems.map((d) => {
          const isSelected = activeDispute?.id === d.id;
          const isOpen = d.status !== 'Resolved';
          return (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDisputeId(d.id);
                setSelectedEmployeeId(d.employeeId);
              }}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#09090B] text-white shadow-xs'
                  : 'bg-white text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpen ? 'bg-[#F59E0B]' : 'bg-[#2EAF53]'
                }`}
              />
              <span>{d.employeeName}</span>
              <span className="opacity-75">+₹{d.financialImpact}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Master-Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Pane (Desktop Only): Disputed Employee Cards (4 cols) */}
        <div className="hidden lg:block lg:col-span-4 bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(17,24,39,0.03)] space-y-4">
          <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-full">
            {[
              { id: 'ALL', label: `All (${allDisputeItems.length})` },
              {
                id: 'OPEN',
                label: `Pending (${allDisputeItems.filter((d) => d.status !== 'Resolved').length})`,
              },
              {
                id: 'RESOLVED',
                label: `Synced (${allDisputeItems.filter((d) => d.status === 'Resolved').length})`,
              },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === st.id
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredDisputes.map((d) => {
              const isSelected = activeDispute?.id === d.id;
              const isOpen = d.status !== 'Resolved';
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDisputeId(d.id);
                    setSelectedEmployeeId(d.employeeId);
                  }}
                  className={`w-full text-left p-4 rounded-[22px] transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-[#111827] bg-[#F4F5F7]'
                      : isOpen
                      ? 'border-[#EFE0D6] bg-[#EFE0D6]/40 hover:bg-[#EFE0D6]/70'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#F4F5F7]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#111827]">
                      {d.ticketNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        d.status === 'Resolved'
                          ? 'bg-[#CDE5D0] text-[#2E7D32]'
                          : 'bg-[#EFE0D6] text-[#B85D2B]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.status === 'Resolved'
                            ? 'bg-[#2E7D32]'
                            : 'bg-[#B85D2B]'
                        }`}
                      />
                      {d.status === 'Resolved' ? 'Synced' : 'Pending Sync'}
                    </span>
                  </div>

                  <div className="text-[15px] font-semibold text-[#111827] mt-1.5">
                    {d.employeeName}
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    {d.baseCity} · Source: {d.sourceTool}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E5E7EB]/80 flex items-center justify-between text-xs">
                    <span className="text-[#4B5563] font-medium">
                      Synced {d.systemRecordedValue} → Claim{' '}
                      {d.employeeReportedValue}
                    </span>
                    <span className="font-bold text-[#111827]">
                      +₹{d.financialImpact}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Single-Action BD / BA Workbench (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[28px] p-6 space-y-6 shadow-[0_4px_20px_rgba(17,24,39,0.03)]">
          {activeDispute ? (
            <>
              {/* Ticket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F2F6]">
                <div>
                  <div className="text-[12px] font-medium text-[#9CA3AF]">
                    {activeDispute.ticketNumber} · Assigned BD / BA:{' '}
                    {activeDispute.assignedBa.split(' (')[0]}
                  </div>
                  <h2 className="text-[22px] font-semibold text-[#111827] tracking-tight mt-0.5">
                    {activeDispute.employeeName} ({activeDispute.designation})
                  </h2>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F5F7] rounded-full text-xs font-semibold text-[#374151]">
                  <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Source Verification Only</span>
                </div>
              </div>

              {/* Employee Dispute Message */}
              <div className="p-4 rounded-[20px] bg-[#F3F4F6]">
                <div className="text-[11px] font-semibold text-[#6B7280]">
                  Employee Claim Note:
                </div>
                <div className="text-[14px] font-semibold text-[#111827] mt-1">
                  "{activeDispute.employeeMessage}"
                </div>
              </div>

              {/* 3 Soft Pastel Comparison Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-[24px] bg-[#D8CEF8] flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-full bg-[#C5B6F2] flex items-center justify-center text-[#5B3CC4] mb-3">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[#111827]/80">
                      {activeDispute.reSynced
                        ? `Synced (${activeDispute.sourceTool})`
                        : `Recorded (${activeDispute.sourceTool})`}
                    </div>
                    <div className="text-[26px] font-bold text-[#111827] mt-0.5">
                      {activeDispute.reSynced
                        ? activeDispute.employeeReportedValue
                        : activeDispute.systemRecordedValue}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-[24px] bg-[#D5E1EC] flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-full bg-[#BDD0E2] flex items-center justify-center text-[#2B6CB0] mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[#111827]/80">
                      Employee Claimed
                    </div>
                    <div className="text-[26px] font-bold text-[#111827] mt-0.5">
                      {activeDispute.employeeReportedValue}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-[24px] flex flex-col justify-between ${
                    activeDispute.reSynced ? 'bg-[#CDE5D0]' : 'bg-[#EFE0D6]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${
                      activeDispute.reSynced
                        ? 'bg-[#B6D8BA] text-[#2E7D32]'
                        : 'bg-[#E4CCBD] text-[#B85D2B]'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[#111827]/80">
                      {activeDispute.reSynced
                        ? 'Recalculated Impact'
                        : 'Payout Difference'}
                    </div>
                    <div className="text-[26px] font-bold text-[#111827] mt-0.5">
                      +₹{activeDispute.financialImpact}
                    </div>
                  </div>
                </div>
              </div>

              {/* Held Source Records Mini-List */}
              {unsyncedEmpRecords.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-[#111827]">
                    Held Meetings in {activeDispute.sourceTool} (
                    {unsyncedEmpRecords.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unsyncedEmpRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="px-4 py-3 rounded-[18px] bg-[#EFE0D6]/50 border border-[#E4CCBD] flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#111827]">
                            {rec.externalRefId} · {rec.date}
                          </div>
                          <div className="text-[11px] text-[#4B5563] truncate">
                            {rec.clientName}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#B85D2B] shrink-0">
                          Pending Geo-Tag
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SINGLE Clear Action Box */}
              {!activeDispute.reSynced ? (
                <div className="p-5 rounded-[24px] bg-[#F4F5F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-[#B85D2B]">
                      Verification Pending
                    </div>
                    <div className="text-sm font-semibold text-[#111827] mt-0.5">
                      Approve held meetings in {activeDispute.sourceTool} &
                      recalculate (+₹{activeDispute.financialImpact})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFixAndRecalculate}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                    <span>
                      Sync {activeDispute.sourceTool} & Recalculate (+₹
                      {activeDispute.financialImpact})
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-[24px] bg-[#CDE5D0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2EAF53] text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#111827]">
                        Synced in {activeDispute.sourceTool} & Recalculated
                      </div>
                      <div className="text-xs text-[#2E7D32] font-medium mt-0.5">
                        Updated Payout: ₹
                        {linkedStmt?.netAmount.toLocaleString('en-IN')} ·
                        Awaiting HR Exception Approval
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {nextOpenDispute && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDisputeId(nextOpenDispute.id);
                          setSelectedEmployeeId(nextOpenDispute.employeeId);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#111827] bg-white hover:bg-[#F4F5F7] rounded-full transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Resolve {nextOpenDispute.employeeName}</span>
                      </button>
                    )}

                    {linkedStmt && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(linkedStmt.employeeId);
                          setActiveRole(UserRole.HR);
                          setActiveSection(NavSection.HR_APPROVAL_LOCK);
                        }}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer"
                      >
                        <span>Approve Exception Payout</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-sm font-medium text-[#9CA3AF]">
              Select a dispute to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
