import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import {
  Landmark,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react';

export const FinanceDisbursementView: React.FC = () => {
  const {
    statements,
    payoutBatches,
    createPayoutBatchForLocked,
    advancePayoutBatchStatus,
  } = useFta();

  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'paid'>('all');
  const [busy, setBusy] = useState<boolean>(false);

  const eligibleForDisbursement = statements.filter(
    (s) => s.payoutLocked && s.payoutStatus !== 'Success'
  );

  const filteredStatements = statements.filter((s) => {
    if (filterTab === 'ready')
      return s.payoutLocked && s.payoutStatus !== 'Success';
    if (filterTab === 'paid') return s.payoutStatus === 'Success';
    return true;
  });

  // 1-Click Disburse All Approved Statements
  const handleDisburseAllApproved = async () => {
    setBusy(true);
    try {
      const unbatchedIds = statements
        .filter((s) => s.payoutLocked && s.payoutBatchId === 'NONE')
        .map((s) => s.id);

      if (unbatchedIds.length > 0) {
        await createPayoutBatchForLocked(unbatchedIds);
      }

      for (const b of payoutBatches) {
        if (b.status !== 'Success') {
          await advancePayoutBatchStatus(b.id, 'Success');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteSingleBatch = async (batchId: string) => {
    setBusy(true);
    try {
      await advancePayoutBatchStatus(batchId, 'Success');
    } finally {
      setBusy(false);
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
      'Approved',
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
    a.download = `FTA_Disbursement_Report_2026_10.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#6B7280]">
            NEFT / IMPS Bank Settlement & UTR Reconciliation
          </p>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Bank Disbursement
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDisburseAllApproved}
            disabled={eligibleForDisbursement.length === 0 || busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-[#1F2937] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Landmark className="w-3.5 h-3.5" />
            )}
            <span>
              {eligibleForDisbursement.length > 0
                ? `Disburse All Approved (${eligibleForDisbursement.length})`
                : 'All Approved Payouts Disbursed'}
            </span>
          </button>

          <button
            onClick={handleDownloadReconciliationCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#111827]/30 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Bank CSV</span>
          </button>
        </div>
      </div>

      {/* Smart Payout Batch Cards */}
      {payoutBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {payoutBatches.map((batch) => {
            const linkedStmts = statements.filter(
              (s) => s.payoutBatchId === batch.batchNumber
            );
            return (
              <div
                key={batch.id}
                className="bg-white rounded-[28px] p-6 flex flex-col justify-between gap-4 shadow-[0_4px_20px_rgba(17,24,39,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#111827]">
                        {batch.batchNumber}
                      </span>
                      <span className="text-[#9CA3AF]">·</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          batch.status === 'Success'
                            ? 'bg-[#CDE5D0] text-[#2E7D32]'
                            : 'bg-[#D8CEF8] text-[#5B3CC4]'
                        }`}
                      >
                        {batch.status === 'Success'
                          ? 'Disbursed (UTR Generated)'
                          : 'Ready for Bank Release'}
                      </span>
                    </div>

                    <div className="text-xs text-[#6B7280] mt-2">
                      {linkedStmts.map((s) => s.employeeName).join(', ')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[24px] font-bold text-[#111827]">
                      ₹{batch.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">
                      {batch.employeeCount} Employees
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F2F6] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#9CA3AF]">
                    {batch.gatewayName}
                  </span>

                  {batch.status !== 'Success' ? (
                    <button
                      onClick={() => handleCompleteSingleBatch(batch.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-[#1F2937] cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Release Bank Payout</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Paid</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clean Disbursement Ledger */}
      <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_4px_20px_rgba(17,24,39,0.03)] p-6">
        <div className="pb-4 border-b border-[#F1F2F6] flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F5F7] rounded-full">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              All ({statements.length})
            </button>
            <button
              onClick={() => setFilterTab('ready')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                filterTab === 'ready'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              Ready to Disburse ({eligibleForDisbursement.length})
            </button>
            <button
              onClick={() => setFilterTab('paid')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                filterTab === 'paid'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280]'
              }`}
            >
              Disbursed (
              {statements.filter((s) => s.payoutStatus === 'Success').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F2F6] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role · City</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Disbursement</th>
                <th className="py-3 px-4">Bank UTR</th>
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
                  <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#111827]">
                    ₹{st.netAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    {st.payoutLocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#CDE5D0] text-[#2E7D32] text-[11px] font-semibold">
                        {st.employeeId === 'EMP-1001' ||
                        st.employeeId === 'EMP-1002'
                          ? 'HR Exception Approved'
                          : 'Zero-Touch Auto-Approved'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EFE0D6] text-[#B85D2B] text-[11px] font-semibold">
                        Awaiting Exception Resolution
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#4B5563]">
                    {st.payoutBatchId !== 'NONE' ? st.payoutBatchId : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold ${
                        st.payoutStatus === 'Success'
                          ? 'text-[#2E7D32]'
                          : st.payoutLocked
                          ? 'text-[#5B3CC4]'
                          : 'text-[#9CA3AF]'
                      }`}
                    >
                      {st.payoutStatus === 'Success'
                        ? 'Disbursed'
                        : st.payoutLocked
                        ? 'Ready to Disburse'
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#4B5563]">
                    {st.utrNumber !== 'PENDING' ? st.utrNumber : '—'}
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
