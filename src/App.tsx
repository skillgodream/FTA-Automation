import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { FtaProvider, useFta } from './context/FtaContext';
import { NavSection, UserRole } from './types/fta';
import { HrCommandCentreView } from './components/views/HrCommandCentreView';
import { EmployeeStatementsView } from './components/views/EmployeeStatementsView';
import { BaDisputeWorkspaceView } from './components/views/BaDisputeWorkspaceView';
import { SourceIntegrationView } from './components/views/SourceIntegrationView';
import { HrApprovalLockView } from './components/views/HrApprovalLockView';
import { FinanceDisbursementView } from './components/views/FinanceDisbursementView';
import { EmployeeMasterView } from './components/views/EmployeeMasterView';
import { RateCityMasterView } from './components/views/RateCityMasterView';
import { AuditReportsView } from './components/views/AuditReportsView';
import {
  Home,
  FileText,
  Wrench,
  Database,
  CheckCircle2,
  Landmark,
  Users,
  Sliders,
  History,
  Loader2,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  Play,
  Menu,
  X,
} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class FtaErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-[28px] p-6 space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-[#111827]">
              View Interrupted
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-neutral-800 cursor-pointer"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ROLES: UserRole[] = [
  UserRole.HR,
  UserRole.EMPLOYEE,
  UserRole.BA,
  UserRole.FINANCE,
  UserRole.HR_ADMIN,
];

const FtaWorkspaceShell: React.FC = () => {
  const {
    user,
    authLoading,
    dataLoading,
    seeding,
    activeRole,
    setActiveRole,
    activeSection,
    setActiveSection,
    setSelectedEmployeeId,
    signIn,
    signInDirectEnterprise,
    resetRahulDemoScenario,
    disputes,
    statements,
    raiseEmployeeDispute,
    triggerTargetedReSync,
    lockStatementPayout,
    createPayoutBatchForLocked,
  } = useFta();

  const [stepBusy, setStepBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openDisputesCount = disputes.filter(
    (d) => d.status !== 'Resolved'
  ).length;
  const pendingApprovalCount = statements.filter((s) => !s.payoutLocked).length;

  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
  const rahulDispute = disputes.find((d) => d.employeeId === 'EMP-1001');

  const step3Done =
    Boolean(rahulDispute) || (rahulStmt?.eligibleLocalMeetings ?? 0) >= 42;
  const step4Done = Boolean(
    rahulDispute?.reSynced || (rahulStmt?.eligibleLocalMeetings ?? 0) >= 42
  );
  const step5Done = Boolean(rahulStmt?.payoutLocked);
  const step6Done = rahulStmt?.payoutStatus === 'Success';

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
    if (!nextActionStep || !rahulStmt || stepBusy) return;
    setStepBusy(true);
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
      setStepBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#111827]">
          <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
          <span>FTACONNEX.</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
        <header className="flex items-center justify-between gap-8 px-8 py-5">
          <a
            href="#top"
            className="text-2xl font-black tracking-tight whitespace-nowrap shrink-0"
          >
            <span className="text-[#111827]">FTA</span>
            <span className="text-[#C3B3F2]">CONNEX.</span>
          </a>
          <button
            onClick={() => signInDirectEnterprise(UserRole.HR)}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-sm w-full bg-white rounded-[28px] p-8 space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#6B7280]">
                Field Travel Allowance
              </div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
                Zero-Touch by Default.
              </h1>
              <p className="text-xs text-[#6B7280]">
                Auto-pull meetings · Auto-calculate payout · Human intervention
                only on disputes.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => signInDirectEnterprise(UserRole.HR)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-[#111827] bg-[#F4F5F7] hover:bg-[#E5E7EB] rounded-full transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#111827]" />
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const flowNavItems = [
    {
      id: NavSection.SOURCE_INTEGRATION,
      label: 'Meeting Sync',
      icon: Database,
      role: UserRole.HR,
    },
    {
      id: NavSection.RATE_CITY_MASTER,
      label: 'Rate & City Rules',
      icon: Sliders,
      role: UserRole.HR,
    },
    {
      id: NavSection.EMPLOYEE_STATEMENTS,
      label: 'Employee Statements',
      icon: FileText,
      role: UserRole.EMPLOYEE,
    },
    {
      id: NavSection.BA_DISPUTES,
      label: 'Dispute Resolution',
      icon: Wrench,
      role: UserRole.BA,
      badge: openDisputesCount > 0 ? String(openDisputesCount) : undefined,
    },
    {
      id: NavSection.HR_APPROVAL_LOCK,
      label: 'Exception Approvals',
      icon: CheckCircle2,
      role: UserRole.HR,
      badge:
        pendingApprovalCount > 0 ? String(pendingApprovalCount) : undefined,
    },
    {
      id: NavSection.FINANCE_DISBURSEMENT,
      label: 'Bank Disbursement',
      icon: Landmark,
      role: UserRole.FINANCE,
    },
  ];

  const directoryNavItems = [
    {
      id: NavSection.EMPLOYEE_MASTER,
      label: 'Field Employees',
      icon: Users,
      role: UserRole.HR,
    },
    {
      id: NavSection.AUDIT_REPORTS,
      label: 'Audit Trail',
      icon: History,
      role: UserRole.HR,
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full p-5">
      <div className="space-y-6">
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            onClick={() => {
              setActiveSection(NavSection.HR_COMMAND);
              setMobileMenuOpen(false);
            }}
            className="text-2xl font-black tracking-tight cursor-pointer flex items-center select-none"
          >
            <span className="text-[#111827]">FTA</span>
            <span className="text-[#C3B3F2]">CONNEX.</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-full hover:bg-[#F4F5F7] text-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Button */}
        <div>
          <button
            onClick={() => {
              setActiveRole(UserRole.HR);
              setActiveSection(NavSection.HR_COMMAND);
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-2xl text-[13px] transition-all flex items-center gap-3 cursor-pointer ${
              activeSection === NavSection.HR_COMMAND
                ? 'bg-[#09090B] text-white font-semibold shadow-xs'
                : 'text-[#374151] hover:bg-[#F4F5F7] font-medium'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>
        </div>

        {/* Operations & Payout Workflow */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Payout Operations
          </div>
          {flowNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.role) setActiveRole(item.role);
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-[13px] transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#D8CEF8] text-[#111827] font-semibold'
                    : 'text-[#374151] hover:bg-[#F4F5F7] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EFE0D6] text-[#B85D2B] shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Directory & Audit */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Records
          </div>
          {directoryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.role) setActiveRole(item.role);
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-[13px] transition-all flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#D8CEF8] text-[#111827] font-semibold'
                    : 'text-[#374151] hover:bg-[#F4F5F7] font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Reset Controls */}
      <div className="pt-4 border-t border-[#F1F2F6] space-y-2.5">
        <div className="relative flex items-center rounded-2xl bg-[#F4F5F7] px-2.5 py-2">
          <div className="w-8 h-8 rounded-full bg-[#D8CEF8] text-[#4C1D95] font-bold text-xs flex items-center justify-center shrink-0">
            VR
          </div>
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as UserRole)}
            aria-label="Select Role"
            className="appearance-none bg-transparent pl-2.5 pr-6 py-1 text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer w-full"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                Vikram · {r}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#111827] pointer-events-none absolute right-3" />
        </div>

        <button
          onClick={resetRahulDemoScenario}
          disabled={seeding || stepBusy}
          className="w-full py-2 px-3 rounded-2xl border border-[#E5E7EB] hover:bg-[#F4F5F7] text-xs font-semibold text-[#374151] flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${
              seeding || dataLoading ? 'animate-spin' : ''
            }`}
          />
          <span>Reset Cycle Data</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111827] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-[#E5E7EB]/80 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full z-10 shadow-xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Top Utility Bar */}
        <header className="bg-[#F4F5F7] px-5 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-[#E5E7EB]/70">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-full bg-white text-[#111827] shadow-2xs"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs font-medium text-[#6B7280] hidden sm:block">
              October 2026 Payout Cycle · 5 Field Employees
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {nextActionStep !== null && (
              <button
                onClick={handleRunNextStep}
                disabled={stepBusy || seeding}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#09090B] hover:bg-neutral-800 rounded-full transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {stepBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-white" />
                )}
                <span>
                  {nextActionStep === 3
                    ? 'Submit Rahul Dispute'
                    : nextActionStep === 4
                    ? 'Sync Prowl & Recalculate'
                    : nextActionStep === 5
                    ? 'Approve Rahul Payout'
                    : 'Disburse Rahul Payout'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 sm:px-8 py-6">
          {activeSection === NavSection.HR_COMMAND && <HrCommandCentreView />}
          {activeSection === NavSection.EMPLOYEE_STATEMENTS && (
            <EmployeeStatementsView />
          )}
          {activeSection === NavSection.BA_DISPUTES && (
            <BaDisputeWorkspaceView />
          )}
          {activeSection === NavSection.SOURCE_INTEGRATION && (
            <SourceIntegrationView />
          )}
          {activeSection === NavSection.HR_APPROVAL_LOCK && (
            <HrApprovalLockView />
          )}
          {activeSection === NavSection.FINANCE_DISBURSEMENT && (
            <FinanceDisbursementView />
          )}
          {activeSection === NavSection.EMPLOYEE_MASTER && (
            <EmployeeMasterView />
          )}
          {activeSection === NavSection.RATE_CITY_MASTER && (
            <RateCityMasterView />
          )}
          {activeSection === NavSection.AUDIT_REPORTS && <AuditReportsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FtaErrorBoundary>
      <FtaProvider>
        <FtaWorkspaceShell />
      </FtaProvider>
    </FtaErrorBoundary>
  );
}
