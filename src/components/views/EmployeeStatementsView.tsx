import React, { useState, useEffect } from 'react';
import { useFta } from '../../context/FtaContext';
import { NavSection, UserRole } from '../../types/fta';
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  Lock,
  Calculator,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const EmployeeStatementsView: React.FC = () => {
  const {
    employees,
    statements,
    disputes,
    selectedEmployeeId,
    setSelectedEmployeeId,
    confirmEmployeeStatement,
    raiseEmployeeDispute,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showEmailSimulator, setShowEmailSimulator] = useState<boolean>(true);
  const [disputeReplyText, setDisputeReplyText] = useState<string>(
    'I completed 42 meetings, but the system shows only 40.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeStmt =
    statements.find((s) => s.employeeId === selectedEmployeeId) || statements[0];
  const activeEmp = employees.find((e) => e.id === activeStmt?.employeeId);
  const activeDispute = disputes.find((d) => d.employeeId === activeStmt?.employeeId);

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
    setFeedbackMsg(null);
  }, [activeStmt?.employeeId, activeStmt?.eligibleLocalMeetings, activeStmt?.baseCity]);

  if (!activeStmt || !activeEmp) {
    return null;
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await confirmEmployeeStatement(activeStmt.id);
      setFeedbackMsg(
        `Statement ${activeStmt.id} confirmed by ${activeStmt.employeeName}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReplyText.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await raiseEmployeeDispute(
        activeStmt.id,
        disputeReplyText.trim()
      );
      if (ticket) {
        setFeedbackMsg(
          `Dispute Ticket ${ticket.ticketNumber} created and auto-routed to ${ticket.assignedBa}.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStatements = statements.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Monthly Statement Dispatch · Transparent Calculation Breakdown · Simulated Email Reply
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Employee Statements
          </h1>
        </div>

        {/* Employee Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-600">
            Inspect Employee:
          </label>
          <select
            value={activeStmt.employeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          >
            {employees.map((emp) => {
              const st = statements.find((s) => s.employeeId === emp.id);
              return (
                <option key={emp.id} value={emp.id}>
                  {emp.id} · {emp.name} ({emp.designation} · {emp.baseCity}) — ₹
                  {st ? st.netAmount.toLocaleString('en-IN') : '0'}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => setShowEmailSimulator((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>
              {showEmailSimulator
                ? 'Hide Email Statement Simulator'
                : 'Open Email Statement Simulator'}
            </span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-blue-950">{feedbackMsg}</div>
          {activeDispute && (
            <button
              onClick={() => {
                setActiveRole(UserRole.BA);
                setActiveSection(NavSection.BA_DISPUTES);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
            >
              <span>Open BA Dispute Workspace ({activeDispute.ticketNumber})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Selected Employee Statement Detail + Email Statement Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Official Statement Card */}
        <div
          className={`${
            showEmailSimulator ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6`}
        >
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-700">
                    {activeStmt.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Cycle: {activeStmt.month}</span>
                  <span aria-hidden="true">·</span>
                  <span>Source: {activeStmt.sourceTool}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {activeStmt.employeeName} — {activeStmt.designation}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Department: {activeStmt.department} · Base City:{' '}
                  {activeStmt.baseCity} ({activeStmt.cityCategory}) · Assigned BA:{' '}
                  {activeStmt.baOwner}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-slate-500">Net Payable FTA</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  ₹{activeStmt.netAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-medium text-blue-700 mt-0.5">
                  {activeStmt.status}
                  {activeStmt.payoutLocked ? ` · Locked v${activeStmt.lockVersion}` : ''}
                </div>
              </div>
            </div>

            {/* Component Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 pr-3">Allowance Component</th>
                    <th className="py-2.5 px-3 text-right">Synced Quantity</th>
                    <th className="py-2.5 px-3 text-right">
                      Applicable Rate (Illustrative)
                    </th>
                    <th className="py-2.5 px-3">Business Rule Applied</th>
                    <th className="py-2.5 pl-3 text-right">Calculated Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  <tr>
                    <td className="py-3 pr-3 font-medium text-slate-900">
                      Local Field Meetings
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {activeStmt.eligibleLocalMeetings} meetings
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      ₹{activeStmt.localRate} / meeting
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {activeStmt.designation} · {activeStmt.cityCategory} rate
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{activeStmt.localAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 pr-3 font-medium text-slate-900">
                      New Launch Activation
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {activeStmt.newLaunchMeetings} meetings
                      {activeStmt.newLaunchRuleExcluded > 0 && (
                        <span className="block text-[11px] text-amber-700">
                          ({activeStmt.newLaunchRuleExcluded} excluded by rule)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      ₹{activeStmt.newLaunchRate} / meeting
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      ₹50/mtg · New-City Outstation Rule enforced
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{activeStmt.newLaunchAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 pr-3 font-medium text-slate-900">
                      Outstation Travel Allowance
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {activeStmt.outstationDays} days
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      ₹{activeStmt.outstationDailyRate} / day
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {activeStmt.outstationRateType}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{activeStmt.outstationAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 text-xs text-slate-600">
                    <td colSpan={4} className="py-2.5 pr-3 text-right">
                      Gross Calculated FTA · Designation Max Claim Cap (₹
                      {activeStmt.maxClaimLimit.toLocaleString('en-IN')})
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                      ₹{activeStmt.grossAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900">
                    <td colSpan={4} className="py-3 pr-3 text-right">
                      Net Payable FTA ({activeStmt.month})
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums text-sm text-blue-700">
                      ₹{activeStmt.netAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Transparent Formula Trace */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deterministic Formula Audit Trace</span>
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  Illustrative Tariff · Pending HR Policy Sign-Off
                </span>
              </div>
              <p className="text-xs font-mono text-slate-700 leading-relaxed">
                {activeStmt.calculationTrace}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {activeStmt.payoutLocked ? (
                <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Final Payout Locked (v{activeStmt.lockVersion})
                </span>
              ) : activeDispute ? (
                <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Linked Dispute Ticket: {activeDispute.ticketNumber} ({activeDispute.status})
                </span>
              ) : (
                <span>Awaiting employee confirmation or dispute submission.</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleConfirm}
                disabled={
                  submitting ||
                  activeStmt.payoutLocked ||
                  activeStmt.status === 'Confirmed by Employee'
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Statement</span>
              </button>

              <button
                onClick={() => setShowEmailSimulator(true)}
                disabled={submitting || activeStmt.payoutLocked}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Raise Dispute</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Simulated Email Statement & Employee Reply Interaction */}
        {showEmailSimulator && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-blue-700">
                    Simulated Email Dispatch & Reply Channel
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    Monthly FTA Statement Email
                  </h3>
                </div>
                <Mail className="w-4 h-4 text-slate-400" />
              </div>

              {/* Email Envelope */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>From: fta-statements@enterprise-hr.in</span>
                  <span className="font-mono">Oct 2026</span>
                </div>
                <div className="text-slate-700">
                  To: <span className="font-mono font-medium">{activeEmp.email}</span>
                </div>
                <div className="font-semibold text-slate-900 pt-1 border-t border-slate-200">
                  Subject: [FTA Statement] {activeEmp.name} ({activeEmp.id}) — Net
                  Payable ₹{activeStmt.netAmount.toLocaleString('en-IN')}
                </div>
                <div className="pt-2 text-slate-600 leading-relaxed space-y-1.5">
                  <p>Hi {activeEmp.name.split(' ')[0]},</p>
                  <p>
                    Your automated Field Travel Allowance statement for{' '}
                    <strong>{activeStmt.month}</strong> has been generated from{' '}
                    <strong>{activeStmt.sourceTool}</strong>:
                  </p>
                  <p className="font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 text-slate-800">
                    • Eligible Local Meetings: {activeStmt.eligibleLocalMeetings} × ₹
                    {activeStmt.localRate} = ₹
                    {activeStmt.localAmount.toLocaleString('en-IN')}
                    <br />• New Launch Meetings: {activeStmt.newLaunchMeetings} × ₹
                    {activeStmt.newLaunchRate} = ₹
                    {activeStmt.newLaunchAmount.toLocaleString('en-IN')}
                    <br />• Outstation Travel: {activeStmt.outstationDays} days = ₹
                    {activeStmt.outstationAmount.toLocaleString('en-IN')}
                    <br />• <strong>Total Net FTA: ₹{activeStmt.netAmount.toLocaleString('en-IN')}</strong>
                  </p>
                  <p>
                    Reply directly to this email if you observe a meeting or
                    travel discrepancy. Your reply will be parsed by the Dispute
                    Detection Engine and routed to <strong>{activeEmp.baOwner}</strong>.
                  </p>
                </div>
              </div>

              {/* Employee Reply Form */}
              <form onSubmit={handleSendDispute} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Employee Email Reply (Natural Language Dispute)
                  </label>
                  {activeEmp.id === 'EMP-1001' && (
                    <button
                      type="button"
                      onClick={() =>
                        setDisputeReplyText(
                          'I completed 42 meetings, but the system shows only 40.'
                        )
                      }
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Use Rahul Demo Text
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={disputeReplyText}
                  onChange={(e) => setDisputeReplyText(e.target.value)}
                  disabled={activeStmt.payoutLocked || submitting}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="Describe the discrepancy in plain language..."
                />
                <div className="text-[11px] text-slate-500">
                  Gemini 3.8 Flash interprets this message only to extract
                  disputed meeting counts and route a ticket to the assigned BA.
                </div>
                <button
                  type="submit"
                  disabled={submitting || activeStmt.payoutLocked}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    Send Reply & Generate BA Dispute Ticket
                  </span>
                </button>
              </form>
            </div>

            {activeDispute && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Active Ticket: {activeDispute.ticketNumber}</span>
                  <span className="text-blue-700">{activeDispute.status}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {activeDispute.aiInterpretation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All 20 Employee Statements Registry Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              All Monthly Employee Statements ({filteredStatements.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any employee row to inspect their calculation trace or simulate an email reply.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {[
              'ALL',
              'Generated',
              'Disputed',
              'Recalculated (Post-Dispute)',
              'Confirmed by Employee',
              'HR Approved',
              'Payout Locked',
              'Disbursed',
            ].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Statements' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Emp ID</th>
                <th className="py-3 px-3">Employee & Designation</th>
                <th className="py-3 px-3">Department · City</th>
                <th className="py-3 px-3">Source Tool</th>
                <th className="py-3 px-3 text-right">Local Mtgs</th>
                <th className="py-3 px-3 text-right">New Launch</th>
                <th className="py-3 px-3 text-right">Outstation</th>
                <th className="py-3 px-3 text-right">Net FTA</th>
                <th className="py-3 px-4">Statement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredStatements.map((st) => {
                const isSelected = st.employeeId === activeStmt.employeeId;
                return (
                  <tr
                    key={st.id}
                    onClick={() => setSelectedEmployeeId(st.employeeId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {st.employeeId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">
                        {st.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {st.designation}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {st.department} · {st.baseCity} ({st.cityCategory})
                    </td>
                    <td className="py-3 px-3 text-slate-600">{st.sourceTool}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {st.eligibleLocalMeetings} × ₹{st.localRate}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {st.newLaunchMeetings} (₹{st.newLaunchAmount})
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {st.outstationDays}d (₹{st.outstationAmount})
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{st.netAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${
                          st.status === 'Disputed'
                            ? 'text-amber-700'
                            : st.status === 'Payout Locked' ||
                              st.status === 'Disbursed'
                            ? 'text-emerald-700'
                            : st.status === 'Recalculated (Post-Dispute)'
                            ? 'text-blue-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {st.status}
                      </span>
                      {st.disputeTicketId !== 'NONE' && (
                        <span className="block text-[11px] font-mono text-slate-500">
                          Ticket: {st.disputeTicketId}
                        </span>
                      )}
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
