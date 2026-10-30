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

  // 1. 12 Cities in City Master
  const cities: CityConfig[] = [
    { id: 'CITY-MUM', cityName: 'Mumbai', state: 'Maharashtra', tier: 'Tier 1', isSpecialCity: true, isNewLaunchCity: false, region: 'West', activeStatus: 'Active', ownerId },
    { id: 'CITY-DEL', cityName: 'Delhi NCR', state: 'Delhi', tier: 'Tier 1', isSpecialCity: true, isNewLaunchCity: false, region: 'North', activeStatus: 'Active', ownerId },
    { id: 'CITY-BLR', cityName: 'Bengaluru', state: 'Karnataka', tier: 'Tier 1', isSpecialCity: true, isNewLaunchCity: false, region: 'South', activeStatus: 'Active', ownerId },
    { id: 'CITY-PUN', cityName: 'Pune', state: 'Maharashtra', tier: 'Tier 1', isSpecialCity: false, isNewLaunchCity: false, region: 'West', activeStatus: 'Active', ownerId },
    { id: 'CITY-HYD', cityName: 'Hyderabad', state: 'Telangana', tier: 'Tier 1', isSpecialCity: false, isNewLaunchCity: false, region: 'South', activeStatus: 'Active', ownerId },
    { id: 'CITY-AHM', cityName: 'Ahmedabad', state: 'Gujarat', tier: 'Tier 2', isSpecialCity: false, isNewLaunchCity: false, region: 'West', activeStatus: 'Active', ownerId },
    { id: 'CITY-JAI', cityName: 'Jaipur', state: 'Rajasthan', tier: 'Tier 2', isSpecialCity: false, isNewLaunchCity: true, region: 'North', activeStatus: 'Active', ownerId },
    { id: 'CITY-LKO', cityName: 'Lucknow', state: 'Uttar Pradesh', tier: 'Tier 2', isSpecialCity: false, isNewLaunchCity: true, region: 'North', activeStatus: 'Active', ownerId },
    { id: 'CITY-IND', cityName: 'Indore', state: 'Madhya Pradesh', tier: 'Tier 2', isSpecialCity: false, isNewLaunchCity: true, region: 'Central', activeStatus: 'Active', ownerId },
    { id: 'CITY-SUR', cityName: 'Surat', state: 'Gujarat', tier: 'Tier 2', isSpecialCity: false, isNewLaunchCity: false, region: 'West', activeStatus: 'Active', ownerId },
    { id: 'CITY-NAG', cityName: 'Nagpur', state: 'Maharashtra', tier: 'Tier 3', isSpecialCity: false, isNewLaunchCity: true, region: 'West', activeStatus: 'Active', ownerId },
    { id: 'CITY-CJB', cityName: 'Coimbatore', state: 'Tamil Nadu', tier: 'Tier 3', isSpecialCity: false, isNewLaunchCity: true, region: 'South', activeStatus: 'Active', ownerId },
  ];

  // 2. 6 Designation Rate Configs (Illustrative - Pending HR Policy Sign-Off)
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
      id: 'RATE-BD-EXEC',
      designation: 'BD Executive',
      tier1LocalRate: 45,
      tier2LocalRate: 40,
      tier3LocalRate: 35,
      newLaunchRate: 50,
      specialCityOutstationRate: 1200,
      ownVehicleTier1Rate: 500,
      ownVehicleTier23Rate: 400,
      standardOutstationRate: 750,
      maxClaimLimit: 10000,
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

  // 3. 20 Fictional Employees across BD, Operations, B2B Sales, Super Heroes, Functional Leads (incl. Regional Trainers)
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
      name: 'Aditi Verma',
      email: 'aditi.verma@enterprise-fta.in',
      designation: 'BD Executive',
      department: 'BD',
      baseCity: 'Delhi NCR',
      cityCategory: 'Tier 1',
      reportingManager: 'Vikramaditya Rao',
      baOwner: 'Karan Malhotra (BA - BD North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1003',
      name: 'Siddharth Menon',
      email: 'siddharth.menon@enterprise-fta.in',
      designation: 'BD Manager',
      department: 'BD',
      baseCity: 'Bengaluru',
      cityCategory: 'Tier 1',
      reportingManager: 'Vikramaditya Rao',
      baOwner: 'Meera Krishnan (BA - BD South)',
      baRegion: 'South',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1004',
      name: 'Neha Kapoor',
      email: 'neha.kapoor@enterprise-fta.in',
      designation: 'BD Executive',
      department: 'BD',
      baseCity: 'Jaipur',
      cityCategory: 'Tier 2',
      reportingManager: 'Rahul Sharma',
      baOwner: 'Karan Malhotra (BA - BD North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1005',
      name: 'Arjun Joshi',
      email: 'arjun.joshi@enterprise-fta.in',
      designation: 'BD Executive',
      department: 'BD',
      baseCity: 'Pune',
      cityCategory: 'Tier 1',
      reportingManager: 'Rahul Sharma',
      baOwner: 'Priya Nair (BA - BD West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: false,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1006',
      name: 'Pooja Deshpande',
      email: 'pooja.deshpande@enterprise-fta.in',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Mumbai',
      cityCategory: 'Tier 1',
      reportingManager: 'Suresh Subramanian',
      baOwner: 'Sanket Kulkarni (BA - Ops West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1007',
      name: 'Rakesh Tiwari',
      email: 'rakesh.tiwari@enterprise-fta.in',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Lucknow',
      cityCategory: 'Tier 2',
      reportingManager: 'Suresh Subramanian',
      baOwner: 'Karan Malhotra (BA - Ops North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1008',
      name: 'Divya Iyer',
      email: 'divya.iyer@enterprise-fta.in',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Hyderabad',
      cityCategory: 'Tier 1',
      reportingManager: 'Suresh Subramanian',
      baOwner: 'Meera Krishnan (BA - Ops South)',
      baRegion: 'South',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1009',
      name: 'Manish Patel',
      email: 'manish.patel@enterprise-fta.in',
      designation: 'Operations Lead',
      department: 'Operations',
      baseCity: 'Ahmedabad',
      cityCategory: 'Tier 2',
      reportingManager: 'Suresh Subramanian',
      baOwner: 'Sanket Kulkarni (BA - Ops West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1010',
      name: 'Nikhil Chatterjee',
      email: 'nikhil.chatterjee@enterprise-fta.in',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Delhi NCR',
      cityCategory: 'Tier 1',
      reportingManager: 'Anirudh Bose',
      baOwner: 'Ritika Sen (BA - B2B Enterprise)',
      baRegion: 'North',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1011',
      name: 'Shruti Agarwal',
      email: 'shruti.agarwal@enterprise-fta.in',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Mumbai',
      cityCategory: 'Tier 1',
      reportingManager: 'Anirudh Bose',
      baOwner: 'Ritika Sen (BA - B2B Enterprise)',
      baRegion: 'West',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1012',
      name: 'Gaurav Singhal',
      email: 'gaurav.singhal@enterprise-fta.in',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Indore',
      cityCategory: 'Tier 2',
      reportingManager: 'Anirudh Bose',
      baOwner: 'Ritika Sen (BA - B2B Enterprise)',
      baRegion: 'Central',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1013',
      name: 'Tanvi Reddy',
      email: 'tanvi.reddy@enterprise-fta.in',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Bengaluru',
      cityCategory: 'Tier 1',
      reportingManager: 'Anirudh Bose',
      baOwner: 'Meera Krishnan (BA - B2B South)',
      baRegion: 'South',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: false,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1014',
      name: 'Harshvardhan Jadeja',
      email: 'harsh.jadeja@enterprise-fta.in',
      designation: 'Super Hero',
      department: 'Super Heroes',
      baseCity: 'Surat',
      cityCategory: 'Tier 2',
      reportingManager: 'Deepak Chawla',
      baOwner: 'Priya Nair (BA - BD West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1015',
      name: 'Kavita Nambiar',
      email: 'kavita.nambiar@enterprise-fta.in',
      designation: 'Super Hero',
      department: 'Super Heroes',
      baseCity: 'Coimbatore',
      cityCategory: 'Tier 3',
      reportingManager: 'Deepak Chawla',
      baOwner: 'Meera Krishnan (BA - BD South)',
      baRegion: 'South',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1016',
      name: 'Pratik Meshram',
      email: 'pratik.meshram@enterprise-fta.in',
      designation: 'Super Hero',
      department: 'Super Heroes',
      baseCity: 'Nagpur',
      cityCategory: 'Tier 3',
      reportingManager: 'Deepak Chawla',
      baOwner: 'Priya Nair (BA - BD West)',
      baRegion: 'West',
      sourceTool: 'Prowl',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1017',
      name: 'Zoya Khan',
      email: 'zoya.khan@enterprise-fta.in',
      designation: 'Super Hero',
      department: 'Super Heroes',
      baseCity: 'Hyderabad',
      cityCategory: 'Tier 1',
      reportingManager: 'Deepak Chawla',
      baOwner: 'Meera Krishnan (BA - BD South)',
      baRegion: 'South',
      sourceTool: 'Prowl',
      ownVehicleEligible: false,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1018',
      name: 'Abhishek Saxena',
      email: 'abhishek.saxena@enterprise-fta.in',
      designation: 'BD Manager',
      department: 'Functional Leads',
      baseCity: 'Delhi NCR',
      cityCategory: 'Tier 1',
      reportingManager: 'Nandini Rajagopal',
      baOwner: 'Karan Malhotra (BA - BD North)',
      baRegion: 'North',
      sourceTool: 'LeadSquared',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1019',
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@enterprise-fta.in',
      designation: 'Regional Trainer',
      department: 'Functional Leads',
      baseCity: 'Pune',
      cityCategory: 'Tier 1',
      reportingManager: 'Nandini Rajagopal',
      baOwner: 'Sanket Kulkarni (BA - Ops West)',
      baRegion: 'West',
      sourceTool: 'Google Sheet CSV',
      ownVehicleEligible: true,
      status: 'Active',
      ownerId,
    },
    {
      id: 'EMP-1020',
      name: 'Rohan Kulkarni',
      email: 'rohan.kulkarni@enterprise-fta.in',
      designation: 'Regional Trainer',
      department: 'Functional Leads',
      baseCity: 'Bengaluru',
      cityCategory: 'Tier 1',
      reportingManager: 'Nandini Rajagopal',
      baOwner: 'Meera Krishnan (BA - Ops South)',
      baRegion: 'South',
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
    notes: 'Offline check-in packet held in Prowl queue; requires BA source verification.',
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
    notes: 'Delayed merchant sign-off timestamp in Prowl; requires BA source verification.',
    ticketRef: 'NONE',
    ownerId,
  });

  // 4B. Realistic records for the remaining 19 employees (EMP-1002 to EMP-1020)
  const otherEmployeeConfigs: Array<{
    empId: string;
    localCount: number;
    newLaunchCount: number;
    outstationDays: number;
    outstationCity: string;
    outstationTier: string;
    vehicleMode: string;
    sameDayNewLaunchCollision?: boolean;
  }> = [
    { empId: 'EMP-1002', localCount: 14, newLaunchCount: 4, outstationDays: 2, outstationCity: 'Jaipur', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1003', localCount: 18, newLaunchCount: 0, outstationDays: 3, outstationCity: 'Mumbai', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1004', localCount: 12, newLaunchCount: 6, outstationDays: 2, outstationCity: 'Jaipur', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle', sameDayNewLaunchCollision: true },
    { empId: 'EMP-1005', localCount: 15, newLaunchCount: 2, outstationDays: 0, outstationCity: 'Pune', outstationTier: 'Tier 1', vehicleMode: 'Standard' },
    { empId: 'EMP-1006', localCount: 16, newLaunchCount: 0, outstationDays: 2, outstationCity: 'Delhi NCR', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1007', localCount: 11, newLaunchCount: 5, outstationDays: 2, outstationCity: 'Lucknow', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1008', localCount: 14, newLaunchCount: 0, outstationDays: 2, outstationCity: 'Bengaluru', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1009', localCount: 13, newLaunchCount: 3, outstationDays: 2, outstationCity: 'Ahmedabad', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1010', localCount: 20, newLaunchCount: 4, outstationDays: 4, outstationCity: 'Mumbai', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1011', localCount: 18, newLaunchCount: 2, outstationDays: 2, outstationCity: 'Pune', outstationTier: 'Tier 1', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1012', localCount: 12, newLaunchCount: 5, outstationDays: 2, outstationCity: 'Indore', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1013', localCount: 15, newLaunchCount: 0, outstationDays: 1, outstationCity: 'Hyderabad', outstationTier: 'Tier 1', vehicleMode: 'Standard' },
    { empId: 'EMP-1014', localCount: 14, newLaunchCount: 4, outstationDays: 2, outstationCity: 'Surat', outstationTier: 'Tier 2', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1015', localCount: 12, newLaunchCount: 6, outstationDays: 2, outstationCity: 'Coimbatore', outstationTier: 'Tier 3', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1016', localCount: 10, newLaunchCount: 5, outstationDays: 2, outstationCity: 'Nagpur', outstationTier: 'Tier 3', vehicleMode: 'Own Vehicle' },
    { empId: 'EMP-1017', localCount: 14, newLaunchCount: 2, outstationDays: 0, outstationCity: 'Hyderabad', outstationTier: 'Tier 1', vehicleMode: 'Standard' },
    { empId: 'EMP-1018', localCount: 16, newLaunchCount: 3, outstationDays: 3, outstationCity: 'Delhi NCR', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1019', localCount: 12, newLaunchCount: 4, outstationDays: 3, outstationCity: 'Mumbai', outstationTier: 'Special City', vehicleMode: 'Special City Transit' },
    { empId: 'EMP-1020', localCount: 14, newLaunchCount: 2, outstationDays: 2, outstationCity: 'Bengaluru', outstationTier: 'Special City', vehicleMode: 'Own Vehicle' },
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
      // If sameDayNewLaunchCollision is true, put first new launch on day 11 (same day/city as outstation!) to demonstrate the New-City Outstation Rule
      const day =
        cfg.sameDayNewLaunchCollision && n === 1
          ? '11'
          : String(18 + n).padStart(2, '0');
      const nlCity = cfg.sameDayNewLaunchCollision && n === 1 ? cfg.outstationCity : 'Jaipur';
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
  const lsqRecords = sourceRecords.filter((r) => r.sourceTool === 'LeadSquared');
  const gsheetRecords = sourceRecords.filter((r) => r.sourceTool === 'Google Sheet CSV');

  const connectors: SyncConnector[] = [
    {
      id: 'CONN-PROWL',
      name: 'Prowl Field Activity Connector (Simulated)',
      toolType: 'Prowl',
      status: 'Connected · Synced with 2 Source Holds',
      lastSyncTime: '2026-10-29 09:00 IST',
      recordsFetched: prowlRecords.length,
      recordsSuccessful: prowlRecords.filter((r) => r.syncStatus === 'Synced').length,
      recordsFailed: prowlRecords.filter((r) => r.syncStatus !== 'Synced').length,
      ownerId,
    },
    {
      id: 'CONN-LEADSQUARED',
      name: 'LeadSquared CRM Enterprise Connector (Simulated)',
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
      name: 'Regional Trainers Google Sheet CSV Bridge',
      toolType: 'Google Sheet CSV',
      status: 'Imported · Exception Feed Active',
      lastSyncTime: '2026-10-28 18:30 IST',
      recordsFetched: gsheetRecords.length,
      recordsSuccessful: gsheetRecords.length,
      recordsFailed: 0,
      ownerId,
    },
  ];

  // 6. Calculate Statements for all 20 Employees using the Deterministic Calculation Engine
  const statements: EmployeeStatement[] = employees.map((emp, index) => {
    // Give varied realistic workflow states across the 20 employees while keeping Rahul Sharma (EMP-1001) at initial "Generated" ₹2,000 ready for his showcase
    let initialStatus = 'Generated';
    let payoutLocked = false;
    let disputeTicketId = 'NONE';

    if (emp.id === 'EMP-1001') {
      initialStatus = 'Generated';
    } else if (emp.id === 'EMP-1004') {
      initialStatus = 'Disputed';
      disputeTicketId = 'FTA-2026-1038';
    } else if (emp.id === 'EMP-1012') {
      initialStatus = 'Disputed';
      disputeTicketId = 'FTA-2026-1039';
    } else if (index >= 14) {
      initialStatus = 'Payout Locked';
      payoutLocked = true;
    } else if (index >= 9) {
      initialStatus = 'HR Approved';
    } else if (index >= 5) {
      initialStatus = 'Confirmed by Employee';
    }

    return calculateEmployeeStatement(emp, sourceRecords, rates, cities, month, ownerId, {
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
    });
  });

  // 7. Sample Active Disputes on EMP-1004 & EMP-1012 so BA Queue has immediate multi-department context
  const disputes: DisputeTicket[] = [
    {
      id: 'DSP-1038',
      ticketNumber: 'FTA-2026-1038',
      statementId: 'STMT-EMP-1004',
      employeeId: 'EMP-1004',
      employeeName: 'Neha Kapoor',
      designation: 'BD Executive',
      department: 'BD',
      baseCity: 'Jaipur',
      month,
      claimType: 'New Launch',
      systemRecordedValue: 5,
      employeeReportedValue: 6,
      disputedDelta: 1,
      financialImpact: 50,
      employeeMessage: 'I logged 6 New Launch meetings in Jaipur, but only 5 were paid on my statement.',
      aiInterpretation:
        'Employee claims 6 New Launch meetings vs 5 eligible in statement (+1 delta). System excluded 1 meeting on 2026-10-11 under the New-City Outstation Rule because Outstation DA was claimed in Jaipur on the same date.',
      assignedBa: 'Karan Malhotra (BA - BD North)',
      baRegion: 'North',
      sourceTool: 'Prowl',
      status: 'Under Review',
      sourceCorrected: false,
      reSynced: false,
      resolutionNotes: 'Verifying New-City Outstation Rule overlap on 2026-10-11.',
      ownerId,
      createdAt: '2026-10-28 14:20 IST',
    },
    {
      id: 'DSP-1039',
      ticketNumber: 'FTA-2026-1039',
      statementId: 'STMT-EMP-1012',
      employeeId: 'EMP-1012',
      employeeName: 'Gaurav Singhal',
      designation: 'B2B Sales Manager',
      department: 'B2B Sales',
      baseCity: 'Indore',
      month,
      claimType: 'Outstation',
      systemRecordedValue: 2,
      employeeReportedValue: 3,
      disputedDelta: 1,
      financialImpact: 400,
      employeeMessage: 'Completed 3 days of own-vehicle outstation travel in Indore cluster, statement reflects 2 days.',
      aiInterpretation:
        'Employee reports 3 Outstation days vs 2 recorded in LeadSquared (+1 day delta at ₹400/day Tier 2 Own Vehicle rate).',
      assignedBa: 'Ritika Sen (BA - B2B Enterprise)',
      baRegion: 'Central',
      sourceTool: 'LeadSquared',
      status: 'Clarification Required',
      sourceCorrected: false,
      reSynced: false,
      resolutionNotes: 'Requested odometer log attachment in LeadSquared for Oct 13.',
      ownerId,
      createdAt: '2026-10-28 16:45 IST',
    },
  ];

  // 8. Initial Audit Logs
  const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001')!;
  const auditLogs: AuditLog[] = [
    {
      id: 'AUD-1001',
      eventType: 'SOURCE_SYNC',
      module: 'Source Data & Integration',
      actorName: 'Automated Scheduler',
      actorRole: 'System',
      entityId: 'CONN-PROWL',
      referenceId: 'SYNC-202610-01',
      oldValue: '0 records',
      newValue: `${prowlRecords.filter((r) => r.syncStatus === 'Synced').length} synced, 2 held in Prowl`,
      description: 'Automated monthly sync completed from Prowl Field Activity Connector.',
      source: 'Prowl Connector',
      ownerId,
      timestamp: '2026-10-29 09:00:12 IST',
    },
    {
      id: 'AUD-1002',
      eventType: 'SOURCE_SYNC',
      module: 'Source Data & Integration',
      actorName: 'Automated Scheduler',
      actorRole: 'System',
      entityId: 'CONN-LEADSQUARED',
      referenceId: 'SYNC-202610-02',
      oldValue: '0 records',
      newValue: `${lsqRecords.length} synced`,
      description: 'Automated monthly sync completed from LeadSquared CRM Connector.',
      source: 'LeadSquared Connector',
      ownerId,
      timestamp: '2026-10-29 09:05:04 IST',
    },
    {
      id: 'AUD-1003',
      eventType: 'CSV_IMPORT',
      module: 'Source Data & Integration',
      actorName: 'Nandini Rajagopal',
      actorRole: 'HR Admin',
      entityId: 'CONN-GSHEET',
      referenceId: 'CSV-TRAINERS-1026',
      oldValue: '0 trainer records',
      newValue: `${gsheetRecords.length} Regional Trainer records imported`,
      description: 'Imported verified Google Sheet CSV exception feed for Regional Trainers (EMP-1019, EMP-1020).',
      source: 'Google Sheet CSV Bridge',
      ownerId,
      timestamp: '2026-10-28 18:30:00 IST',
    },
    {
      id: 'AUD-1004',
      eventType: 'FTA_CALCULATION',
      module: 'Calculation Engine',
      actorName: 'Deterministic Rule Engine v2.4',
      actorRole: 'System',
      entityId: 'STMT-EMP-1001',
      referenceId: 'EMP-1001',
      oldValue: 'Uncomputed',
      newValue: `40 Local Meetings × ₹50 = ₹${rahulStmt.netAmount.toLocaleString('en-IN')}`,
      description: 'Calculated October 2026 FTA statement for Rahul Sharma (BD Manager, Mumbai Tier 1) using illustrative rate ₹50.',
      source: 'Deterministic Calculation Engine',
      ownerId,
      timestamp: '2026-10-29 09:10:00 IST',
    },
    {
      id: 'AUD-1005',
      eventType: 'STATEMENT_DISPATCH',
      module: 'Employee Statements',
      actorName: 'Statement Dispatch Service',
      actorRole: 'System',
      entityId: 'STMT-EMP-1001',
      referenceId: 'EMP-1001',
      oldValue: 'Draft',
      newValue: 'Generated & Emailed (₹2,000)',
      description: 'Dispatched monthly FTA statement email to rahul.sharma@enterprise-fta.in for employee confirmation or dispute.',
      source: 'Email Statement Service (Simulated)',
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
