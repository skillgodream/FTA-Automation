import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const HrApprovalLockView: React.FC = () => {
  const {
    statements,
    disputes,
    activeRole,
    approveStatementByHr,
    lockStatementPayout,
    lockAllApprovedStatements,
    requestVersionedUnlock,
    approveVersionedUnlock,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [unlockModalStmtId, setUnlockModalStmtId] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState<string>(
    'Post-lock audit adjustment requested by Regional Business Head.'
  );

  const openDisputes = disputes.filter((d) => d.status !== 'Resolved');
  const postDisputeRecalculated = statements.filter(
    (s) =>
      s.status === 'Recalculated (Post-Dispute)' || s.disputeTicketId !== 'NONE'
  );
  const lockedCount = statements.filter((s) => s.payoutLocked).length;

  const handleApprove = async (stmtId: string) => {
    setBusyId(stmtId);
    try {
      await approveStatementByHr(stmtId);
    } finally {
      setBusyId(null);
    }
  };

  const handleLock = async (stmtId: string) => {
    setBusyId(stmtId);
    try {
      await lockStatementPayout(stmtId);
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkLock = async () => {
    setBusyId('BULK');
    try {
      await lockAllApprovedStatements();
    } finally {
      setBusyId(null);
    }
  };

  const handleRequestUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalStmtId || !unlockReason.trim()) return;
    setBusyId(unlockModalStmtId);
    try {
      await requestVersionedUnlock(unlockModalStmtId, unlockReason.trim());
      setUnlockModalStmtId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveUnlock = async (stmtId: string) => {
    setBusyId(stmtId);
    try {
      await approveVersionedUnlock(stmtId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Exception Review · Post-Dispute Verification · Immutable Final Payout Lock Gate
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            HR Approval & Final Payout Lock
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBulkLock}
            disabled={busyId !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busyId === 'BULK' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>Bulk Lock All Approved Statements</span>
          </button>

          <button
            onClick={() => {
              setActiveRole(UserRole.FINANCE);
              setActiveSection(NavSection.FINANCE_DISBURSEMENT);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <span>Proceed to Finance Disbursement ({lockedCount} Locked)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spotlight Row: Post-Dispute Corrections & Exceptions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Post-Dispute Recalculations & Exception Queue (
              {postDisputeRecalculated.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Statements modified via BA source correction & targeted re-sync, or currently under open dispute.
            </p>
          </div>
          {openDisputes.length > 0 && (
            <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{openDisputes.length} Unresolved Dispute(s) Pending BA</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {postDisputeRecalculated.map((st) => {
            const linkedDsp = disputes.find(
              (d) => d.ticketNumber === st.disputeTicketId
            );
            return (
              <div
                key={st.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {st.employeeId} · {st.employeeName}
                    </span>
                    <span className="font-mono font-semibold text-blue-700">
                      ₹{st.netAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {st.designation} · {st.eligibleLocalMeetings} Local Mtgs ·{' '}
                    {st.outstationDays} Outstation Days
                  </div>
                  {linkedDsp && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <div>
                        Ticket:{' '}
                        <strong className="font-mono text-slate-900">
                          {linkedDsp.ticketNumber}
                        </strong>{' '}
                        ({linkedDsp.status})
                      </div>
                      <div className="mt-0.5">{linkedDsp.resolutionNotes}</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800">
                    {st.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!st.payoutLocked && st.status !== 'HR Approved' && (
                      <button
                        onClick={() => handleApprove(st.id)}
                        disabled={busyId !== null}
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {!st.payoutLocked && (
                      <button
                        onClick={() => handleLock(st.id)}
                        disabled={busyId !== null}
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 cursor-pointer"
                      >
                        Final Lock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Versioned Change Request Modal */}
      {unlockModalStmtId && (
        <div className="bg-white border border-amber-300 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Submit Versioned Change Request (Unlock Locked Payout Record)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Locked statements are immutable. Submitting a versioned change
                request requires HR Admin sign-off and increments the lock version.
              </p>
            </div>
            <button
              onClick={() => setUnlockModalStmtId(null)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleRequestUnlock} className="space-y-3">
            <input
              type="text"
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
              placeholder="Enter business justification for unlocking payout record..."
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 cursor-pointer"
            >
              Submit Versioned Change Request
            </button>
          </form>
        </div>
      )}

      {/* Master HR Approval & Final Payout Lock Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              All Monthly Statements — HR Approval & Final Payout Lock Gate
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Locked records cannot be modified or recalculated unless unlocked via an approved versioned change request (Active Role: {activeRole}).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department · BA</th>
                <th className="py-3 px-3 text-right">Local · Launch · Out</th>
                <th className="py-3 px-3 text-right">Net Payable FTA</th>
                <th className="py-3 px-3">Dispute Ref</th>
                <th className="py-3 px-3">Status & Lock Version</th>
                <th className="py-3 px-4 text-right">HR Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {statements.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      {st.employeeName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {st.employeeId} · {st.designation}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>
                      {st.department} ({st.baseCity})
                    </div>
                    <div className="text-[11px] text-slate-500">{st.baOwner}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    {st.eligibleLocalMeetings}L · {st.newLaunchMeetings}NL ·{' '}
                    {st.outstationDays}D
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                    ₹{st.netAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {st.disputeTicketId !== 'NONE' ? st.disputeTicketId : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {st.payoutLocked ? (
                        <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`font-semibold ${
                          st.payoutLocked
                            ? 'text-emerald-700'
                            : st.status === 'Disputed'
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {st.status} (v{st.lockVersion})
                      </span>
                    </div>
                    {st.changeRequestStatus !== 'None' && (
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        CR: {st.changeRequestStatus}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!st.payoutLocked ? (
                      <div className="inline-flex items-center gap-2">
                        {st.status !== 'HR Approved' && (
                          <button
                            onClick={() => handleApprove(st.id)}
                            disabled={busyId !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleLock(st.id)}
                          disabled={busyId !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Final Payout Lock</span>
                        </button>
                      </div>
                    ) : st.changeRequestStatus === 'Pending Approval' ? (
                      <button
                        onClick={() => handleApproveUnlock(st.id)}
                        disabled={busyId !== null}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>HR Admin: Approve CR & Unlock (v{st.lockVersion + 1})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setUnlockModalStmtId(st.id)}
                        disabled={st.payoutStatus === 'Success'}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <span>Request Change (CR-v{st.lockVersion + 1})</span>
                      </button>
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
