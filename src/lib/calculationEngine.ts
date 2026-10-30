import {
  CityConfig,
  Employee,
  EmployeeStatement,
  RateConfig,
  SourceRecord,
} from '../types/fta';

export interface CalculationResult {
  statement: EmployeeStatement;
}

/**
 * Deterministic FTA Calculation Engine
 * - Never uses AI for financial calculations.
 * - Computes Local Meetings, New Launch (with New-City Outstation Rule),
 *   and Outstation Days (Special City ₹1,200, Own Vehicle Tier 1 ₹500, Tier 2/3 ₹400, or Standard).
 * - Enforces Designation-wise Maximum Claim Limits.
 */
export function calculateEmployeeStatement(
  employee: Employee,
  allRecords: SourceRecord[],
  rates: RateConfig[],
  cities: CityConfig[],
  month: string,
  ownerId: string,
  existingStatement?: Partial<EmployeeStatement>
): EmployeeStatement {
  // A record must be synced and source-verified before it can affect a
  // reimbursement. Pending GPS verification is not eligible; records corrected
  // in the source system become eligible once they are synced.
  const empRecords = allRecords.filter(
    (r) =>
      r.employeeId === employee.id &&
      r.syncStatus === 'Synced' &&
      (r.sourceStatus === 'Verified' || r.sourceStatus === 'Corrected in Source') &&
      r.date.startsWith(month)
  );

  const rateConfig = rates.find((r) => r.designation === employee.designation) || {
    id: 'RATE-DEFAULT',
    designation: employee.designation,
    tier1LocalRate: 50,
    tier2LocalRate: 45,
    tier3LocalRate: 40,
    newLaunchRate: 50,
    specialCityOutstationRate: 1200,
    ownVehicleTier1Rate: 500,
    ownVehicleTier23Rate: 400,
    standardOutstationRate: 800,
    maxClaimLimit: 15000,
    isIllustrative: true,
    approvalStatus: 'Illustrative – Pending HR Policy Approval',
    ownerId,
  };

  // 1. Local Meetings Calculation
  const localRecords = empRecords.filter((r) => r.meetingCategory === 'Local');
  const eligibleLocalMeetings = localRecords.length;

  let localRate = rateConfig.tier1LocalRate;
  if (employee.cityCategory === 'Tier 2') {
    localRate = rateConfig.tier2LocalRate;
  } else if (employee.cityCategory === 'Tier 3') {
    localRate = rateConfig.tier3LocalRate;
  }
  const localAmount = eligibleLocalMeetings * localRate;

  // 2. Outstation Days Calculation
  const outstationRecords = empRecords.filter(
    (r) => r.meetingCategory === 'Outstation'
  );
  const outstationDays = outstationRecords.length;

  // Track which (date, city) combinations have Outstation claimed (for New-City Outstation Rule)
  const outstationDateCitySet = new Set(
    outstationRecords.map((r) => `${r.date}|${r.city.toLowerCase()}`)
  );

  let outstationAmount = 0;
  let outstationDailyRate = 0;
  let outstationRateType = 'None';

  if (outstationDays > 0) {
    const rateTypesUsed = new Set<string>();
    for (const rec of outstationRecords) {
      const cityObj = cities.find(
        (c) => c.cityName.toLowerCase() === rec.city.toLowerCase()
      );
      const isSpecial = cityObj ? cityObj.isSpecialCity : rec.cityCategory === 'Special City';
      const tier = cityObj ? cityObj.tier : rec.cityCategory;

      let dayRate = rateConfig.standardOutstationRate;
      let dayType = `Standard (${rec.city})`;

      if (isSpecial) {
        dayRate = rateConfig.specialCityOutstationRate; // ₹1,200
        dayType = 'Special City (₹1,200/day)';
      } else if (rec.vehicleMode === 'Own Vehicle' && employee.ownVehicleEligible) {
        if (tier === 'Tier 1') {
          dayRate = rateConfig.ownVehicleTier1Rate; // ₹500
          dayType = 'Own Vehicle Tier 1 (₹500/day)';
        } else {
          dayRate = rateConfig.ownVehicleTier23Rate; // ₹400
          dayType = 'Own Vehicle Tier 2/3 (₹400/day)';
        }
      } else {
        dayRate = rateConfig.standardOutstationRate;
        dayType = `Standard Outstation (₹${rateConfig.standardOutstationRate}/day)`;
      }

      outstationAmount += dayRate;
      outstationDailyRate = dayRate;
      rateTypesUsed.add(dayType);
    }
    outstationRateType = Array.from(rateTypesUsed).join(' + ');
  }

  // 3. New Launch Meetings Calculation (₹50/meeting, subject to New-City Outstation Rule)
  const rawNewLaunchRecords = empRecords.filter(
    (r) => r.meetingCategory === 'New Launch'
  );
  let eligibleNewLaunchCount = 0;
  let newLaunchRuleExcluded = 0;

  for (const nlRec of rawNewLaunchRecords) {
    const key = `${nlRec.date}|${nlRec.city.toLowerCase()}`;
    if (outstationDateCitySet.has(key)) {
      // Excluded per New-City Outstation Rule (cannot claim per-meeting New Launch when Outstation DA is active for same date/city)
      newLaunchRuleExcluded += 1;
    } else {
      eligibleNewLaunchCount += 1;
    }
  }

  const newLaunchRate = rateConfig.newLaunchRate; // ₹50
  const newLaunchAmount = eligibleNewLaunchCount * newLaunchRate;

  // 4. Gross & Designation Max Claim Cap
  const grossAmount = localAmount + newLaunchAmount + outstationAmount;
  const maxClaimLimit = rateConfig.maxClaimLimit;
  const capApplied = grossAmount > maxClaimLimit;
  const netAmount = capApplied ? maxClaimLimit : grossAmount;

  // 5. Transparent Formula Breakdown Trace
  const traceParts: string[] = [];
  traceParts.push(
    `Local: ${eligibleLocalMeetings} mtgs × ₹${localRate} (${employee.designation} · ${employee.cityCategory}) = ₹${localAmount.toLocaleString('en-IN')}`
  );
  if (eligibleNewLaunchCount > 0 || newLaunchRuleExcluded > 0) {
    traceParts.push(
      `New Launch: ${eligibleNewLaunchCount} eligible mtgs × ₹${newLaunchRate} = ₹${newLaunchAmount.toLocaleString('en-IN')}${
        newLaunchRuleExcluded > 0
          ? ` (${newLaunchRuleExcluded} excluded by New-City Outstation Rule)`
          : ''
      }`
    );
  } else {
    traceParts.push(`New Launch: 0 mtgs = ₹0`);
  }
  if (outstationDays > 0) {
    traceParts.push(
      `Outstation: ${outstationDays} days [${outstationRateType}] = ₹${outstationAmount.toLocaleString('en-IN')}`
    );
  } else {
    traceParts.push(`Outstation: 0 days = ₹0`);
  }
  if (capApplied) {
    traceParts.push(
      `Gross ₹${grossAmount.toLocaleString('en-IN')} capped at ${employee.designation} Max Limit ₹${maxClaimLimit.toLocaleString('en-IN')} → Net ₹${netAmount.toLocaleString('en-IN')}`
    );
  } else {
    traceParts.push(
      `Total FTA = ₹${netAmount.toLocaleString('en-IN')} (Within ₹${maxClaimLimit.toLocaleString('en-IN')} ${employee.designation} cap · Illustrative Rate)`
    );
  }

  const calculationTrace = traceParts.join(' | ').slice(0, 990);

  return {
    id: existingStatement?.id || `STMT-${employee.id}`,
    employeeId: employee.id,
    employeeName: employee.name,
    designation: employee.designation,
    department: employee.department,
    baseCity: employee.baseCity,
    cityCategory: employee.cityCategory,
    baOwner: employee.baOwner,
    month,
    sourceTool: employee.sourceTool,
    eligibleLocalMeetings,
    localRate,
    localAmount,
    newLaunchMeetings: eligibleNewLaunchCount,
    newLaunchRuleExcluded,
    newLaunchRate,
    newLaunchAmount,
    outstationDays,
    outstationRateType,
    outstationDailyRate,
    outstationAmount,
    grossAmount,
    maxClaimLimit,
    capApplied,
    netAmount,
    calculationTrace,
    status: existingStatement?.status || 'Generated',
    payoutLocked: existingStatement?.payoutLocked ?? false,
    lockVersion: existingStatement?.lockVersion ?? 1,
    changeRequestStatus: existingStatement?.changeRequestStatus || 'None',
    changeRequestReason: existingStatement?.changeRequestReason || 'N/A',
    disputeTicketId: existingStatement?.disputeTicketId || 'NONE',
    payoutBatchId: existingStatement?.payoutBatchId || 'NONE',
    payoutStatus: existingStatement?.payoutStatus || 'Not Initiated',
    utrNumber: existingStatement?.utrNumber || 'PENDING',
    ownerId,
  };
}
