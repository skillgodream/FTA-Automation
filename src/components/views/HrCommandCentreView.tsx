import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  ArrowRight,
  Calculator,
  Lock,
  Landmark,
  Wrench,
  Users,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const HrCommandCentreView: React.FC = () => {
  const {
    employees,
    statements,
    disputes,
    sourceRecords,
    activeRole,
    setActiveSection,
    setActiveRole,
    setSelectedEmployeeId,
  } = useFta();

  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>(
    'employees'
  );
  const [mobileExceptionTab, setMobileExceptionTab] = useState<
    'EMP-1001' | 'EMP-1002'
  >('EMP-1001');

  const totalNetFta = statements.reduce((acc, s) => acc + s.netAmount, 0);
  const totalLocalMeetings = statements.reduce(
    (acc, s) => acc + s.eligibleLocalMeetings,
    0
  );
  const totalOutstationDays = statements.reduce(
    (acc, s) => acc + s.outstationDays,
    0
  );

  const openDisputes = disputes.filter((d) => d.status !== 'Resolved');
  const lockedStatements = statements.filter((s) => s.payoutLocked);
  const disbursedStatements = statements.filter(
    (s) => s.payoutStatus === 'Success'
  );
  const unsyncedRecords = sourceRecords.filter(
    (r) => r.syncStatus !== 'Synced'
  );

  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
  const rahulDispute = disputes.find((d) => d.employeeId === 'EMP-1001');
  const rahulNeedsAttention =
    rahulStmt && (!rahulStmt.payoutLocked || unsyncedRecords.length > 0);

  const nehaStmt = statements.find((s) => s.employeeId === 'EMP-1002');
  const nehaDispute = disputes.find((d) => d.employeeId === 'EMP-1002');

  const attentionItemCount =
    openDisputes.filter((d) => d.employeeId !== 'EMP-1001').length +
    (rahulNeedsAttention ? 1 : 0);

  const greetingName =
    activeRole === UserRole.HR
      ? 'Vikram'
      : activeRole === UserRole.BA
      ? 'Ananya'
      : activeRole === UserRole.EMPLOYEE
      ? 'Rahul'
      : 'Suresh';

  const avatarStyles = [
    'bg-[#FDE68A] text-[#92400E]',
    'bg-[#D8CEF8] text-[#5B3CC4]',
    'bg-[#FECACA] text-[#991B1B]',
    'bg-[#CDE5D0] text-[#166534]',
    'bg-[#D5E1EC] text-[#1E40AF]',
  ];

  const departments = [
    'BD',
    'Operations',
    'B2B Sales',
    'Super Heroes',
    'Functional Leads',
  ];

  const deptMetrics = departments.map((dept) => {
    const deptEmps = employees.filter((e) => e.department === dept);
    const deptStmts = statements.filter((s) => s.department === dept);
    const localMtgs = deptStmts.reduce(
      (a, s) => a + s.eligibleLocalMeetings,
      0
    );
    const outDays = deptStmts.reduce((a, s) => a + s.outstationDays, 0);
    const totalAmount = deptStmts.reduce((a, s) => a + s.netAmount, 0);
    const lockedCount = deptStmts.filter((s) => s.payoutLocked).length;

    return {
      dept,
      headcount: deptEmps.length,
      localMtgs,
      outDays,
      totalAmount,
      lockedCount,
    };
  });

  const handleRahulAction = () => {
    setSelectedEmployeeId('EMP-1001');
    if (!rahulDispute) {
      setActiveRole(UserRole.EMPLOYEE);
      setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
    } else if (!rahulDispute.reSynced) {
      setActiveRole(UserRole.BA);
      setActiveSection(NavSection.BA_DISPUTES);
    } else if (!rahulStmt?.payoutLocked) {
      setActiveRole(UserRole.HR);
      setActiveSection(NavSection.HR_APPROVAL_LOCK);
    } else {
      setActiveRole(UserRole.FINANCE);
      setActiveSection(NavSection.FINANCE_DISBURSEMENT);
    }
  };

  const handleNehaAction = () => {
    setSelectedEmployeeId('EMP-1002');
    if (nehaDispute && !nehaDispute.reSynced) {
      setActiveRole(UserRole.BA);
      setActiveSection(NavSection.BA_DISPUTES);
    } else if (!nehaStmt?.payoutLocked) {
      setActiveRole(UserRole.HR);
      setActiveSection(NavSection.HR_APPROVAL_LOCK);
    } else {
      setActiveRole(UserRole.FINANCE);
      setActiveSection(NavSection.FINANCE_DISBURSEMENT);
    }
  };

  const rahulVerb = !rahulDispute
    ? 'Submit Dispute (+₹100)'
    : !rahulDispute.reSynced
    ? 'Sync Prowl & Recalculate'
    : !rahulStmt?.payoutLocked
    ? 'Approve Payout · ₹2,100'
    : 'Disburse Payout · ₹2,100';

  const nehaVerb =
    nehaDispute && !nehaDispute.reSynced
      ? 'Sync LMS & Recalculate'
      : !nehaStmt?.payoutLocked
      ? `Approve Payout · ₹${(nehaStmt?.netAmount ?? 3800).toLocaleString('en-IN')}`
      : `Disburse Payout · ₹${(nehaStmt?.netAmount ?? 3800).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 pb-6">
      {/* Clean Page Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-[14px] font-medium text-[#6B7280]">
            Hello {greetingName}! 👋 · October 2026 Cycle
          </p>
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight leading-tight mt-0.5">
            Overview
          </h1>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: EXCEPTIONS REQUIRING REVIEW (15% HUMAN INTERVENTION)
         ===================================================================== */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE0D6] text-[#B85D2B] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#B85D2B]" />
              {attentionItemCount} Active
            </span>
            <h2 className="text-[17px] font-semibold text-[#111827]">
              Exceptions Requiring Review (15% Intervention)
            </h2>
          </div>
          <span className="text-xs font-medium text-[#6B7280] hidden sm:inline">
            Disputed statements routed to BD & HR
          </span>
        </div>

        {/* MOBILE ONLY (< md): Small Actionable Tabs / Pills */}
        <div className="md:hidden space-y-2.5">
          {/* Small Pill Tabs for Switching Exceptions on Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {rahulStmt && (
              <button
                onClick={() => setMobileExceptionTab('EMP-1001')}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  mobileExceptionTab === 'EMP-1001'
                    ? 'bg-[#09090B] text-white shadow-xs'
                    : 'bg-white text-[#111827] border border-[#E5E7EB]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    rahulStmt.payoutLocked ? 'bg-[#2EAF53]' : 'bg-[#F59E0B]'
                  }`}
                />
                <span>Rahul Sharma</span>
                <span className="opacity-75">
                  ₹{rahulStmt.netAmount.toLocaleString('en-IN')}
                </span>
              </button>
            )}

            {nehaDispute && (
              <button
                onClick={() => setMobileExceptionTab('EMP-1002')}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  mobileExceptionTab === 'EMP-1002'
                    ? 'bg-[#09090B] text-white shadow-xs'
                    : 'bg-white text-[#111827] border border-[#E5E7EB]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    nehaStmt?.payoutLocked ? 'bg-[#2EAF53]' : 'bg-[#F59E0B]'
                  }`}
                />
                <span>{nehaDispute.employeeName}</span>
                <span className="opacity-75">
                  ₹{(nehaStmt?.netAmount ?? 3750).toLocaleString('en-IN')}
                </span>
              </button>
            )}
          </div>

          {/* Compact Single-Pill Action Bar for Selected Mobile Tab */}
          {mobileExceptionTab === 'EMP-1001' && rahulStmt && (
            <div className="bg-white rounded-2xl p-3.5 border border-[#E4CCBD] flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111827] truncate">
                  Rahul Sharma · {rahulStmt.eligibleLocalMeetings} → 42 Mtgs
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">
                  Mumbai (Prowl) · Claim +₹100
                </div>
              </div>
              <button
                onClick={handleRahulAction}
                className="px-3.5 py-2 rounded-full bg-[#09090B] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                {rahulVerb}
              </button>
            </div>
          )}

          {mobileExceptionTab === 'EMP-1002' && nehaDispute && (
            <div className="bg-white rounded-2xl p-3.5 border border-[#E4CCBD] flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111827] truncate">
                  Neha Kapoor ·{' '}
                  {nehaDispute.reSynced ? 6 : nehaDispute.systemRecordedValue} →{' '}
                  {nehaDispute.employeeReportedValue} Mtgs
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">
                  Delhi NCR (LMS) · Claim +₹{nehaDispute.financialImpact}
                </div>
              </div>
              <button
                onClick={handleNehaAction}
                className="px-3.5 py-2 rounded-full bg-[#09090B] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                {nehaVerb}
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP & TABLET (hidden md:grid): 2 Full Side-by-Side Actionable Cards */}
        <div className="hidden md:grid md:grid-cols-2 gap-5">
          {/* Actionable Card 1: Rahul Sharma */}
          {rahulStmt && (
            <div
              className={`bg-white rounded-[26px] p-6 shadow-[0_4px_20px_rgba(17,24,39,0.04)] border-2 flex flex-col justify-between gap-5 ${
                rahulStmt.payoutLocked
                  ? 'border-[#B6D8BA]'
                  : 'border-[#E4CCBD]'
              }`}
            >
              {/* Top: Employee Info & Amount */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      rahulStmt.payoutLocked
                        ? 'bg-[#CDE5D0] text-[#2E7D32]'
                        : 'bg-[#EFE0D6] text-[#B85D2B]'
                    }`}
                  >
                    {!rahulDispute
                      ? '48h Dispute Window'
                      : !rahulDispute.reSynced
                      ? 'Pending Prowl Sync'
                      : !rahulStmt.payoutLocked
                      ? 'Pending HR Approval'
                      : 'Approved for Payout'}
                  </span>
                  <h3 className="text-[22px] font-semibold text-[#111827] tracking-tight mt-2">
                    Rahul Sharma
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    BD Manager · Mumbai (Prowl) · BA:{' '}
                    {rahulStmt.baOwner.split(' (')[0]}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-medium text-[#9CA3AF]">
                    Statement Amount
                  </div>
                  <div className="text-[26px] font-bold text-[#111827] tracking-tight leading-none mt-1">
                    ₹{rahulStmt.netAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Middle: Clean 2-Box Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F4F5F7]">
                  <div className="text-[11px] font-medium text-[#6B7280]">
                    Synced in Prowl
                  </div>
                  <div className="text-[16px] font-bold text-[#111827] mt-0.5">
                    {rahulStmt.eligibleLocalMeetings} Meetings
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EFE0D6]/55">
                  <div className="text-[11px] font-medium text-[#B85D2B]">
                    Employee Claim (+₹100)
                  </div>
                  <div className="text-[16px] font-bold text-[#111827] mt-0.5">
                    42 Meetings
                  </div>
                </div>
              </div>

              {/* Bottom: Single Primary Black Pill CTA Button with Specific Verb */}
              <button
                onClick={handleRahulAction}
                className={`w-full py-3 px-5 rounded-full text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  rahulDispute?.reSynced && !rahulStmt.payoutLocked
                    ? 'bg-[#2EAF53] hover:bg-[#259646]'
                    : 'bg-[#09090B] hover:bg-[#1F2937]'
                }`}
              >
                {!rahulDispute ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : !rahulDispute.reSynced ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : !rahulStmt.payoutLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Landmark className="w-3.5 h-3.5" />
                )}
                <span>{rahulVerb}</span>
              </button>
            </div>
          )}

          {/* Actionable Card 2: Neha Kapoor */}
          {nehaDispute && (
            <div
              className={`bg-white rounded-[26px] p-6 shadow-[0_4px_20px_rgba(17,24,39,0.04)] border-2 flex flex-col justify-between gap-5 ${
                nehaStmt?.payoutLocked
                  ? 'border-[#B6D8BA]'
                  : 'border-[#E4CCBD]'
              }`}
            >
              {/* Top: Employee Info & Amount */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      nehaStmt?.payoutLocked
                        ? 'bg-[#CDE5D0] text-[#2E7D32]'
                        : 'bg-[#EFE0D6] text-[#B85D2B]'
                    }`}
                  >
                    {!nehaDispute.reSynced
                      ? 'Pending LMS Sync'
                      : !nehaStmt?.payoutLocked
                      ? 'Pending HR Approval'
                      : 'Approved for Payout'}
                  </span>
                  <h3 className="text-[22px] font-semibold text-[#111827] tracking-tight mt-2">
                    {nehaDispute.employeeName}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {nehaDispute.designation} · {nehaDispute.baseCity} (
                    {nehaDispute.sourceTool}) · BA:{' '}
                    {nehaDispute.assignedBa.split(' (')[0]}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-medium text-[#9CA3AF]">
                    Statement Amount
                  </div>
                  <div className="text-[26px] font-bold text-[#111827] tracking-tight leading-none mt-1">
                    ₹{(nehaStmt?.netAmount ?? 3750).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Middle: Clean 2-Box Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F4F5F7]">
                  <div className="text-[11px] font-medium text-[#6B7280]">
                    Synced in LMS
                  </div>
                  <div className="text-[16px] font-bold text-[#111827] mt-0.5">
                    {nehaDispute.reSynced
                      ? nehaDispute.employeeReportedValue
                      : nehaDispute.systemRecordedValue}{' '}
                    Meetings
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EFE0D6]/55">
                  <div className="text-[11px] font-medium text-[#B85D2B]">
                    Employee Claim (+₹{nehaDispute.financialImpact})
                  </div>
                  <div className="text-[16px] font-bold text-[#111827] mt-0.5">
                    {nehaDispute.employeeReportedValue} Meetings
                  </div>
                </div>
              </div>

              {/* Bottom: Single Primary Black Pill CTA Button with Specific Verb */}
              <button
                onClick={handleNehaAction}
                className={`w-full py-3 px-5 rounded-full text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  nehaDispute.reSynced && !nehaStmt?.payoutLocked
                    ? 'bg-[#2EAF53] hover:bg-[#259646]'
                    : 'bg-[#09090B] hover:bg-[#1F2937]'
                }`}
              >
                {!nehaDispute.reSynced ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : !nehaStmt?.payoutLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Landmark className="w-3.5 h-3.5" />
                )}
                <span>{nehaVerb}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: MONTHLY PAYOUT SUMMARY (4 PASTEL CARDS)
         ===================================================================== */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#111827]">
            Monthly Payout Summary
          </h2>
          <span className="text-xs text-[#6B7280] hidden sm:inline">
            5 Field Employees · 85% Zero-Touch Automation
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pastel 1: Soft Lavender */}
          <div className="bg-[#D8CEF8] rounded-[24px] p-5 flex flex-col justify-between min-h-[132px]">
            <div className="w-9 h-9 rounded-full bg-[#C5B6F2] flex items-center justify-center text-[#5B3CC4]">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-[#111827]/80">
                Total FTA Payout
              </div>
              <div className="text-[24px] font-bold text-[#111827] tracking-tight mt-0.5">
                ₹{totalNetFta.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Pastel 2: Soft Mint Green */}
          <div className="bg-[#CDE5D0] rounded-[24px] p-5 flex flex-col justify-between min-h-[132px]">
            <div className="w-9 h-9 rounded-full bg-[#B6D8BA] flex items-center justify-center text-[#2E7D32]">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-[#111827]/80">
                Verified Activity
              </div>
              <div className="text-[24px] font-bold text-[#111827] tracking-tight mt-0.5">
                {totalLocalMeetings} Mtgs · {totalOutstationDays}d
              </div>
            </div>
          </div>

          {/* Pastel 3: Soft Ice Blue */}
          <div className="bg-[#D5E1EC] rounded-[24px] p-5 flex flex-col justify-between min-h-[132px]">
            <div className="w-9 h-9 rounded-full bg-[#BDD0E2] flex items-center justify-center text-[#2B6CB0]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-[#111827]/80">
                Zero-Touch Cleared
              </div>
              <div className="text-[24px] font-bold text-[#111827] tracking-tight mt-0.5">
                {lockedStatements.length} of {statements.length} Staff
              </div>
            </div>
          </div>

          {/* Pastel 4: Soft Peach */}
          <div className="bg-[#EFE0D6] rounded-[24px] p-5 flex flex-col justify-between min-h-[132px]">
            <div className="w-9 h-9 rounded-full bg-[#E4CCBD] flex items-center justify-center text-[#B85D2B]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-[#111827]/80">
                Disbursed Payouts
              </div>
              <div className="text-[24px] font-bold text-[#111827] tracking-tight mt-0.5">
                {disbursedStatements.length} of {statements.length} Paid
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: STATEMENT LEDGER (ALL 5 EMPLOYEES & 5 DEPARTMENTS)
         ===================================================================== */}
      <div className="bg-white rounded-[26px] overflow-hidden shadow-[0_4px_20px_rgba(17,24,39,0.03)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F2F6]">
          <div>
            <h3 className="text-[17px] font-semibold text-[#111827]">
              October 2026 Statement Ledger
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              3 statements auto-cleared · 2 statements in exception review
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#F4F5F7] rounded-full self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Field Employees (5)
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'departments'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Departments (5)
            </button>
          </div>
        </div>

        {activeTab === 'employees' ? (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1F2F6] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role · City</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Synced Activity</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F2F6] text-[13px]">
                {statements.map((st, idx) => {
                  const needsAction = !st.payoutLocked;
                  const initials = st.employeeName
                    .split(' ')
                    .map((n) => n[0])
                    .join('');
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-[#F4F5F7]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              avatarStyles[idx % avatarStyles.length]
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="font-semibold text-[#111827]">
                            {st.employeeName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#4B5563]">
                        {st.designation} · {st.baseCity}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280]">
                        {st.sourceTool}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                        {st.eligibleLocalMeetings} Meetings ·{' '}
                        {st.outstationDays} Days
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#111827]">
                        ₹{st.netAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {needsAction ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFE0D6] text-[#B85D2B] text-[11px] font-semibold">
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CDE5D0] text-[#2E7D32] text-[11px] font-semibold">
                            Auto-Cleared
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEmployeeId(st.employeeId);
                            setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            needsAction
                              ? 'bg-[#09090B] text-white hover:bg-[#1F2937]'
                              : 'bg-[#F4F5F7] text-[#111827] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {needsAction ? 'Resolve' : 'View Statement'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1F2F6] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Headcount</th>
                  <th className="py-3 px-4 text-right">Meetings</th>
                  <th className="py-3 px-4 text-right">Outstation</th>
                  <th className="py-3 px-4 text-right">Approved</th>
                  <th className="py-3 px-4 text-right">Total FTA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F2F6] text-[13px]">
                {deptMetrics.map((dm) => (
                  <tr key={dm.dept} className="hover:bg-[#F4F5F7]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      {dm.dept}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                      {dm.headcount}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                      {dm.localMtgs} Meetings
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                      {dm.outDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#374151]">
                      {dm.lockedCount}/{dm.headcount}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#111827]">
                      ₹{dm.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
