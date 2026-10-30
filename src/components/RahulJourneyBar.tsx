import React, { useState } from 'react';
import { useFta } from '../context/FtaContext';
import { NavSection, UserRole } from '../types/fta';
import { CheckCircle2, RotateCcw, Play, Loader2, ArrowRight } from 'lucide-react';

export const RahulJourneyBar: React.FC = () => {
  const {
    statements,
    disputes,
    activeSection,
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

  const [busy, setBusy] = useState<boolean>(false);

  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
  const rahulDispute = disputes.find((d) => d.employeeId === 'EMP-1001');

  if (!rahulStmt) return null;

  const step1Done = true; // Auto-pull completed
  const step2Done = true; // Auto-calculate completed (40 × ₹50 = ₹2,000)
  const step3Done =
    Boolean(rahulDispute) || rahulStmt.eligibleLocalMeetings >= 42; // Employee raised dispute within 48h window
  const step4Done = Boolean(
    rahulDispute?.reSynced || rahulStmt.eligibleLocalMeetings >= 42
  ); // BD/BA fixed in source & recalculated to ₹2,100
  const step5Done = Boolean(rahulStmt.payoutLocked); // HR approved exception
  const step6Done = rahulStmt.payoutStatus === 'Success'; // Disbursed

  const nextActionStep = !step3Done
    ? 3
    : !step4Done
    ? 4
    : !step5Done
    ? 5
    : !step6Done
    ? 6
    : null;

  const handleRunNextStep = async () => {
    if (!nextActionStep) return;
    setBusy(true);
    try {
      setSelectedEmployeeId('EMP-1001');
      if (nextActionStep === 3) {
        setActiveRole(UserRole.EMPLOYEE);
        setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
        await raiseEmployeeDispute(
          rahulStmt.id,
          'I completed 42 meetings, but the system shows only 40.'
        );
      } else if (nextActionStep === 4) {
        setActiveRole(UserRole.BA);
        setActiveSection(NavSection.BA_DISPUTES);
        await triggerTargetedReSync(rahulDispute?.id || 'DSP-1042');
      } else if (nextActionStep === 5) {
        setActiveRole(UserRole.HR);
        setActiveSection(NavSection.HR_APPROVAL_LOCK);
        await lockStatementPayout(rahulStmt.id);
      } else if (nextActionStep === 6) {
        setActiveRole(UserRole.FINANCE);
        setActiveSection(NavSection.FINANCE_DISBURSEMENT);
        await createPayoutBatchForLocked([rahulStmt.id]);
      }
    } finally {
      setBusy(false);
    }
  };

  const flowSteps = [
    {
      num: 1,
      label: '1. Auto-Pull Meetings',
      sub: '40 Pulled · 2 Held',
      done: step1Done,
      nav: NavSection.SOURCE_INTEGRATION,
      role: UserRole.HR,
    },
    {
      num: 2,
      label: '2. Auto-Calculate',
      sub: `${rahulStmt.eligibleLocalMeetings} × ₹50 = ₹${rahulStmt.netAmount.toLocaleString('en-IN')}`,
      done: step2Done,
      nav: NavSection.RATE_CITY_MASTER,
      role: UserRole.HR,
    },
    {
      num: 3,
      label: '3. Employee View (48h)',
      sub: step3Done ? 'Dispute Raised' : 'Dispute Only',
      done: step3Done,
      nav: NavSection.EMPLOYEE_STATEMENTS,
      role: UserRole.EMPLOYEE,
    },
    {
      num: 4,
      label: '4. BD / BA Intervention',
      sub: step4Done ? 'Fixed → ₹2,100' : 'Fix in Source',
      done: step4Done,
      nav: NavSection.BA_DISPUTES,
      role: UserRole.BA,
    },
    {
      num: 5,
      label: '5. HR Exception Approval',
      sub: step5Done ? 'Approved' : 'Exceptions Only',
      done: step5Done,
      nav: NavSection.HR_APPROVAL_LOCK,
      role: UserRole.HR,
    },
    {
      num: 6,
      label: '6. Disbursement',
      sub: step6Done ? 'Paid (UTR)' : 'Bank Transfer',
      done: step6Done,
      nav: NavSection.FINANCE_DISBURSEMENT,
      role: UserRole.FINANCE,
    },
  ];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 shrink-0">
      <div className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Interactive 6-Step System Flow Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {flowSteps.map((st, idx) => {
            const isCurrentScreen = activeSection === st.nav;
            const isNextAction = nextActionStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <button
                  onClick={() => {
                    setSelectedEmployeeId('EMP-1001');
                    setActiveRole(st.role);
                    setActiveSection(st.nav);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-left transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                    isCurrentScreen
                      ? 'bg-white text-slate-900 border-white font-bold shadow-xs'
                      : isNextAction
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/50 font-semibold'
                      : st.done
                      ? 'bg-slate-800/90 text-emerald-300 border-slate-700/80 hover:bg-slate-800'
                      : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {st.done ? (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrentScreen ? 'text-emerald-600' : 'text-emerald-400'
                      }`}
                    />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isNextAction ? 'bg-amber-400' : 'bg-slate-500'
                      }`}
                    />
                  )}
                  <div>
                    <div className="text-[11px] leading-tight">{st.label}</div>
                    <div
                      className={`text-[10px] font-mono leading-tight ${
                        isCurrentScreen
                          ? 'text-slate-500'
                          : isNextAction
                          ? 'text-amber-200/90'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.sub}
                    </div>
                  </div>
                </button>
                {idx < flowSteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 hidden xl:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Single 1-Click Demo Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {nextActionStep !== null ? (
            <button
              onClick={handleRunNextStep}
              disabled={busy || seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <Play className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              )}
              <span>
                {nextActionStep === 3
                  ? 'Step 3: Employee Raises Dispute'
                  : nextActionStep === 4
                  ? 'Step 4: BD Fixes & Recalculates (₹2,100)'
                  : nextActionStep === 5
                  ? 'Step 5: HR Approves Exception'
                  : 'Step 6: Disburse ₹2,100'}
              </span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400 px-2">
              Flow Complete · ₹2,100 Disbursed
            </span>
          )}

          <button
            onClick={resetRahulDemoScenario}
            disabled={seeding || busy}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Flow"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
