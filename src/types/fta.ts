export enum UserRole {
  EMPLOYEE = 'Employee',
  BA = 'Business Associate (BA)',
  HR = 'HR',
  HR_ADMIN = 'HR Admin',
  FINANCE = 'Finance',
}

export enum NavSection {
  HR_COMMAND = 'hr_command',
  EMPLOYEE_STATEMENTS = 'employee_statements',
  BA_DISPUTES = 'ba_disputes',
  SOURCE_INTEGRATION = 'source_integration',
  HR_APPROVAL_LOCK = 'hr_approval_lock',
  FINANCE_DISBURSEMENT = 'finance_disbursement',
  EMPLOYEE_MASTER = 'employee_master',
  RATE_CITY_MASTER = 'rate_city_master',
  AUDIT_REPORTS = 'audit_reports',
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  baseCity: string;
  cityCategory: string;
  reportingManager: string;
  baOwner: string;
  baRegion: string;
  sourceTool: string;
  ownVehicleEligible: boolean;
  status: string;
  ownerId: string;
  updatedAt?: unknown;
}

export interface RateConfig {
  id: string;
  designation: string;
  tier1LocalRate: number;
  tier2LocalRate: number;
  tier3LocalRate: number;
  newLaunchRate: number;
  specialCityOutstationRate: number;
  ownVehicleTier1Rate: number;
  ownVehicleTier23Rate: number;
  standardOutstationRate: number;
  maxClaimLimit: number;
  isIllustrative: boolean;
  approvalStatus: string;
  ownerId: string;
  updatedAt?: unknown;
}

export interface CityConfig {
  id: string;
  cityName: string;
  state: string;
  tier: string;
  isSpecialCity: boolean;
  isNewLaunchCity: boolean;
  region: string;
  activeStatus: string;
  ownerId: string;
  updatedAt?: unknown;
}

export interface SourceRecord {
  id: string;
  externalRefId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  city: string;
  cityCategory: string;
  meetingCategory: string; // 'Local' | 'New Launch' | 'Outstation'
  vehicleMode: string; // 'Standard' | 'Own Vehicle' | 'Special City Transit'
  sourceTool: string; // 'Prowl' | 'LeadSquared' | 'Google Sheet CSV'
  sourceStatus: string; // 'Verified' | 'Pending GPS Check-in Verification' | 'Corrected in Source'
  syncStatus: string; // 'Synced' | 'Unsynced - Source Hold' | 'Excluded - Duplicate'
  clientName: string;
  notes: string;
  ticketRef: string;
  ownerId: string;
  updatedAt?: unknown;
}

export interface SyncConnector {
  id: string;
  name: string;
  toolType: string;
  status: string;
  lastSyncTime: string;
  recordsFetched: number;
  recordsSuccessful: number;
  recordsFailed: number;
  ownerId: string;
  updatedAt?: unknown;
}

export interface EmployeeStatement {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  baseCity: string;
  cityCategory: string;
  baOwner: string;
  month: string;
  sourceTool: string;
  eligibleLocalMeetings: number;
  localRate: number;
  localAmount: number;
  newLaunchMeetings: number;
  newLaunchRuleExcluded: number;
  newLaunchRate: number;
  newLaunchAmount: number;
  outstationDays: number;
  outstationRateType: string;
  outstationDailyRate: number;
  outstationAmount: number;
  grossAmount: number;
  maxClaimLimit: number;
  capApplied: boolean;
  netAmount: number;
  calculationTrace: string;
  status: string; // 'Generated' | 'Confirmed by Employee' | 'Disputed' | 'Recalculated (Post-Dispute)' | 'HR Approved' | 'Payout Locked' | 'Disbursed'
  payoutLocked: boolean;
  lockVersion: number;
  changeRequestStatus: string; // 'None' | 'Pending Approval' | 'Approved (Unlocked)'
  changeRequestReason: string;
  disputeTicketId: string;
  payoutBatchId: string;
  payoutStatus: string; // 'Not Initiated' | 'Initiated' | 'Processing' | 'Success' | 'Failed'
  utrNumber: string;
  ownerId: string;
  updatedAt?: unknown;
}

export interface DisputeTicket {
  id: string;
  ticketNumber: string;
  statementId: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  baseCity: string;
  month: string;
  claimType: string;
  systemRecordedValue: number;
  employeeReportedValue: number;
  disputedDelta: number;
  financialImpact: number;
  employeeMessage: string;
  aiInterpretation: string;
  assignedBa: string;
  baRegion: string;
  sourceTool: string;
  status: string; // 'Open' | 'Under Review' | 'Clarification Required' | 'Approved' | 'Rejected' | 'Resolved'
  sourceCorrected: boolean;
  reSynced: boolean;
  resolutionNotes: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: unknown;
}

export interface PayoutBatch {
  id: string;
  batchNumber: string;
  month: string;
  gatewayName: string;
  employeeCount: number;
  totalAmount: number;
  status: string; // 'Initiated' | 'Processing' | 'Success' | 'Failed'
  initiatedBy: string;
  utrPrefix: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  eventType: string;
  module: string;
  actorName: string;
  actorRole: string;
  entityId: string;
  referenceId: string;
  oldValue: string;
  newValue: string;
  description: string;
  source: string;
  ownerId: string;
  timestamp: string;
  updatedAt?: unknown;
}
