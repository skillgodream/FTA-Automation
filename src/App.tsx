import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FtaProvider, useFta } from './context/FtaContext';
import { NavSection, UserRole } from './types/fta';
import { RahulJourneyBar } from './components/RahulJourneyBar';
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
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Database,
  Lock,
  Landmark,
  Users,
  Sliders,
  History,
  LogOut,
  ShieldCheck,
  Loader2,
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
    console.error('Uncaught application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Application State Notice
            </h2>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
              {this.state.errorMessage}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: NavSection.HR_COMMAND,
    label: '1. HR Command Centre',
    shortLabel: 'Command Centre',
    icon: LayoutDashboard,
  },
  {
    id: NavSection.EMPLOYEE_STATEMENTS,
    label: '2. Employee Statements',
    shortLabel: 'Statements',
    icon: FileText,
  },
  {
    id: NavSection.BA_DISPUTES,
    label: '3. BA Dispute Management',
    shortLabel: 'BA Disputes',
    icon: AlertTriangle,
  },
  {
    id: NavSection.SOURCE_INTEGRATION,
    label: '4. Source Data & Integration',
    shortLabel: 'Source Sync',
    icon: Database,
  },
  {
    id: NavSection.HR_APPROVAL_LOCK,
    label: '5. HR Approval & Payout Lock',
    shortLabel: 'HR Lock',
    icon: Lock,
  },
  {
    id: NavSection.FINANCE_DISBURSEMENT,
    label: '6. Finance Disbursement',
    shortLabel: 'Finance',
    icon: Landmark,
  },
  {
    id: NavSection.EMPLOYEE_MASTER,
    label: '7. Employee Master',
    shortLabel: 'Employees',
    icon: Users,
  },
  {
    id: NavSection.RATE_CITY_MASTER,
    label: '8. Rate & City Master',
    shortLabel: 'Rates & Cities',
    icon: Sliders,
  },
  {
    id: NavSection.AUDIT_REPORTS,
    label: '9. Audit & Reports',
    shortLabel: 'Audit Logs',
    icon: History,
  },
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
    disputes,
    statements,
    signIn,
    signOut,
  } = useFta();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Initializing FTA Automation Platform...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between">
        {/* Clean 3-Zone Top Bar Contract */}
        <header className="flex items-center justify-between gap-8 px-8 py-4 bg-white border-b border-slate-200">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            FTA Automation Platform
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#pipeline"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pipeline Architecture
            </a>
            <a
              href="#rules"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Calculation Engine
            </a>
            <a
              href="#disputes"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Dispute Routing
            </a>
            <a
              href="#demo"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Rahul Sharma Scenario
            </a>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={signIn}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        </header>

        {/* Main Enterprise Sign-In Hero */}
        <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 space-y-6">
            <div className="text-xs font-medium text-blue-700">
              Enterprise Field Travel Allowance (FTA) Governance Suite
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight max-w-2xl"
              style={{ textWrap: 'balance' }}
            >
              Automated Field Travel Allowance Calculation, BA Dispute Routing &
              Payout Lock
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              End-to-end financial integrity from Prowl, LeadSquared, and
              Regional Trainer CSV sync to deterministic allowance calculation,
              employee statement confirmation, Gemini-assisted dispute
              classification, source-only correction, HR final payout lock, and
              Finance disbursement.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={signIn}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate with Google to Launch Platform</span>
              </button>
              <span className="text-xs text-slate-500">
                Automatically provisions 20 employees & the live Rahul Sharma
                BD Manager scenario.
              </span>
            </div>
          </div>

          <div
            id="pipeline"
            className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-semibold text-slate-900 text-sm">
                01. Deterministic Calculation Engine
              </div>
              <p className="text-slate-600 leading-relaxed">
                Zero AI in financial math. Computes Local Meetings, New Launch
                (₹50 with New-City Outstation Rule), Special City Outstation
                (₹1,200/day), Own-Vehicle rates (₹500 Tier 1 / ₹400 Tier 2-3),
                and Designation Max Claim Caps.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-semibold text-slate-900 text-sm">
                02. Source-Only BA Dispute Governance
              </div>
              <p className="text-slate-600 leading-relaxed">
                Gemini 3.8 Flash interprets natural-language employee dispute
                replies and routes tickets to the regional BA. Direct meeting
                count overwrites are blocked—corrections must occur in Prowl or
                LeadSquared followed by Targeted Re-Sync.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-semibold text-slate-900 text-sm">
                03. Final Payout Lock & Reconciliation
              </div>
              <p className="text-slate-600 leading-relaxed">
                HR applies a version-controlled Final Payout Lock before Finance
                batching. Prevents duplicate disbursements and maintains an
                append-only immutable Firestore audit trail.
              </p>
            </div>
          </div>
        </main>

        <footer className="px-8 py-5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between bg-white">
          <span>FTA Automation Platform · Enterprise Financial Governance</span>
          <span>Simulated External Connectors (Prowl · LeadSquared · RazorpayX)</span>
        </footer>
      </div>
    );
  }

  const currentNavObj =
    NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];
  const openDisputeCount = disputes.filter((d) => d.status !== 'Resolved').length;
  const lockedCount = statements.filter((s) => s.payoutLocked).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col">
      {/* Strict 3-Zone Top Header Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection(NavSection.HR_COMMAND);
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          FTA Automation Platform
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === item.id
                  ? 'text-blue-600 font-semibold underline underline-offset-4'
                  : ''
              }`}
            >
              {item.shortLabel}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Live Rahul Sharma End-to-End Demo Stepper Bar */}
      <RahulJourneyBar />

      {/* Workspace Body: Left Sidebar (260px) + Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-[260px] shrink-0 bg-white lg:border-r border-b lg:border-b-0 border-slate-200 p-4 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            {/* Active Enterprise Role Switcher (In Workspace Sidebar Toolbar) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-500">
                Active Operator Role
              </label>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 truncate">
                Signed in: {user.email}
              </div>
            </div>

            {/* 9 Core Navigation Modules */}
            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400">
                Platform Workspaces
              </div>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.id === NavSection.BA_DISPUTES && openDisputeCount > 0 && (
                      <span
                        className={`font-mono text-[11px] ${
                          active ? 'text-amber-300' : 'text-amber-700 font-semibold'
                        }`}
                      >
                        {openDisputeCount}
                      </span>
                    )}
                    {item.id === NavSection.HR_APPROVAL_LOCK && (
                      <span
                        className={`font-mono text-[11px] ${
                          active ? 'text-emerald-300' : 'text-emerald-700 font-semibold'
                        }`}
                      >
                        {lockedCount}/20
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-800">
              Governance Mode Active
            </div>
            <div>
              • Deterministic Financial Rules
              <br />• Source-Only BA Corrections
              <br />• Immutable Firestore Audit Log
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          {/* Contextual Breadcrumb Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-2">
              <span>FTA Platform</span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900">
                {currentNavObj.label}
              </span>
              <span aria-hidden="true">·</span>
              <span>Role: {activeRole}</span>
            </div>
            {(dataLoading || seeding) && (
              <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronizing Firestore state...</span>
              </div>
            )}
          </div>

          {activeSection === NavSection.HR_COMMAND && <HrCommandCentreView />}
          {activeSection === NavSection.EMPLOYEE_STATEMENTS && (
            <EmployeeStatementsView />
          )}
          {activeSection === NavSection.BA_DISPUTES && <BaDisputeWorkspaceView />}
          {activeSection === NavSection.SOURCE_INTEGRATION && (
            <SourceIntegrationView />
          )}
          {activeSection === NavSection.HR_APPROVAL_LOCK && (
            <HrApprovalLockView />
          )}
          {activeSection === NavSection.FINANCE_DISBURSEMENT && (
            <FinanceDisbursementView />
          )}
          {activeSection === NavSection.EMPLOYEE_MASTER && <EmployeeMasterView />}
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
