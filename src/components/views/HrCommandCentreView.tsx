import React from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  ArrowUpRight,
  Database,
  Calculator,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

export const HrCommandCentreView: React.FC = () => {
  const {
    employees,
    statements,
    disputes,
    sourceRecords,
    connectors,
    payoutBatches,
    setActiveSection,
    setActiveRole,
    setSelectedEmployeeId,
  } = useFta();

  const totalNetFta = statements.reduce((acc, s) => acc + s.netAmount, 0);
  const totalLocalMeetings = statements.reduce(
    (acc, s) => acc + s.eligibleLocalMeetings,
    0
  );
  const totalOutstationDays = statements.reduce(
    (acc, s) => acc + s.outstationDays,
    0
  );
  const totalNewLaunch = statements.reduce(
    (acc, s) => acc + s.newLaunchMeetings,
    0
  );

  const openDisputes = disputes.filter((d) => d.status !== 'Resolved');
  const resolvedDisputes = disputes.filter((d) => d.status === 'Resolved');
  const lockedStatements = statements.filter((s) => s.payoutLocked);
  const disbursedStatements = statements.filter(
    (s) => s.payoutStatus === 'Success'
  );
  const unsyncedRecords = sourceRecords.filter((r) => r.syncStatus !== 'Synced');

  // Department Breakdown
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
    const deptDisputes = disputes.filter((d) => d.department === dept);
    const localMtgs = deptStmts.reduce((a, s) => a + s.eligibleLocalMeetings, 0);
    const outDays = deptStmts.reduce((a, s) => a + s.outstationDays, 0);
    const newLaunch = deptStmts.reduce((a, s) => a + s.newLaunchMeetings, 0);
    const totalAmount = deptStmts.reduce((a, s) => a + s.netAmount, 0);
    const lockedCount = deptStmts.filter((s) => s.payoutLocked).length;

    return {
      dept,
      headcount: deptEmps.length,
      localMtgs,
      outDays,
      newLaunch,
      totalAmount,
      disputeCount: deptDisputes.length,
      lockedCount,
    };
  });

  const pipelineStages = [
    {
      step: '01',
      label: 'Source Tool Sync',
      metric: `${sourceRecords.filter((r) => r.syncStatus === 'Synced').length}/${sourceRecords.length} Records`,
      sub: `${connectors.length} Connectors (${unsyncedRecords.length} holds)`,
      nav: NavSection.SOURCE_INTEGRATION,
      icon: Database,
    },
    {
      step: '02',
      label: 'Deterministic Calculation',
      metric: `₹${totalNetFta.toLocaleString('en-IN')}`,
      sub: `${totalLocalMeetings} Local · ${totalOutstationDays} Outstation · ${totalNewLaunch} Launch`,
      nav: NavSection.RATE_CITY_MASTER,
      icon: Calculator,
    },
    {
      step: '03',
      label: 'Employee Statements',
      metric: `${statements.length} Generated`,
      sub: `${statements.filter((s) => s.status === 'Confirmed by Employee').length} Confirmed · ${statements.filter((s) => s.status === 'Disputed').length} Disputed`,
      nav: NavSection.EMPLOYEE_STATEMENTS,
      icon: FileText,
    },
    {
      step: '04',
      label: 'BA Dispute & Re-Sync',
      metric: `${openDisputes.length} Open / ${resolvedDisputes.length} Resolved`,
      sub: 'Source-only correction policy enforced',
      nav: NavSection.BA_DISPUTES,
      icon: AlertTriangle,
    },
    {
      step: '05',
      label: 'HR Approval & Lock',
      metric: `${lockedStatements.length}/${statements.length} Locked`,
      sub: `${statements.filter((s) => s.status === 'Recalculated (Post-Dispute)').length} Post-Dispute Ready`,
      nav: NavSection.HR_APPROVAL_LOCK,
      icon: Lock,
    },
    {
      step: '06',
      label: 'Finance Disbursement',
      metric: `${disbursedStatements.length} Disbursed`,
      sub: `${payoutBatches.length} Payout Batch(es)`,
      nav: NavSection.FINANCE_DISBURSEMENT,
      icon: Landmark,
    },
  ];

  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Cycle: October 2026 (2026-10) · Deterministic Rule Engine v2.4 · Illustrative Rates Active
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            HR Command Centre
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedEmployeeId('EMP-1001');
              setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>Inspect Rahul Sharma Statement</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveSection(NavSection.HR_APPROVAL_LOCK)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open HR Approval & Lock Queue</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Cycle FTA Liability (Oct 2026)
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            ₹{totalNetFta.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Across {employees.length} active field employees · Illustrative tariff
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Synced Eligible Field Activities
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {totalLocalMeetings} Mtgs · {totalOutstationDays} Days
          </div>
          <div className="text-xs text-slate-500 mt-2">
            +{totalNewLaunch} New Launch mtgs · {unsyncedRecords.length} source hold(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            BA Dispute Resolution Queue
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {openDisputes.length} Active · {resolvedDisputes.length} Resolved
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Auto-routed by department & region · Zero direct overwrites
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Final Payout Lock & Disbursement
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {lockedStatements.length} Locked · {disbursedStatements.length} Paid
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Version-controlled lock gate before Finance batching
          </div>
        </div>
      </div>

      {/* End-to-End Automated Pipeline Architecture */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              01. End-to-End FTA Governance Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage to inspect live records and execute role-specific governance actions.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            SOURCE → SYNC → CALC → STATEMENT → DISPUTE → BA → RE-SYNC → LOCK → PAYOUT
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stg) => {
            const Icon = stg.icon;
            return (
              <button
                key={stg.step}
                onClick={() => setActiveSection(stg.nav)}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono font-semibold text-slate-500">
                    {stg.step}
                  </span>
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {stg.label}
                </div>
                <div className="text-sm font-bold font-mono tabular-nums text-blue-700 mt-1">
                  {stg.metric}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {stg.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Grid: Department Summary Table + Actionable Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Department Breakdown Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                02. Department-Wise FTA Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated across BD, Operations, B2B Sales, Super Heroes, and Functional Leads.
              </p>
            </div>
            <button
              onClick={() => setActiveSection(NavSection.EMPLOYEE_MASTER)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              View 20 Employees →
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-3 text-right">Headcount</th>
                  <th className="py-3 px-3 text-right">Local Mtgs</th>
                  <th className="py-3 px-3 text-right">Outstation</th>
                  <th className="py-3 px-3 text-right">New Launch</th>
                  <th className="py-3 px-3 text-right">Disputes</th>
                  <th className="py-3 px-4 text-right">Total Net FTA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {deptMetrics.map((dm) => (
                  <tr
                    key={dm.dept}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {dm.dept}
                      {dm.dept === 'Functional Leads' && (
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Includes Regional Trainers (CSV)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {dm.headcount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {dm.localMtgs}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {dm.outDays}d
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {dm.newLaunch}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {dm.disputeCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{dm.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 bg-slate-50 font-semibold text-xs text-slate-900">
                  <td className="py-3 px-4">Total (October 2026)</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {employees.length}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {totalLocalMeetings}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {totalOutstationDays}d
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {totalNewLaunch}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {disputes.length}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-700">
                    ₹{totalNetFta.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Column: Priority Governance & Spotlight Queue */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              03. Priority Governance & Exception Spotlight
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time items requiring Employee, BA, HR, or Finance action.
            </p>

            <div className="mt-4 space-y-3">
              {/* Spotlight 1: Rahul Sharma Live Status */}
              {rahulStmt && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Rahul Sharma (EMP-1001 · BD Manager)
                    </span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                      ₹{rahulStmt.netAmount.toLocaleString('en-IN')} ({rahulStmt.eligibleLocalMeetings} mtgs)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Status: <span className="font-medium text-slate-900">{rahulStmt.status}</span> · BA: {rahulStmt.baOwner} · Source: {rahulStmt.sourceTool}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedEmployeeId('EMP-1001');
                        setActiveRole(UserRole.EMPLOYEE);
                        setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      Open Statement
                    </button>
                    <button
                      onClick={() => {
                        setActiveRole(UserRole.BA);
                        setActiveSection(NavSection.BA_DISPUTES);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      BA Workspace
                    </button>
                    <button
                      onClick={() => {
                        setActiveRole(UserRole.HR);
                        setActiveSection(NavSection.HR_APPROVAL_LOCK);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      HR Lock Gate
                    </button>
                  </div>
                </div>
              )}

              {/* Spotlight 2: Active Disputes */}
              {disputes.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-900">
                        {d.ticketNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-800 truncate">
                        {d.employeeName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">{d.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {d.claimType}: System {d.systemRecordedValue} vs Claimed{' '}
                      {d.employeeReportedValue} (+₹{d.financialImpact}) · {d.assignedBa}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveRole(UserRole.BA);
                      setActiveSection(NavSection.BA_DISPUTES);
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md shrink-0 cursor-pointer"
                  >
                    Investigate
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>All calculations deterministic & auditable</span>
            </div>
            <button
              onClick={() => setActiveSection(NavSection.AUDIT_REPORTS)}
              className="font-medium text-slate-900 hover:underline cursor-pointer"
            >
              Inspect Audit Trail →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
