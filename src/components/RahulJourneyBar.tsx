import React, { useState } from 'react';
import { useFta } from '../context/FtaContext';
import { NavSection, UserRole } from '../types/fta';
import {
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Play,
  Loader2,
} from 'lucide-react';

export const RahulJourneyBar: React.FC = () => {
  const {
    statements,
    disputes,
    payoutBatches,
    setActiveSection,
    setActiveRole,
    setSelectedEmployeeId,
    raiseEmployeeDispute,
    simulateSourceCorrection,
    triggerTargetedReSync,
    approveStatementByHr,
    lockStatementPayout,
    createPayoutBatchForLocked,
    advancePayoutBatchStatus,
    resetRahulDemoScenario,
    seeding,
  } = useFta();

  const [busyStep, setBusyStep] = useState<number | null>(null);

  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
  const rahulDispute = disputes.find((d) => d.employeeId === 'EMP-1001');

  if (!rahulStmt) return null;

  // Determine current milestone (1 to 6)
  const step1Done = true; // Initial 40 meetings = ₹2,000
  const step2Done = Boolean(rahulDispute);
  const step3Done = Boolean(rahulDispute?.sourceCorrected || rahulDispute?.reSynced);
  const step4Done = Boolean(
    rahulDispute?.reSynced || rahulStmt.eligibleLocalMeetings >= 42
  );
  const step5Done = Boolean(rahulStmt.payoutLocked);
  const step6Done = rahulStmt.payoutStatus === 'Success';

  const handleRunStep = async (stepNumber: number) => {
    setBusyStep(stepNumber);
    try {
      setSelectedEmployeeId('EMP-1001');
      if (stepNumber === 2 && !step2Done) {
        setActiveRole(UserRole.EMPLOYEE);
        setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
        await raiseEmployeeDispute(
          rahulStmt.id,
          'I completed 42 meetings, but the system shows only 40.'
        );
      } else if (stepNumber === 3 && rahulDispute && !step3Done) {
        setActiveRole(UserRole.BA);
        setActiveSection(NavSection.BA_DISPUTES);
        await simulateSourceCorrection(rahulDispute.id);
      } else if (stepNumber === 4 && rahulDispute && !step4Done) {
        setActiveRole(UserRole.BA);
        setActiveSection(NavSection.BA_DISPUTES);
        await triggerTargetedReSync(rahulDispute.id);
      } else if (stepNumber === 5 && !step5Done) {
        setActiveRole(UserRole.HR);
        setActiveSection(NavSection.HR_APPROVAL_LOCK);
        if (rahulStmt.status !== 'HR Approved') {
          await approveStatementByHr(rahulStmt.id);
        }
        await lockStatementPayout(rahulStmt.id);
      } else if (stepNumber === 6 && !step6Done) {
        setActiveRole(UserRole.FINANCE);
        setActiveSection(NavSection.FINANCE_DISBURSEMENT);
        if (rahulStmt.payoutBatchId === 'NONE') {
          await createPayoutBatchForLocked([rahulStmt.id]);
        } else {
          const batch = payoutBatches.find(
            (b) => b.batchNumber === rahulStmt.payoutBatchId
          );
          if (batch) {
            await advancePayoutBatchStatus(batch.id, 'Success');
          }
        }
      }
    } finally {
      setBusyStep(null);
    }
  };

  const steps = [
    {
      num: 1,
      title: '1. Initial Sync & Statement',
      detail: '40 mtgs × ₹50 = ₹2,000',
      done: step1Done,
      nav: NavSection.EMPLOYEE_STATEMENTS,
      role: UserRole.EMPLOYEE,
    },
    {
      num: 2,
      title: '2. Employee Dispute',
      detail: step2Done
        ? `Ticket ${rahulDispute?.ticketNumber} → BD BA`
        : '"Completed 42, shows 40"',
      done: step2Done,
      nav: NavSection.EMPLOYEE_STATEMENTS,
      role: UserRole.EMPLOYEE,
    },
    {
      num: 3,
      title: '3. BA Source Correction',
      detail: step3Done
        ? 'PRW-8841 & 8842 Fixed'
        : 'Fix 2 records in Prowl',
      done: step3Done,
      nav: NavSection.BA_DISPUTES,
      role: UserRole.BA,
    },
    {
      num: 4,
      title: '4. Targeted Re-Sync',
      detail: step4Done
        ? '42 mtgs · Revised ₹2,100'
        : 'Re-sync & recalculate',
      done: step4Done,
      nav: NavSection.BA_DISPUTES,
      role: UserRole.BA,
    },
    {
      num: 5,
      title: '5. HR Approval & Lock',
      detail: step5Done
        ? `Locked v${rahulStmt.lockVersion} (₹${rahulStmt.netAmount.toLocaleString('en-IN')})`
        : 'Approve & lock ₹2,100',
      done: step5Done,
      nav: NavSection.HR_APPROVAL_LOCK,
      role: UserRole.HR,
    },
    {
      num: 6,
      title: '6. Finance Payout',
      detail: step6Done
        ? `Disbursed · UTR ${rahulStmt.utrNumber}`
        : rahulStmt.payoutBatchId !== 'NONE'
        ? `Batch ${rahulStmt.payoutBatchId} (${rahulStmt.payoutStatus})`
        : 'Initiate & settle ₹2,100',
      done: step6Done,
      nav: NavSection.FINANCE_DISBURSEMENT,
      role: UserRole.FINANCE,
    },
  ];

  // Next actionable step
  const nextStep = !step2Done
    ? 2
    : !step3Done
    ? 3
    : !step4Done
    ? 4
    : !step5Done
    ? 5
    : !step6Done
    ? 6
    : null;

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3.5">
      <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">
                Live Demo Journey: Rahul Sharma (EMP-1001 · BD Manager)
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700">
                Meetings: {rahulStmt.eligibleLocalMeetings}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                FTA: ₹{rahulStmt.netAmount.toLocaleString('en-IN')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-700 font-medium">{rahulStmt.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-1">
          {steps.map((st) => {
            const isNext = nextStep === st.num;
            return (
              <div
                key={st.num}
                onClick={() => {
                  setSelectedEmployeeId('EMP-1001');
                  setActiveRole(st.role);
                  setActiveSection(st.nav);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-2 transition-colors ${
                  st.done
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-900'
                    : isNext
                    ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold truncate">
                    {st.title}
                  </span>
                  {st.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  ) : isNext ? (
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : null}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-600 truncate mt-0.5">
                  {st.detail}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {nextStep !== null && (
            <button
              onClick={() => handleRunStep(nextStep)}
              disabled={busyStep !== null || seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyStep !== null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {nextStep === 2
                  ? 'Run Step 2: Raise Dispute (42 vs 40)'
                  : nextStep === 3
                  ? 'Run Step 3: BA Source Correction'
                  : nextStep === 4
                  ? 'Run Step 4: Targeted Re-Sync (₹2,100)'
                  : nextStep === 5
                  ? 'Run Step 5: HR Approve & Lock'
                  : rahulStmt.payoutBatchId === 'NONE'
                  ? 'Run Step 6a: Generate Payout Batch'
                  : 'Run Step 6b: Mark Payout Success'}
              </span>
            </button>
          )}
          <button
            onClick={resetRahulDemoScenario}
            disabled={seeding || busyStep !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            title="Reset Rahul Sharma scenario back to initial 40 meetings (₹2,000)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>Reset Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
