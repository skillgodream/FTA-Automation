import React, { useState, useEffect } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
  ArrowRight,
  Loader2,
  Clock,
  Wrench,
  Calendar,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const EmployeeStatementsView: React.FC = () => {
  const {
    employees,
    statements,
    disputes,
    sourceRecords,
    selectedEmployeeId,
    setSelectedEmployeeId,
    raiseEmployeeDispute,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [disputeReplyText, setDisputeReplyText] = useState<string>(
    'I completed 42 meetings, but the system shows only 40.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeStmt =
    statements.find((s) => s.employeeId === selectedEmployeeId) ||
    statements[0];
  const activeEmp = employees.find((e) => e.id === activeStmt?.employeeId);
  const activeDispute = disputes.find(
    (d) => d.employeeId === activeStmt?.employeeId
  );
  const heldEmpRecords = sourceRecords.filter(
    (r) => r.employeeId === activeStmt?.employeeId && r.syncStatus !== 'Synced'
  );

  useEffect(() => {
    if (activeStmt?.employeeId === 'EMP-1001') {
      setDisputeReplyText(
        'I completed 42 meetings, but the system shows only 40.'
      );
    } else if (activeStmt) {
      setDisputeReplyText(
        `I completed ${activeStmt.eligibleLocalMeetings + 2} local meetings in ${activeStmt.baseCity}, but my statement shows ${activeStmt.eligibleLocalMeetings}.`
      );
    }
  }, [
    activeStmt?.employeeId,
    activeStmt?.eligibleLocalMeetings,
    activeStmt?.baseCity,
  ]);

  if (!activeStmt || !activeEmp) {
    return null;
  }

  const handleSendDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReplyText.trim()) return;
    setSubmitting(true);
    try {
      await raiseEmployeeDispute(activeStmt.id, disputeReplyText.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStatements = statements.filter((s) => {
    if (statusFilter === 'EXCEPTIONS') return !s.payoutLocked;
    if (statusFilter === 'AUTO_CLEARED') return s.payoutLocked;
    return true;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#6B7280]">
            48-Hour Dispute Window · Auto-Clears Unless Disputed
          </p>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Employee Statements
          </h1>
        </div>

        <button
          onClick={() => {
            setActiveRole(UserRole.BA);
            setActiveSection(NavSection.BA_DISPUTES);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Review Disputes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MOBILE ONLY (< lg): Compact Pill Tabs for Employee Selection */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {statements.map((st) => {
          const isSelected = st.employeeId === activeStmt.employeeId;
          const needsAttention = !st.payoutLocked;
          return (
            <button
              key={st.id}
              onClick={() => setSelectedEmployeeId(st.employeeId)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#09090B] text-white shadow-xs'
                  : 'bg-white text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  needsAttention ? 'bg-[#F59E0B]' : 'bg-[#2EAF53]'
                }`}
              />
              <span>{st.employeeName}</span>
              <span className="opacity-75">
                ₹{st.netAmount.toLocaleString('en-IN')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Master-Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Pane (Desktop Only): 5 Employee Cards (4 cols) */}
        <div className="hidden lg:block lg:col-span-4 bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(17,24,39,0.03)] space-y-4">
          <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-full overflow-x-auto">
            {[
              { id: 'ALL', label: `All (${statements.length})` },
              {
                id: 'EXCEPTIONS',
                label: `48h Window (${statements.filter((s) => !s.payoutLocked).length})`,
              },
              {
                id: 'AUTO_CLEARED',
                label: `Cleared (${statements.filter((s) => s.payoutLocked).length})`,
              },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-full whitespace-nowrap cursor-pointer transition-all ${
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
            {filteredStatements.map((st) => {
              const isSelected = st.employeeId === activeStmt.employeeId;
              const needsAttention = !st.payoutLocked;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedEmployeeId(st.employeeId)}
                  className={`w-full text-left p-4 rounded-[22px] transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'border-[#111827] bg-[#F4F5F7]'
                      : needsAttention
                      ? 'border-[#EFE0D6] bg-[#EFE0D6]/40 hover:bg-[#EFE0D6]/70'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#F4F5F7]/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          needsAttention ? 'bg-[#B85D2B]' : 'bg-[#2EAF53]'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          needsAttention ? 'text-[#B85D2B]' : 'text-[#2E7D32]'
                        }`}
                      >
                        {needsAttention
                          ? '48h Dispute Window'
                          : 'Zero-Touch Cleared'}
                      </span>
                    </div>
                    <div className="text-[15px] font-semibold text-[#111827] truncate mt-1">
                      {st.employeeName}
                    </div>
                    <div className="text-[12px] text-[#6B7280] truncate">
                      {st.designation} · {st.baseCity}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[15px] font-bold text-[#111827]">
                      ₹{st.netAmount.toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[11px] font-semibold mt-0.5 ${
                        st.status === 'Disputed'
                          ? 'text-[#B85D2B]'
                          : !st.payoutLocked
                          ? 'text-[#B85D2B]'
                          : 'text-[#2E7D32]'
                      }`}
                    >
                      {st.payoutLocked
                        ? 'Auto-Approved'
                        : st.status === 'Disputed'
                        ? 'Dispute Raised'
                        : 'Open (48h Left)'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Unified Single-Screen Employee View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[28px] overflow-hidden shadow-[0_4px_20px_rgba(17,24,39,0.03)] p-6 space-y-6">
          {/* Zero-Touch Policy Banner at Top */}
          <div
            className={`px-4 py-3 rounded-[18px] flex flex-wrap items-center justify-between gap-3 ${
              activeStmt.payoutLocked ? 'bg-[#CDE5D0]/70' : 'bg-[#F4F5F7]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              {activeStmt.payoutLocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span className="font-semibold text-[#111827]">
                    No Employee Approval Required · Cleared for Disbursement
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-[#B85D2B] shrink-0" />
                  <span className="font-semibold text-[#111827]">
                    Auto-clears in 48 Hours unless a dispute is submitted below
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              Window Closes: 02 Nov, 6:00 PM
            </span>
          </div>

          {/* Statement Top Header */}
          <div className="pb-4 border-b border-[#F1F2F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[12px] font-medium text-[#9CA3AF]">
                {activeStmt.employeeId} · {activeStmt.department} ·{' '}
                {activeStmt.baseCity} ({activeStmt.cityCategory}) · Synced from{' '}
                {activeStmt.sourceTool}
              </div>
              <h2 className="text-[24px] font-semibold text-[#111827] tracking-tight mt-0.5">
                {activeStmt.employeeName}
              </h2>
              <div className="text-xs text-[#6B7280] mt-0.5">
                {activeStmt.designation} · Assigned BD / BA:{' '}
                {activeStmt.baOwner.split(' (')[0]}
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[12px] font-medium text-[#9CA3AF]">
                Calculated Amount
              </div>
              <div className="text-[28px] font-bold text-[#111827] tracking-tight">
                ₹{activeStmt.netAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#9CA3AF]">
                Monthly Cap: ₹{activeStmt.maxClaimLimit.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* 3 Pastel Cards Breakdown (Meetings × Price) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[24px] bg-[#D8CEF8] flex flex-col justify-between">
              <div className="w-9 h-9 rounded-full bg-[#C5B6F2] flex items-center justify-center text-[#5B3CC4] mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[12px] font-medium text-[#111827]/80">
                  Local Meetings
                </div>
                <div className="text-[24px] font-bold text-[#111827] mt-0.5">
                  ₹{activeStmt.localAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-medium text-[#111827]/75 mt-0.5">
                  {activeStmt.eligibleLocalMeetings} Meetings × ₹
                  {activeStmt.localRate}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-[24px] bg-[#CDE5D0] flex flex-col justify-between">
              <div className="w-9 h-9 rounded-full bg-[#B6D8BA] flex items-center justify-center text-[#2E7D32] mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[12px] font-medium text-[#111827]/80">
                  New Launch Bonus
                </div>
                <div className="text-[24px] font-bold text-[#111827] mt-0.5">
                  ₹{activeStmt.newLaunchAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-medium text-[#111827]/75 mt-0.5">
                  {activeStmt.newLaunchMeetings} Meetings × ₹
                  {activeStmt.newLaunchRate}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-[24px] bg-[#D5E1EC] flex flex-col justify-between">
              <div className="w-9 h-9 rounded-full bg-[#BDD0E2] flex items-center justify-center text-[#2B6CB0] mb-3">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[12px] font-medium text-[#111827]/80">
                  Outstation Travel
                </div>
                <div className="text-[24px] font-bold text-[#111827] mt-0.5">
                  ₹{activeStmt.outstationAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-medium text-[#111827]/75 mt-0.5">
                  {activeStmt.outstationDays} Days × ₹
                  {activeStmt.outstationDailyRate}
                </div>
              </div>
            </div>
          </div>

          {/* Unified Dispute Section Directly Below */}
          {activeStmt.payoutLocked ? (
            <div className="p-5 rounded-[24px] bg-[#CDE5D0]/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#2EAF53] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-[#111827]">
                  Statement Approved & Locked for Bank Disbursement
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveRole(UserRole.FINANCE);
                  setActiveSection(NavSection.FINANCE_DISBURSEMENT);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer"
              >
                <span>Process Disbursement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : activeDispute ? (
            <div className="p-5 rounded-[24px] bg-[#EFE0D6]/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#B85D2B]">
                    Dispute Submitted · {activeDispute.ticketNumber}
                  </div>
                  <div className="text-sm font-bold text-[#111827] mt-0.5">
                    "{activeDispute.employeeMessage}"
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5">
                    Synced: {activeDispute.systemRecordedValue} vs Claimed:{' '}
                    {activeDispute.employeeReportedValue} (+₹
                    {activeDispute.financialImpact})
                  </div>
                </div>

                {!activeDispute.reSynced ? (
                  <button
                    onClick={() => {
                      setActiveRole(UserRole.BA);
                      setActiveSection(NavSection.BA_DISPUTES);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Verify & Sync in {activeStmt.sourceTool}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveRole(UserRole.HR);
                      setActiveSection(NavSection.HR_APPROVAL_LOCK);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2EAF53] hover:bg-[#259646] rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Approve Exception Payout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendDispute}
              className="p-5 rounded-[24px] bg-[#F4F5F7] space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B85D2B] shrink-0" />
                  <span className="text-xs font-bold text-[#111827]">
                    Report Missing Meetings (Within 48h Window)
                  </span>
                </div>
                {heldEmpRecords.length > 0 && (
                  <span className="text-[11px] font-semibold text-[#B85D2B]">
                    2 Prowl Meetings Held (40 Synced vs 42 Claimed)
                  </span>
                )}
              </div>

              <textarea
                rows={2}
                value={disputeReplyText}
                onChange={(e) => setDisputeReplyText(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-[#111827]"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-[#6B7280]">
                  Assigned BD / BA: {activeEmp.baOwner.split(' (')[0]}
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Dispute</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
