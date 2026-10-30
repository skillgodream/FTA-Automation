import {
  AuditLog,
  CityConfig,
  DisputeTicket,
  Employee,
  EmployeeStatement,
  PayoutBatch,
  RateConfig,
  SourceRecord,
  SyncConnector,
} from '../types/fta';
import { calculateEmployeeStatement } from '../lib/calculationEngine';

export function buildInitialSeedData(ownerId: string) {
  const month = '2026-10';

  // 1. 6 Core Cities in City Master
  const cities: CityConfig[] = [
    {
      id: 'CITY-MUM',
      cityName: 'Mumbai',
      state: 'Maharashtra',
      tier: 'Tier 1',
      isSpecialCity: true,
      isNewLaunchCity: false,
      region: 'West',
      activeStatus: 'Active',
      ownerId,
    },
    {
      id: 'CITY-BLR',
      cityName: 'Bengaluru',
      state: 'Karnataka',
      tier: 'Tier 1',
      isSpecialCity: true,
      isNewLaunchCity: false,
      region: 'South',
      activeStatus: 'Active',
      ownerId,
    },
    {
      id: 'CITY-PUN',
      cityName: 'Pune',
      state: 'Maharashtra',
      tier: 'Tier 1',
      isSpecialCity: false,
      isNewLaunchCity: false,
      region: 'West',
      activeStatus: 'Active',
      ownerId,
    },
    {
      id: 'CITY-HYD',
      cityName: 'Hyderabad',
      state: 'Telangana',
      tier: 'Tier 1',
      isSpecialCity: false,
      isNewLaunchCity: false,
      region: 'South',
      activeStatus: 'Active',
      ownerId,
    },
    {
      id: 'CITY-JAI',
      cityName: 'Jaipur',
      state: 'Rajasthan',
      tier: 'Tier 2',
      isSpecialCity: false,
      isNewLaunchCity: true,
      region: 'North',
      activeStatus: 'Active',
      ownerId,
    },
    {
      id: 'CITY-IND',
      cityName: 'Indore',
      state: 'Madhya Pradesh',
      tier: 'Tier 2',
      isSpecialCity: false,
      isNewLaunchCity: true,
      region: 'Central',
      activeStatus: 'Active',
      ownerId,
    },
  ];

  // 2. Designation Rate Configs (Illustrative - Pending HR Policy Sign-Off)
  const rates: RateConfig[] = [
    {
      id: 'RATE-BD-MGR',
      designation: 'BD Manager',
      tier1LocalRate: 50,
      tier2LocalRate: 45,
      tier3LocalRate: 40,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 850,
      maxClaimLimit: 15000,
      isIllustrative: true,
      approvalStatus: 'Illustrative – Pending HR Policy Approval',
      ownerId,
    },
    {
      id: 'RATE-OPS-LEAD',
      designation: 'Operations Lead',
      tier1LocalRate: 55,
      tier2LocalRate: 50,
      tier3LocalRate: 45,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 800,
      maxClaimLimit: 12000,
      isIllustrative: true,
      approvalStatus: 'Illustrative – Pending HR Policy Approval',
      ownerId,
    },
    {
      id: 'RATE-B2B-MGR',
      designation: 'B2B Sales Manager',
      tier1LocalRate: 60,
      tier2LocalRate: 55,
      tier3LocalRate: 50,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 900,
      maxClaimLimit: 16000,
      isIllustrative: true,
      approvalStatus: 'Illustrative – Pending HR Policy Approval',
      ownerId,
    },
    {
      id: 'RATE-SUPER-HERO',
      designation: 'Super Hero',
      tier1LocalRate: 50,
      tier2LocalRate: 45,
      tier3LocalRate: 40,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 800,
      maxClaimLimit: 11000,
      isIllustrative: true,
      approvalStatus: 'Illustrative – Pending HR Policy Approval',
      ownerId,
    },
    {
      id: 'RATE-REG-TRAINER',
      designation: 'Regional Trainer',
      tier1LocalRate: 65,
      tier2LocalRate: 60,
      tier3LocalRate: 55,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 950,
      maxClaimLimit: 18000,
      isIllustrative: true,
      approvalStatus: 'Illustrative – Pending HR Policy Approval',
      ownerId,
    },
  ];

  // 3. 5 Focused Employees across BD, Operations, B2B Sales, Super Heroes, Functional Leads (Regional Trainer)
  const employees: Employee[] = [
    {
      id: 'EMP-1001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@enterprise-fta.in',
      designation: 'BD Manager',
      department: 'BD',
      baseCity: 'Mumbai',
      cityCategory: 'Tier 1',
      reportingManager: 'Vikramaditya Rao',
      baOwner: 'Priya Nair (BA - BD West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1002',
      name: 'Neha Kapoor',
      email: 'neha.kapoor@enterprise-fta.in',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Jaipur',
      cityCategory: 'Tier 2',
      reportingManager: 'Sanjay Deshmukh',
      baOwner: 'Karan Malhotra (BA - Ops North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1003',
      name: 'Gaurav Singhal',
      email: 'gaurav.singhal@enterprise-fta.in',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Bengaluru',
      cityCategory: 'Tier 1',
      reportingManager: 'Ananya Chatterjee',
      baOwner: 'Ritika Sen (BA - B2B South)',
      baRegion: 'South',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1004',
      name: 'Siddharth Malhotra',
      email: 'siddharth.malhotra@enterprise-fta.in',
      designation: 'Super Hero',
      department: 'Super Heroes',
      baseCity: 'Hyderabad',
      cityCategory: 'Tier 1',
      reportingManager: 'Rajeshwari Iyer',
      baOwner: 'Arjun Reddy (BA - South)',
      baRegion: 'South',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1005',
      name: 'Meera Krishnan',
      email: 'meera.krishnan@enterprise-fta.in',
      designation: 'Regional Trainer',
      department: 'Functional Leads',
      baseCity: 'Pune',
      cityCategory: 'Tier 1',
      reportingManager: 'Nandini Rajagopal',
      baOwner: 'Priya Nair (BA - West)',
      baRegion: 'West',
      sourceTool: 'Google Sheet CSV',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
  ];

  // 4. Source Records
  const sourceRecords: SourceRecord[] = [];

  // 4A. Rahul Sharma (EMP-1001): 40 Synced Local Meetings + 2 Unsynced/Pending Prowl Source Records
  const mumbaiHubs = [
    'Lower Parel Enterprise Hub',
    'Powai Tech Park Partner',
    'Nariman Point Retail Group',
    'Goregaon Logistics Cluster',
    'Worli Corporate Plaza',
    'Malad Commercial Complex',
    'Vikhroli Business Park',
    'Kurla West Trade Centre',
  ];

  for (let i = 1; i <= 40; i++) {
    const day = String(((i - 1) % 25) + 1).padStart(2, '0');
    const code = String(8800 + i);
    sourceRecords.push({
      id: `REC-1001-${String(i).padStart(2, '0')}`,
      externalRefId: `PRW-${code}`,
      employeeId: 'EMP-1001',
      employeeName: 'Rahul Sharma',
      department: 'BD',
      date: `${month}-${day}`,
      city: 'Mumbai',
      cityCategory: 'Tier 1',
      meetingCategory: 'Local',
      vehicleMode: 'Standard',
      sourceTool: 'Prowl',
      sourceStatus: 'Verified',
      syncStatus: 'Synced',
      clientName: `${mumbaiHubs[i % mumbaiHubs.length]} #${i}`,
      notes: 'Geo-verified field meeting completed in Prowl.',
      ticketRef: 'NONE',
      ownerId,
    });
  }

  // The 2 missing Prowl source records for Rahul Sharma (held in Prowl due to delayed GPS check-in)
  sourceRecords.push({
    id: 'REC-1001-41',
    externalRefId: 'PRW-8841',
    employeeId: 'EMP-1001',
    employeeName: 'Rahul Sharma',
    department: 'BD',
    date: `${month}-18`,
    city: 'Mumbai',
    cityCategory: 'Tier 1',
    meetingCategory: 'Local',
    vehicleMode: 'Standard',
    sourceTool: 'Prowl',
    sourceStatus: 'Pending GPS Check-in Verification',
    syncStatus: 'Unsynced - Source Hold',
    clientName: 'Andheri West Merchant Hub #41',
    notes:
      'Offline check-in packet held in Prowl queue; requires BA source verification.',
    ticketRef: 'NONE',
    ownerId,
  });

  sourceRecords.push({
    id: 'REC-1001-42',
    externalRefId: 'PRW-8842',
    employeeId: 'EMP-1001',
    employeeName: 'Rahul Sharma',
    department: 'BD',
    date: `${month}-22`,
    city: 'Mumbai',
    cityCategory: 'Tier 1',
    meetingCategory: 'Local',
    vehicleMode: 'Standard',
    sourceTool: 'Prowl',
    sourceStatus: 'Pending GPS Check-in Verification',
    syncStatus: 'Unsynced - Source Hold',
    clientName: 'Bandra Kurla Enterprise Corp #42',
    notes:
      'Delayed merchant sign-off timestamp in Prowl; requires BA source verification.',
    ticketRef: 'NONE',
    ownerId,
  });

  // 4B. Records for EMP-1002 through EMP-1005
  const otherEmployeeConfigs = [
    {
      empId: 'EMP-1002',
      localCount: 12,
      newLaunchCount: 6,
      outstationDays: 2,
      outstationCity: 'Jaipur',
      outstationTier: 'Tier 2',
      vehicleMode: 'Own Vehicle',
      sameDayNewLaunchCollision: true,
    },
    {
      empId: 'EMP-1003',
      localCount: 18,
      newLaunchCount: 0,
      outstationDays: 3,
      outstationCity: 'Mumbai',
      outstationTier: 'Special City',
      vehicleMode: 'Special City Transit',
    },
    {
      empId: 'EMP-1004',
      localCount: 16,
      newLaunchCount: 2,
      outstationDays: 2,
      outstationCity: 'Hyderabad',
      outstationTier: 'Tier 1',
      vehicleMode: 'Own Vehicle',
    },
    {
      empId: 'EMP-1005',
      localCount: 14,
      newLaunchCount: 0,
      outstationDays: 2,
      outstationCity: 'Pune',
      outstationTier: 'Tier 1',
      vehicleMode: 'Own Vehicle',
    },
  ];

  for (const cfg of otherEmployeeConfigs) {
    const emp = employees.find((e) => e.id === cfg.empId)!;
    const prefix =
      emp.sourceTool === 'Prowl'
        ? 'PRW'
        : emp.sourceTool === 'LeadSquared'
        ? 'LSQ'
        : 'GSH';
    let seq = 1;

    for (let i = 1; i <= cfg.localCount; i++) {
      const day = String(((i - 1) % 24) + 1).padStart(2, '0');
      sourceRecords.push({
        id: `REC-${emp.id.split('-')[1]}-${String(seq).padStart(2, '0')}`,
        externalRefId: `${prefix}-${emp.id.split('-')[1]}${String(seq).padStart(2, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: `${month}-${day}`,
        city: emp.baseCity,
        cityCategory: emp.cityCategory,
        meetingCategory: 'Local',
        vehicleMode: 'Standard',
        sourceTool: emp.sourceTool,
        sourceStatus: 'Verified',
        syncStatus: 'Synced',
        clientName: `${emp.baseCity} Account Partner #${i}`,
        notes: `Synced from ${emp.sourceTool}`,
        ticketRef: 'NONE',
        ownerId,
      });
      seq++;
    }

    for (let d = 1; d <= cfg.outstationDays; d++) {
      const day = String(10 + d).padStart(2, '0');
      sourceRecords.push({
        id: `REC-${emp.id.split('-')[1]}-${String(seq).padStart(2, '0')}`,
        externalRefId: `${prefix}-${emp.id.split('-')[1]}${String(seq).padStart(2, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: `${month}-${day}`,
        city: cfg.outstationCity,
        cityCategory: cfg.outstationTier,
        meetingCategory: 'Outstation',
        vehicleMode: cfg.vehicleMode,
        sourceTool: emp.sourceTool,
        sourceStatus: 'Verified',
        syncStatus: 'Synced',
        clientName: `${cfg.outstationCity} Field Tour Day #${d}`,
        notes: `Outstation travel (${cfg.vehicleMode})`,
        ticketRef: 'NONE',
        ownerId,
      });
      seq++;
    }

    for (let n = 1; n <= cfg.newLaunchCount; n++) {
      const day =
        cfg.sameDayNewLaunchCollision && n === 1
          ? '11'
          : String(18 + n).padStart(2, '0');
      const nlCity =
        cfg.sameDayNewLaunchCollision && n === 1
          ? cfg.outstationCity
          : 'Jaipur';
      sourceRecords.push({
        id: `REC-${emp.id.split('-')[1]}-${String(seq).padStart(2, '0')}`,
        externalRefId: `${prefix}-${emp.id.split('-')[1]}${String(seq).padStart(2, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: `${month}-${day}`,
        city: nlCity,
        cityCategory: 'Tier 2',
        meetingCategory: 'New Launch',
        vehicleMode: 'Standard',
        sourceTool: emp.sourceTool,
        sourceStatus: 'Verified',
        syncStatus: 'Synced',
        clientName: `${nlCity} Expansion Launch Merchant #${n}`,
        notes: 'New Launch territory activation meeting',
        ticketRef: 'NONE',
        ownerId,
      });
      seq++;
    }
  }

  // 5. Sync Connectors
  const prowlRecords = sourceRecords.filter((r) => r.sourceTool === 'Prowl');
  const lsqRecords = sourceRecords.filter(
    (r) => r.sourceTool === 'LeadSquared'
  );
  const gsheetRecords = sourceRecords.filter(
    (r) => r.sourceTool === 'Google Sheet CSV'
  );

  const connectors: SyncConnector[] = [
    {
      id: 'CONN-PROWL',
      name: 'Prowl Field Activity Connector',
      toolType: 'Prowl',
      status: '2 Records Held · Needs Attention',
      lastSyncTime: '2026-10-29 09:00 IST',
      recordsFetched: prowlRecords.length,
      recordsSuccessful: prowlRecords.filter((r) => r.syncStatus === 'Synced')
        .length,
      recordsFailed: prowlRecords.filter((r) => r.syncStatus !== 'Synced')
        .length,
      ownerId,
    },
    {
      id: 'CONN-LEADSQUARED',
      name: 'LeadSquared CRM Connector',
      toolType: 'LeadSquared',
      status: 'Connected · Healthy',
      lastSyncTime: '2026-10-29 09:05 IST',
      recordsFetched: lsqRecords.length,
      recordsSuccessful: lsqRecords.length,
      recordsFailed: 0,
      ownerId,
    },
    {
      id: 'CONN-GSHEET',
      name: 'Regional Trainers Google Sheet CSV',
      toolType: 'Google Sheet CSV',
      status: 'Imported · Healthy',
      lastSyncTime: '2026-10-28 18:30 IST',
      recordsFetched: gsheetRecords.length,
      recordsSuccessful: gsheetRecords.length,
      recordsFailed: 0,
      ownerId,
    },
  ];

  // 6. Statements for the 5 Employees
  // EMP-1001 (Rahul Sharma): Generated (₹2,000, 2 records held in Prowl — Demo Case)
  // EMP-1002 (Neha Kapoor): Disputed (FTA-2026-1038 — Needs BA Attention)
  // EMP-1003, EMP-1004, EMP-1005: Auto-Verified & Payout Locked (Zero-Touch Track)
  const statements: EmployeeStatement[] = employees.map((emp) => {
    let initialStatus = 'Payout Locked';
    let payoutLocked = true;
    let disputeTicketId = 'NONE';

    if (emp.id === 'EMP-1001') {
      initialStatus = 'Generated';
      payoutLocked = false;
    } else if (emp.id === 'EMP-1002') {
      initialStatus = 'Disputed';
      payoutLocked = false;
      disputeTicketId = 'FTA-2026-1038';
    }

    return calculateEmployeeStatement(
      emp,
      sourceRecords,
      rates,
      cities,
      month,
      ownerId,
      {
        id: `STMT-${emp.id}`,
        status: initialStatus,
        payoutLocked,
        lockVersion: 1,
        changeRequestStatus: 'None',
        changeRequestReason: 'N/A',
        disputeTicketId,
        payoutBatchId: 'NONE',
        payoutStatus: 'Not Initiated',
        utrNumber: 'PENDING',
      }
    );
  });

  // 7. Active Dispute on EMP-1002 (Neha Kapoor) + Rahul Sharma joins when Step 2 is triggered
  const disputes: DisputeTicket[] = [
    {
      id: 'DSP-1038',
      ticketNumber: 'FTA-2026-1038',
      statementId: 'STMT-EMP-1002',
      employeeId: 'EMP-1002',
      employeeName: 'Neha Kapoor',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Jaipur',
      month,
      claimType: 'New Launch',
      systemRecordedValue: 5,
      employeeReportedValue: 6,
      disputedDelta: 1,
      financialImpact: 50,
      employeeMessage:
        'I logged 6 New Launch meetings in Jaipur, but only 5 were paid on my statement.',
      aiInterpretation:
        'Employee claims 6 New Launch meetings vs 5 eligible (+1 difference). 1 meeting on Oct 11 was excluded by the New-City Outstation Rule because Outstation allowance was claimed on the same day.',
      assignedBa: 'Karan Malhotra (BA - Ops North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      status: 'Under Review',
      sourceCorrected: false,
      reSynced: false,
      resolutionNotes:
        'Verifying New-City Outstation Rule overlap on 2026-10-11.',
      ownerId,
      createdAt: '2026-10-28 14:20 IST',
    },
  ];

  // 8. Initial Audit Logs
  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001')!;
  const auditLogs: AuditLog[] = [
    {
      id: 'AUD-1001',
      eventType: 'SOURCE_SYNC',
      module: 'Source Data & Sync',
      actorName: 'Automated Scheduler',
      actorRole: 'System',
      entityId: 'CONN-PROWL',
      referenceId: 'SYNC-202610-01',
      oldValue: '0 records',
      newValue: `${prowlRecords.filter((r) => r.syncStatus === 'Synced').length} synced, 2 held in Prowl`,
      description:
        'Automated monthly sync completed from Prowl. 2 records for Rahul Sharma held pending GPS verification.',
      source: 'Prowl Connector',
      ownerId,
      timestamp: '2026-10-29 09:00:12 IST',
    },
    {
      id: 'AUD-1002',
      eventType: 'AUTO_LOCK_85_PCT',
      module: 'HR Approval & Lock',
      actorName: 'Zero-Touch Automation',
      actorRole: 'System',
      entityId: 'BATCH-AUTO',
      referenceId: 'AUTO-LOCK-202610',
      oldValue: 'Generated',
      newValue: '3 Statements Auto-Locked',
      description:
        'Auto-verified and locked statements for Gaurav Singhal, Siddharth Malhotra, and Meera Krishnan (Zero discrepancies).',
      source: 'Automation Engine',
      ownerId,
      timestamp: '2026-10-29 09:10:00 IST',
    },
    {
      id: 'AUD-1003',
      eventType: 'STATEMENT_DISPATCH',
      module: 'Employee Statements',
      actorName: 'Statement Service',
      actorRole: 'System',
      entityId: 'STMT-EMP-1001',
      referenceId: 'EMP-1001',
      oldValue: 'Draft',
      newValue: `Emailed Statement (₹${rahulStmt.netAmount.toLocaleString('en-IN')})`,
      description:
        'Sent October 2026 statement to Rahul Sharma (40 synced meetings × ₹50 = ₹2,000).',
      source: 'Email Statement Service',
      ownerId,
      timestamp: '2026-10-29 09:15:00 IST',
    },
  ];

  const payoutBatches: PayoutBatch[] = [];

  return {
    cities,
    rates,
    employees,
    sourceRecords,
    connectors,
    statements,
    disputes,
    payoutBatches,
    auditLogs,
  };
}
