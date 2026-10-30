import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import {
  Landmark,
  CheckCircle2,
  ShieldCheck,
  Download,
  Loader2,
  AlertOctagon,
  Play,
} from 'lucide-react';

export const FinanceDisbursementView: React.FC = () => {
  const {
    statements,
    payoutBatches,
    createPayoutBatchForLocked,
    advancePayoutBatchStatus,
  } = useFta();

  const [selectedStmtIds, setSelectedStmtIds] = useState<string[]>([]);
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);

  // Eligible for new payout batch: payoutLocked === true AND not already in an active/completed batch
  const eligibleForBatch = statements.filter(
    (s) =>
      s.payoutLocked &&
      s.payoutStatus !== 'Success' &&
      s.payoutStatus !== 'Processing' &&
      s.payoutStatus !== 'Initiated'
  );

  const alreadyBatchedOrPaid = statements.filter(
    (s) =>
      s.payoutStatus === 'Initiated' ||
      s.payoutStatus === 'Processing' ||
      s.payoutStatus === 'Success'
  );

  const handleToggleSelect = (id: string) => {
    setSelectedStmtIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBatch = async (idsToBatch: string[]) => {
    if (idsToBatch.length === 0) return;
    setBusyBatchId('CREATE');
    try {
      await createPayoutBatchForLocked(idsToBatch);
      setSelectedStmtIds([]);
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleAdvanceStatus = async (
    batchId: string,
    target: 'Processing' | 'Success' | 'Failed'
  ) => {
    setBusyBatchId(`${batchId}-${target}`);
    try {
      await advancePayoutBatchStatus(batchId, target);
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleDownloadReconciliationCsv = () => {
    const headers = [
      'EmployeeID',
      'EmployeeName',
      'Designation',
      'Department',
      'Month',
      'EligibleLocalMeetings',
      'NewLaunchMeetings',
      'OutstationDays',
      'NetFTA_INR',
      'PayoutLocked',
      'LockVersion',
      'PayoutBatchID',
      'DisbursementStatus',
      'BankUTR',
    ];
    const rows = statements.map((s) =>
      [
        s.employeeId,
        `"${s.employeeName}"`,
        `"${s.designation}"`,
        `"${s.department}"`,
        s.month,
        s.eligibleLocalMeetings,
        s.newLaunchMeetings,
        s.outstationDays,
        s.netAmount,
        s.payoutLocked,
        `v${s.lockVersion}`,
        s.payoutBatchId,
        s.payoutStatus,
        s.utrNumber,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FTA_Reconciliation_Report_2026_10.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Locked HR-Approved Batches · Simulated Payment Gateway · Duplicate Payout Guard · Reconciliation
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Finance Disbursement & Reconciliation
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              handleCreateBatch(
                selectedStmtIds.length > 0
                  ? selectedStmtIds
                  : eligibleForBatch.map((s) => s.id)
              )
            }
            disabled={eligibleForBatch.length === 0 || busyBatchId !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busyBatchId === 'CREATE' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Landmark className="w-3.5 h-3.5" />
            )}
            <span>
              {selectedStmtIds.length > 0
                ? `Generate Payout Batch (${selectedStmtIds.length} Selected)`
                : `Generate Payout Batch for All Locked (${eligibleForBatch.length})`}
            </span>
          </button>

          <button
            onClick={handleDownloadReconciliationCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Reconciliation CSV</span>
          </button>
        </div>
      </div>

      {/* Active Payout Batches & Simulated Gateway */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              01. Simulated Payment Gateway Batches (RazorpayX Enterprise Payouts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transition batches through Initiated → Processing → Success (Generates UTRs) or Failed.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Duplicate Payout Guard Active</span>
          </span>
        </div>

        {payoutBatches.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="text-sm font-medium text-slate-800">
              No Payout Batches Generated Yet
            </div>
            <p className="text-xs text-slate-500">
              Select locked HR-approved records below or click "Generate Payout Batch" to initiate disbursement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payoutBatches.map((batch) => {
              const linkedStmts = statements.filter(
                (s) => s.payoutBatchId === batch.batchNumber
              );
              return (
                <div
                  key={batch.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {batch.batchNumber}
                      </span>
                      <span
                        className={`font-semibold ${
                          batch.status === 'Success'
                            ? 'text-emerald-700'
                            : batch.status === 'Failed'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}
                      >
                        Status: {batch.status}
                      </span>
                    </div>

                    <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                      ₹{batch.totalAmount.toLocaleString('en-IN')} ·{' '}
                      {batch.employeeCount} Employee(s)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Gateway: {batch.gatewayName} · Created: {batch.createdAt}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                      Included:{' '}
                      {linkedStmts
                        .map(
                          (s) =>
                            `${s.employeeName} (₹${s.netAmount.toLocaleString('en-IN')})`
                        )
                        .join(', ')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      UTR Prefix: {batch.utrPrefix}
                    </span>

                    <div className="flex items-center gap-2">
                      {batch.status === 'Initiated' && (
                        <button
                          onClick={() =>
                            handleAdvanceStatus(batch.id, 'Processing')
                          }
                          disabled={busyBatchId !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Mark Processing</span>
                        </button>
                      )}

                      {batch.status !== 'Success' && (
                        <button
                          onClick={() => handleAdvanceStatus(batch.id, 'Success')}
                          disabled={busyBatchId !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Simulate Gateway Success</span>
                        </button>
                      )}

                      {batch.status !== 'Success' && batch.status !== 'Failed' && (
                        <button
                          onClick={() => handleAdvanceStatus(batch.id, 'Failed')}
                          disabled={busyBatchId !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 cursor-pointer"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Fail</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* End-to-End Financial Reconciliation Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              02. End-to-End Financial Reconciliation & Duplicate Payout Guard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only HR-Locked records can be batched. Records with active or settled UTRs ({alreadyBatchedOrPaid.length}) are blocked from duplicate payout.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Select</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 text-right">Source Meetings</th>
                <th className="py-3 px-3 text-right">Statement Net FTA</th>
                <th className="py-3 px-3">HR Lock State</th>
                <th className="py-3 px-3">Payout Batch ID</th>
                <th className="py-3 px-3">Gateway Status</th>
                <th className="py-3 px-4">Bank UTR Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {statements.map((st) => {
                const canSelect =
                  st.payoutLocked &&
                  st.payoutStatus !== 'Success' &&
                  st.payoutStatus !== 'Processing' &&
                  st.payoutStatus !== 'Initiated';
                return (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedStmtIds.includes(st.id)}
                        disabled={!canSelect}
                        onChange={() => handleToggleSelect(st.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {st.employeeName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {st.employeeId} · {st.department}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {st.eligibleLocalMeetings}L · {st.newLaunchMeetings}NL ·{' '}
                      {st.outstationDays}D
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      ₹{st.netAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      {st.payoutLocked ? (
                        <span className="font-semibold text-emerald-700">
                          Locked (v{st.lockVersion})
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Unlocked ({st.status})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {st.payoutBatchId !== 'NONE' ? st.payoutBatchId : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          st.payoutStatus === 'Success'
                            ? 'text-emerald-700'
                            : st.payoutStatus === 'Initiated' ||
                              st.payoutStatus === 'Processing'
                            ? 'text-blue-700'
                            : st.payoutStatus === 'Failed'
                            ? 'text-red-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {st.payoutStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {st.utrNumber !== 'PENDING' ? st.utrNumber : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
