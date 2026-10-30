import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateEmployeeStatement } from './calculationEngine';
import type { CityConfig, Employee, RateConfig, SourceRecord } from '../types/fta';

const employee: Employee = {
  id: 'EMP-1',
  name: 'Test Employee',
  email: 'test@example.com',
  designation: 'BD Manager',
  department: 'Sales',
  baseCity: 'Pune',
  cityCategory: 'Tier 1',
  reportingManager: 'Manager',
  baOwner: 'BA',
  baRegion: 'West',
  sourceTool: 'Prowl',
  ownVehicleEligible: false,
  status: 'Active',
  ownerId: 'owner-1',
};

const rates: RateConfig[] = [{
  id: 'RATE-1',
  designation: 'BD Manager',
  tier1LocalRate: 50,
  tier2LocalRate: 45,
  tier3LocalRate: 40,
  newLaunchRate: 50,
  specialCityOutstationRate: 1200,
  ownVehicleTier1Rate: 500,
  ownVehicleTier23Rate: 400,
  standardOutstationRate: 800,
  maxClaimLimit: 15000,
  isIllustrative: false,
  approvalStatus: 'Approved',
  ownerId: 'owner-1',
}];

const cities: CityConfig[] = [];

function sourceRecord(
  id: string,
  sourceStatus: string,
  syncStatus = 'Synced',
  meetingCategory = 'Local'
): SourceRecord {
  return {
    id,
    externalRefId: id,
    employeeId: 'EMP-1',
    employeeName: 'Test Employee',
    department: 'Sales',
    date: '2026-10-12',
    city: 'Pune',
    cityCategory: 'Tier 1',
    meetingCategory,
    vehicleMode: 'Standard',
    sourceTool: 'Prowl',
    sourceStatus,
    syncStatus,
    clientName: 'Client',
    notes: '',
    ticketRef: '',
    ownerId: 'owner-1',
  };
}

test('only synced and source-verified records contribute to FTA', () => {
  const records = [
    sourceRecord('VERIFIED-1', 'Verified'),
    sourceRecord('CORRECTED-1', 'Corrected in Source'),
    sourceRecord('PENDING-1', 'Pending GPS Check-in Verification'),
    sourceRecord('DUPLICATE-1', 'Verified', 'Excluded - Duplicate'),
    sourceRecord('HOLD-1', 'Verified', 'Unsynced - Source Hold'),
  ];

  const statement = calculateEmployeeStatement(
    employee, records, rates, cities, '2026-10', 'owner-1'
  );

  assert.equal(statement.eligibleLocalMeetings, 2);
  assert.equal(statement.localAmount, 100);
  assert.equal(statement.grossAmount, 100);
  assert.equal(statement.netAmount, 100);
});

test('records from another employee or month do not contribute to FTA', () => {
  const otherEmployee = { ...sourceRecord('OTHER-EMP', 'Verified'), employeeId: 'EMP-2' };
  const otherMonth = { ...sourceRecord('OTHER-MONTH', 'Verified'), date: '2026-09-30' };

  const statement = calculateEmployeeStatement(
    employee, [otherEmployee, otherMonth], rates, cities, '2026-10', 'owner-1'
  );

  assert.equal(statement.eligibleLocalMeetings, 0);
  assert.equal(statement.localAmount, 0);
});
