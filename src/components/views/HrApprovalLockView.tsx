import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const HrApprovalLockView: React.FC = () => {
  const {
    statements,
    lockStatementPayout,
    lockAllApprovedStatements,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [tabFilter, setTabFilter] = useState<'all' | 'exceptions' | 'approved'>(
    'all'
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mobileSelectedId, setMobileSelectedId] = useState<string>('');

  const lockedCount = statements.filter((s) => s.payoutLocked).length;
  const exceptionStatements = statements.filter((s) => !s.payoutLocked);

  const filteredStatements = statements.filter((s) => {
    if (tabFilter === 'exceptions') return !s.payoutLocked;
    if (tabFilter === 'approved') return s.payoutLocked;
    return true;
  });

  const handleApproveAndLockException = async (stmtId: string) => {
    setBusyId(stmtId);
    try {
      await lockStatementPayout(stmtId);
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkApproveAllExceptions = async () => {
    setBusyId('BULK');
    try {
      await lockAllApprovedStatements();
    } finally {
      setBusyId(null);
    }
  };

  const activeMobileException =
    exceptionStatements.find((s) => s.id === mobileSelectedId) ||
    exceptionStatements[0];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#6B7280]">
            HR Sign-Off for Disputed Statements
          </p>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Exception Approvals
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {exceptionStatements.length > 0 && (
            <button
              onClick={handleBulkApproveAllExceptions}
              disabled={busyId !== null}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#2EAF53] hover:bg-[#259646] rounded-full transition-colors disabled:opacity-40 cursor-pointer"
            >
              {busyId === 'BULK' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                Approve All Exceptions ({exceptionStatements.length})
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveRole(UserRole.FINANCE);
              setActiveSection(NavSection.FINANCE_DISBURSEMENT);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full transition-colors cursor-pointer"
          >
            <span>Process Disbursement ({lockedCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Actionable Exception Cards Awaiting HR Approval */}
      {exceptionStatements.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B85D2B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                Exceptions Pending Approval ({exceptionStatements.length})
              </span>
            </div>
            <span className="text-xs text-[#6B7280] hidden sm:inline">
              3 of 5 employees were auto-approved without HR intervention
            </span>
          </div>

          {/* MOBILE ONLY (< md): Small Pill Tabs for Exception Approval */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {exceptionStatements.map((st) => {
                const isSelected = activeMobileException?.id === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setMobileSelectedId(st.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#09090B] text-white shadow-xs'
                        : 'bg-white text-[#111827] border border-[#E5E7EB]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span>{st.employeeName}</span>
                    <span className="opacity-75">
                      ₹{st.netAmount.toLocaleString('en-IN')}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeMobileException && (
              <div className="bg-white rounded-2xl p-3.5 border border-[#E4CCBD] flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111827] truncate">
                    {activeMobileException.employeeName} · ₹
                    {activeMobileException.netAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-[#6B7280] truncate">
                    {activeMobileException.eligibleLocalMeetings} Mtgs ·{' '}
                    {activeMobileException.baseCity}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleApproveAndLockException(activeMobileException.id)
                  }
                  disabled={busyId !== null}
                  className="px-3.5 py-2 rounded-full bg-[#09090B] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                >
                  Approve Payout
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP & TABLET (hidden md:grid): Full Side-by-Side Exception Cards */}
          <div className="hidden md:grid md:grid-cols-2 gap-5">
            {exceptionStatements.map((st) => (
              <div
                key={st.id}
                className="p-6 rounded-[28px] bg-white shadow-[0_4px_20px_rgba(17,24,39,0.03)] flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFE0D6] text-[#B85D2B] text-[11px] font-semibold">
                    {st.status}
                  </span>
                  <div className="text-[20px] font-semibold text-[#111827] truncate mt-2">
                    {st.employeeName}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {st.eligibleLocalMeetings} Meetings · {st.outstationDays}{' '}
                    Days · {st.baseCity}
                  </div>
                </div>

                <div className="text-right space-y-3 shrink-0">
                  <div className="text-[24px] font-bold text-[#111827]">
                    ₹{st.netAmount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => handleApproveAndLockException(st.id)}
                    disabled={busyId !== null}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full cursor-pointer"
                  >
                    {busyId === st.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Approve Payout</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="p-5 rounded-[28px] bg-[#CDE5D0] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2EAF53] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#111827]">
                All 5 Statements Approved (3 Zero-Touch + 2 HR Exceptions)
              </div>
              <div className="text-xs text-[#2E7D32] font-medium">
                Locked for Bank Disbursement
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveRole(UserRole.FINANCE);
              setActiveSection(NavSection.FINANCE_DISBURSEMENT);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-[#1F2937] cursor-pointer shrink-0"
          >
            <span>Process Disbursement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean Table */}
      <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_4px_20px_rgba(17,24,39,0.03)] p-6">
        <div className="pb-4 border-b border-[#F1F2F6] flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F5F7] rounded-full">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                tabFilter === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              All ({statements.length})
            </button>
            <button
              onClick={() => setTabFilter('exceptions')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                tabFilter === 'exceptions'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              Pending ({exceptionStatements.length})
            </button>
            <button
              onClick={() => setTabFilter('approved')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                tabFilter === 'approved'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              Approved ({lockedCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F2F6] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role · City</th>
                <th className="py-3 px-4 text-right">Verified Activity</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Approval Track</th>
                <th className="py-3 px-4 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F6] text-[13px]">
              {filteredStatements.map((st) => (
                <tr key={st.id} className="hover:bg-[#F4F5F7]/50">
                  <td className="py-3.5 px-4 font-semibold text-[#111827]">
                    {st.employeeName}
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280]">
                    {st.designation} · {st.baseCity}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                    {st.eligibleLocalMeetings} Meetings · {st.outstationDays}{' '}
                    Days
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#111827]">
                    ₹{st.netAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {st.payoutLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CDE5D0] text-[#2E7D32] text-[11px] font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>
                            {st.employeeId === 'EMP-1001' ||
                            st.employeeId === 'EMP-1002'
                              ? 'HR Exception Approved'
                              : 'Zero-Touch Approved'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFE0D6] text-[#B85D2B] text-[11px] font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pending HR Sign-Off</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!st.payoutLocked ? (
                      <button
                        onClick={() => handleApproveAndLockException(st.id)}
                        disabled={busyId !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#09090B] hover:bg-[#1F2937] rounded-full cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Payout</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-[#2E7D32]">
                        Approved
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
