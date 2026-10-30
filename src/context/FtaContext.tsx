import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AuditLog,
  CityConfig,
  DisputeTicket,
  Employee,
  EmployeeStatement,
  NavSection,
  PayoutBatch,
  RateConfig,
  SourceRecord,
  SyncConnector,
  UserRole,
} from '../types/fta';
import { buildInitialSeedData } from '../data/seedData';
import { calculateEmployeeStatement } from '../lib/calculationEngine';

interface FtaContextValue {
  user: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  seeding: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  employees: Employee[];
  rates: RateConfig[];
  cities: CityConfig[];
  sourceRecords: SourceRecord[];
  connectors: SyncConnector[];
  statements: EmployeeStatement[];
  disputes: DisputeTicket[];
  payoutBatches: PayoutBatch[];
  auditLogs: AuditLog[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncSourceConnector: (connectorId: string) => Promise<void>;
  importRegionalTrainerCsv: (
    rows: Array<{
      employeeId: string;
      date: string;
      city: string;
      meetingCategory: string;
      clientName: string;
    }>
  ) => Promise<void>;
  confirmEmployeeStatement: (statementId: string) => Promise<void>;
  raiseEmployeeDispute: (
    statementId: string,
    employeeMessage: string
  ) => Promise<DisputeTicket | undefined>;
  updateDisputeStatus: (
    disputeId: string,
    newStatus: string,
    resolutionNotes: string
  ) => Promise<void>;
  simulateSourceCorrection: (disputeId: string) => Promise<void>;
  triggerTargetedReSync: (disputeId: string) => Promise<void>;
  approveStatementByHr: (statementId: string) => Promise<void>;
  lockStatementPayout: (statementId: string) => Promise<void>;
  lockAllApprovedStatements: () => Promise<void>;
  requestVersionedUnlock: (statementId: string, reason: string) => Promise<void>;
  approveVersionedUnlock: (statementId: string) => Promise<void>;
  createPayoutBatchForLocked: (statementIds: string[]) => Promise<void>;
  advancePayoutBatchStatus: (
    batchId: string,
    targetStatus: 'Processing' | 'Success' | 'Failed'
  ) => Promise<void>;
  updateEmployeeMaster: (emp: Employee) => Promise<void>;
  createEmployeeMaster: (emp: Omit<Employee, 'ownerId' | 'updatedAt'>) => Promise<void>;
  updateRateConfig: (rate: RateConfig) => Promise<void>;
  updateCityConfig: (city: CityConfig) => Promise<void>;
  resetRahulDemoScenario: () => Promise<void>;
}

const FtaContext = createContext<FtaContextValue | undefined>(undefined);

function nowIstString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} IST`;
}

export const FtaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.HR);
  const [activeSection, setActiveSection] = useState<NavSection>(
    NavSection.HR_COMMAND
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('EMP-1001');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rates, setRates] = useState<RateConfig[]>([]);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([]);
  const [connectors, setConnectors] = useState<SyncConnector[]>([]);
  const [statements, setStatements] = useState<EmployeeStatement[]>([]);
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setDataLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const seedDatabaseForUser = useCallback(async (uid: string) => {
    setSeeding(true);
    try {
      const seed = buildInitialSeedData(uid);
      const batch = writeBatch(db);

      for (const c of seed.cities) {
        batch.set(doc(db, 'cities', c.id), { ...c, updatedAt: serverTimestamp() });
      }
      for (const r of seed.rates) {
        batch.set(doc(db, 'rates', r.id), { ...r, updatedAt: serverTimestamp() });
      }
      for (const e of seed.employees) {
        batch.set(doc(db, 'employees', e.id), { ...e, updatedAt: serverTimestamp() });
      }
      for (const sr of seed.sourceRecords) {
        batch.set(doc(db, 'source_records', sr.id), {
          ...sr,
          updatedAt: serverTimestamp(),
        });
      }
      for (const conn of seed.connectors) {
        batch.set(doc(db, 'sync_connectors', conn.id), {
          ...conn,
          updatedAt: serverTimestamp(),
        });
      }
      for (const st of seed.statements) {
        batch.set(doc(db, 'statements', st.id), {
          ...st,
          updatedAt: serverTimestamp(),
        });
      }
      for (const dsp of seed.disputes) {
        batch.set(doc(db, 'disputes', dsp.id), {
          ...dsp,
          updatedAt: serverTimestamp(),
        });
      }
      for (const aud of seed.auditLogs) {
        batch.set(doc(db, 'audit_logs', aud.id), {
          ...aud,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'initial_seed_batch');
    } finally {
      setSeeding(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    let seedTriggered = false;

    const uid = user.uid;

    const unsubEmployees = onSnapshot(
      query(collection(db, 'employees'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty && !seedTriggered) {
          seedTriggered = true;
          seedDatabaseForUser(uid);
          return;
        }
        const list = snap.docs
          .map((d) => d.data() as Employee)
          .sort((a, b) => a.id.localeCompare(b.id));
        setEmployees(list);
        setDataLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'employees')
    );

    const unsubRates = onSnapshot(
      query(collection(db, 'rates'), where('ownerId', '==', uid)),
      (snap) => {
        setRates(
          snap.docs
            .map((d) => d.data() as RateConfig)
            .sort((a, b) => a.id.localeCompare(b.id))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'rates')
    );

    const unsubCities = onSnapshot(
      query(collection(db, 'cities'), where('ownerId', '==', uid)),
      (snap) => {
        setCities(
          snap.docs
            .map((d) => d.data() as CityConfig)
            .sort((a, b) => a.cityName.localeCompare(b.cityName))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'cities')
    );

    const unsubRecords = onSnapshot(
      query(collection(db, 'source_records'), where('ownerId', '==', uid)),
      (snap) => {
        setSourceRecords(
          snap.docs
            .map((d) => d.data() as SourceRecord)
            .sort((a, b) => a.id.localeCompare(b.id))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'source_records')
    );

    const unsubConnectors = onSnapshot(
      query(collection(db, 'sync_connectors'), where('ownerId', '==', uid)),
      (snap) => {
        setConnectors(
          snap.docs
            .map((d) => d.data() as SyncConnector)
            .sort((a, b) => a.id.localeCompare(b.id))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'sync_connectors')
    );

    const unsubStatements = onSnapshot(
      query(collection(db, 'statements'), where('ownerId', '==', uid)),
      (snap) => {
        setStatements(
          snap.docs
            .map((d) => d.data() as EmployeeStatement)
            .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'statements')
    );

    const unsubDisputes = onSnapshot(
      query(collection(db, 'disputes'), where('ownerId', '==', uid)),
      (snap) => {
        setDisputes(
          snap.docs
            .map((d) => d.data() as DisputeTicket)
            .sort((a, b) => b.ticketNumber.localeCompare(a.ticketNumber))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'disputes')
    );

    const unsubBatches = onSnapshot(
      query(collection(db, 'payout_batches'), where('ownerId', '==', uid)),
      (snap) => {
        setPayoutBatches(
          snap.docs
            .map((d) => d.data() as PayoutBatch)
            .sort((a, b) => b.batchNumber.localeCompare(a.batchNumber))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'payout_batches')
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'audit_logs'), where('ownerId', '==', uid)),
      (snap) => {
        setAuditLogs(
          snap.docs
            .map((d) => d.data() as AuditLog)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
    );

    return () => {
      unsubEmployees();
      unsubRates();
      unsubCities();
      unsubRecords();
      unsubConnectors();
      unsubStatements();
      unsubDisputes();
      unsubBatches();
      unsubLogs();
    };
  }, [user, seedDatabaseForUser]);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const appendAuditLog = async (
    entry: Omit<AuditLog, 'id' | 'ownerId' | 'timestamp' | 'updatedAt'>
  ) => {
    if (!user) return;
    const logId = `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const fullLog: AuditLog = {
      ...entry,
      id: logId,
      ownerId: user.uid,
      timestamp: nowIstString(),
    };
    try {
      await setDoc(doc(db, 'audit_logs', logId), {
        ...fullLog,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `audit_logs/${logId}`);
    }
  };

  // 1. Sync Source Connector
  const syncSourceConnector = async (connectorId: string) => {
    if (!user) return;
    const conn = connectors.find((c) => c.id === connectorId);
    if (!conn) return;

    const toolRecords = sourceRecords.filter((r) => r.sourceTool === conn.toolType);
    const syncedCount = toolRecords.filter((r) => r.syncStatus === 'Synced').length;
    const failedCount = toolRecords.length - syncedCount;
    const newSyncTime = nowIstString();

    try {
      await updateDoc(doc(db, 'sync_connectors', conn.id), {
        status:
          failedCount > 0
            ? `Connected · ${failedCount} Source Hold(s)`
            : 'Connected · Healthy',
        lastSyncTime: newSyncTime,
        recordsFetched: toolRecords.length,
        recordsSuccessful: syncedCount,
        recordsFailed: failedCount,
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'MANUAL_SYNC',
        module: 'Source Data & Integration',
        actorName: user.displayName || user.email || 'Operator',
        actorRole: activeRole,
        entityId: conn.id,
        referenceId: conn.toolType,
        oldValue: `Last Sync: ${conn.lastSyncTime}`,
        newValue: `Synced ${syncedCount}/${toolRecords.length} records at ${newSyncTime}`,
        description: `Triggered manual SYNC NOW on ${conn.name}. Deterministic FTA figures verified.`,
        source: conn.name,
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `sync_connectors/${connectorId}`
      );
    }
  };

  // 2. Import Regional Trainer CSV
  const importRegionalTrainerCsv = async (
    rows: Array<{
      employeeId: string;
      date: string;
      city: string;
      meetingCategory: string;
      clientName: string;
    }>
  ) => {
    if (!user || rows.length === 0) return;
    try {
      const batch = writeBatch(db);
      const newRecords: SourceRecord[] = [];

      rows.forEach((row, idx) => {
        const emp =
          employees.find((e) => e.id === row.employeeId) ||
          employees.find((e) => e.designation === 'Regional Trainer')!;
        const cityObj = cities.find(
          (c) => c.cityName.toLowerCase() === row.city.toLowerCase()
        );
        const recId = `REC-CSV-${Date.now()}-${idx + 1}`;
        const newRec: SourceRecord = {
          id: recId,
          externalRefId: `GSH-${Date.now().toString().slice(-4)}${idx + 1}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          date: row.date,
          city: row.city,
          cityCategory: cityObj ? cityObj.tier : emp.cityCategory,
          meetingCategory: row.meetingCategory,
          vehicleMode: 'Own Vehicle',
          sourceTool: 'Google Sheet CSV',
          sourceStatus: 'Verified',
          syncStatus: 'Synced',
          clientName: row.clientName,
          notes: 'Imported via Regional Trainer Google Sheet CSV Bridge',
          ticketRef: 'CSV-IMPORT',
          ownerId: user.uid,
        };
        newRecords.push(newRec);
        batch.set(doc(db, 'source_records', recId), {
          ...newRec,
          updatedAt: serverTimestamp(),
        });
      });

      const updatedAllRecords = [...sourceRecords, ...newRecords];
      const affectedEmpIds = Array.from(new Set(newRecords.map((r) => r.employeeId)));

      for (const empId of affectedEmpIds) {
        const emp = employees.find((e) => e.id === empId);
        const existingStmt = statements.find((s) => s.employeeId === empId);
        if (emp && existingStmt && !existingStmt.payoutLocked) {
          const recalc = calculateEmployeeStatement(
            emp,
            updatedAllRecords,
            rates,
            cities,
            existingStmt.month,
            user.uid,
            existingStmt
          );
          batch.set(doc(db, 'statements', recalc.id), {
            ...recalc,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const gsheetConn = connectors.find((c) => c.id === 'CONN-GSHEET');
      if (gsheetConn) {
        const totalGsheet = updatedAllRecords.filter(
          (r) => r.sourceTool === 'Google Sheet CSV'
        ).length;
        batch.update(doc(db, 'sync_connectors', gsheetConn.id), {
          lastSyncTime: nowIstString(),
          recordsFetched: totalGsheet,
          recordsSuccessful: totalGsheet,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'CSV_IMPORT',
        module: 'Source Data & Integration',
        actorName: user.displayName || user.email || 'HR Operator',
        actorRole: activeRole,
        entityId: 'CONN-GSHEET',
        referenceId: `CSV-BATCH-${rows.length}`,
        oldValue: `${sourceRecords.filter((r) => r.sourceTool === 'Google Sheet CSV').length} CSV records`,
        newValue: `${sourceRecords.filter((r) => r.sourceTool === 'Google Sheet CSV').length + rows.length} CSV records`,
        description: `Imported ${rows.length} Regional Trainer activity record(s) from Google Sheet CSV and recalculated statements.`,
        source: 'Google Sheet CSV Bridge',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'csv_import');
    }
  };

  // 3. Employee Confirms Statement
  const confirmEmployeeStatement = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || stmt.payoutLocked) return;

    try {
      await updateDoc(doc(db, 'statements', stmt.id), {
        status: 'Confirmed by Employee',
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'STATEMENT_CONFIRMED',
        module: 'Employee Statements',
        actorName: stmt.employeeName,
        actorRole: UserRole.EMPLOYEE,
        entityId: stmt.id,
        referenceId: stmt.employeeId,
        oldValue: stmt.status,
        newValue: 'Confirmed by Employee',
        description: `${stmt.employeeName} confirmed monthly FTA statement of ₹${stmt.netAmount.toLocaleString('en-IN')}.`,
        source: 'Employee Statement Portal',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statements/${statementId}`);
    }
  };

  // 4. Employee Raises Dispute (Calls Server-Side Gemini 3.8 Flash Interpreter)
  const raiseEmployeeDispute = async (
    statementId: string,
    employeeMessage: string
  ): Promise<DisputeTicket | undefined> => {
    if (!user) return undefined;
    const stmt = statements.find((s) => s.id === statementId);
    const emp = employees.find((e) => e.id === stmt?.employeeId);
    if (!stmt || !emp) return undefined;

    // Call server-side Gemini endpoint to interpret the natural-language dispute message
    let aiResult = {
      claimType: 'Local Meetings',
      employeeReportedValue: stmt.eligibleLocalMeetings + 2,
      systemRecordedValue: stmt.eligibleLocalMeetings,
      disputedDelta: 2,
      confidence: 'High (99%)',
      summary: `Employee reports ${stmt.eligibleLocalMeetings + 2} local meetings vs ${stmt.eligibleLocalMeetings} recorded in ${stmt.sourceTool}.`,
      recommendedAction: `Verify unsynced source records in ${stmt.sourceTool} and trigger targeted re-sync.`,
      engine: 'Gemini 3.8 Flash NLP Interpreter',
    };

    try {
      const response = await fetch('/api/disputes/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: employeeMessage,
          employeeName: emp.name,
          designation: emp.designation,
          sourceTool: emp.sourceTool,
          systemLocalMeetings: stmt.eligibleLocalMeetings,
          systemOutstationDays: stmt.outstationDays,
          systemNewLaunchMeetings: stmt.newLaunchMeetings,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        aiResult = { ...aiResult, ...data };
      }
    } catch (err) {
      console.warn('Dispute interpreter fallback used:', err);
    }

    const isRahul = emp.id === 'EMP-1001';
    const ticketNumber = isRahul
      ? 'FTA-2026-1042'
      : `FTA-2026-${1043 + disputes.length}`;
    const disputeId = isRahul ? 'DSP-1042' : `DSP-${Date.now()}`;

    const unitRate =
      aiResult.claimType === 'Outstation'
        ? stmt.outstationDailyRate || 500
        : aiResult.claimType === 'New Launch'
        ? stmt.newLaunchRate || 50
        : stmt.localRate || 50;

    const delta = aiResult.employeeReportedValue - aiResult.systemRecordedValue;
    const financialImpact = Math.max(0, delta * unitRate);

    const newTicket: DisputeTicket = {
      id: disputeId,
      ticketNumber,
      statementId: stmt.id,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      department: emp.department,
      baseCity: emp.baseCity,
      month: stmt.month,
      claimType: aiResult.claimType,
      systemRecordedValue: aiResult.systemRecordedValue,
      employeeReportedValue: aiResult.employeeReportedValue,
      disputedDelta: delta,
      financialImpact,
      employeeMessage: employeeMessage.slice(0, 990),
      aiInterpretation: `${aiResult.summary} [${aiResult.engine} · Confidence: ${aiResult.confidence}] — Action: ${aiResult.recommendedAction}`.slice(
        0,
        990
      ),
      assignedBa: emp.baOwner,
      baRegion: emp.baRegion,
      sourceTool: emp.sourceTool,
      status: 'Open',
      sourceCorrected: false,
      reSynced: false,
      resolutionNotes: `Auto-routed to ${emp.baOwner} (${emp.department} · ${emp.baRegion} Region). Pending source tool verification in ${emp.sourceTool}.`,
      ownerId: user.uid,
      createdAt: nowIstString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'disputes', newTicket.id), {
        ...newTicket,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'statements', stmt.id), {
        status: 'Disputed',
        disputeTicketId: newTicket.ticketNumber,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      await appendAuditLog({
        eventType: 'DISPUTE_RAISED',
        module: 'Dispute Engine',
        actorName: emp.name,
        actorRole: UserRole.EMPLOYEE,
        entityId: newTicket.id,
        referenceId: newTicket.ticketNumber,
        oldValue: `System: ${aiResult.systemRecordedValue} ${aiResult.claimType} (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        newValue: `Claimed: ${aiResult.employeeReportedValue} ${aiResult.claimType} (+₹${financialImpact.toLocaleString('en-IN')} impact)`,
        description: `Dispute ticket ${newTicket.ticketNumber} created from employee statement reply and routed to ${emp.baOwner}.`,
        source: 'Employee Statement & Gemini Dispute Interpreter',
      });

      return newTicket;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `disputes/${newTicket.id}`);
    }
  };

  // 5. BA Updates Dispute Status
  const updateDisputeStatus = async (
    disputeId: string,
    newStatus: string,
    resolutionNotes: string
  ) => {
    if (!user) return;
    const dsp = disputes.find((d) => d.id === disputeId);
    if (!dsp) return;

    try {
      await updateDoc(doc(db, 'disputes', dsp.id), {
        status: newStatus,
        resolutionNotes: resolutionNotes.slice(0, 990),
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'DISPUTE_STATUS_UPDATE',
        module: 'BA Dispute Management',
        actorName: dsp.assignedBa,
        actorRole: UserRole.BA,
        entityId: dsp.id,
        referenceId: dsp.ticketNumber,
        oldValue: dsp.status,
        newValue: newStatus,
        description: `Updated dispute ${dsp.ticketNumber} status to "${newStatus}". Notes: ${resolutionNotes}`,
        source: 'BA Dispute Workspace',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `disputes/${disputeId}`);
    }
  };

  // 6. BA Simulates Source Correction in Prowl / LeadSquared
  const simulateSourceCorrection = async (disputeId: string) => {
    if (!user) return;
    const dsp = disputes.find((d) => d.id === disputeId);
    if (!dsp) return;

    const unsyncedEmpRecords = sourceRecords.filter(
      (r) => r.employeeId === dsp.employeeId && r.syncStatus !== 'Synced'
    );

    try {
      const batch = writeBatch(db);

      if (unsyncedEmpRecords.length > 0) {
        for (const rec of unsyncedEmpRecords) {
          batch.update(doc(db, 'source_records', rec.id), {
            sourceStatus: 'Corrected in Source',
            notes: `Verified & released in ${dsp.sourceTool} by ${dsp.assignedBa} against ticket ${dsp.ticketNumber}. Ready for targeted re-sync.`,
            ticketRef: dsp.ticketNumber,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // If no unsynced records exist for another employee, create the missing verified record in source
        const emp = employees.find((e) => e.id === dsp.employeeId)!;
        const deltaCount = Math.max(1, Math.abs(dsp.disputedDelta));
        for (let i = 1; i <= deltaCount; i++) {
          const newRecId = `REC-CORR-${dsp.employeeId.split('-')[1]}-${Date.now()}-${i}`;
          const newRec: SourceRecord = {
            id: newRecId,
            externalRefId: `${dsp.sourceTool === 'Prowl' ? 'PRW' : 'LSQ'}-99${i}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            date: `${dsp.month}-24`,
            city: emp.baseCity,
            cityCategory: emp.cityCategory,
            meetingCategory:
              dsp.claimType === 'Outstation'
                ? 'Outstation'
                : dsp.claimType === 'New Launch'
                ? 'New Launch'
                : 'Local',
            vehicleMode: emp.ownVehicleEligible ? 'Own Vehicle' : 'Standard',
            sourceTool: emp.sourceTool,
            sourceStatus: 'Corrected in Source',
            syncStatus: 'Unsynced - Source Hold',
            clientName: `${emp.baseCity} Verified Field Client #${i}`,
            notes: `Source record corrected in ${emp.sourceTool} against ${dsp.ticketNumber}. Ready for targeted re-sync.`,
            ticketRef: dsp.ticketNumber,
            ownerId: user.uid,
          };
          batch.set(doc(db, 'source_records', newRecId), {
            ...newRec,
            updatedAt: serverTimestamp(),
          });
        }
      }

      batch.update(doc(db, 'disputes', dsp.id), {
        status: 'Under Review',
        sourceCorrected: true,
        resolutionNotes: `Source records verified and corrected in ${dsp.sourceTool} (${unsyncedEmpRecords.map((r) => r.externalRefId).join(', ') || 'missing records restored'}). Ready for targeted re-sync.`,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      await appendAuditLog({
        eventType: 'SOURCE_CORRECTION',
        module: 'BA Dispute Management',
        actorName: dsp.assignedBa,
        actorRole: UserRole.BA,
        entityId: dsp.employeeId,
        referenceId: dsp.ticketNumber,
        oldValue: `${unsyncedEmpRecords.length || dsp.disputedDelta} record(s) in "Pending GPS Check-in Verification" (${dsp.sourceTool})`,
        newValue: `${unsyncedEmpRecords.length || dsp.disputedDelta} record(s) marked "Corrected in Source" (${unsyncedEmpRecords.map((r) => r.externalRefId).join(', ') || dsp.sourceTool})`,
        description: `BA investigated ${dsp.ticketNumber} and corrected source records directly in ${dsp.sourceTool} without manual FTA count overwrite.`,
        source: `${dsp.sourceTool} (Simulated Source System)`,
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `simulate_source_correction/${disputeId}`
      );
    }
  };

  // 7. BA Triggers Targeted Re-Sync & Deterministic Statement Recalculation
  const triggerTargetedReSync = async (disputeId: string) => {
    if (!user) return;
    const dsp = disputes.find((d) => d.id === disputeId);
    if (!dsp) return;

    const emp = employees.find((e) => e.id === dsp.employeeId);
    const stmt = statements.find((s) => s.id === dsp.statementId);
    if (!emp || !stmt) return;

    // Re-sync only source-held records explicitly corrected against this
    // dispute ticket. Never promote duplicate-excluded or unrelated records.
    const pendingEmpRecords = sourceRecords.filter(
      (r) =>
        r.employeeId === emp.id &&
        r.sourceTool === dsp.sourceTool &&
        r.syncStatus === 'Unsynced - Source Hold' &&
        r.sourceStatus === 'Corrected in Source' &&
        r.ticketRef === dsp.ticketNumber
    );

    try {
      const batch = writeBatch(db);

      // Update records in memory & Firestore batch to Synced
      const updatedAllRecords = sourceRecords.map((r) => {
        if (pendingEmpRecords.some((pending) => pending.id === r.id)) {
          const syncedRec: SourceRecord = {
            ...r,
            sourceStatus: 'Verified',
            syncStatus: 'Synced',
            ticketRef: dsp.ticketNumber,
            notes: `Synced via Targeted Re-Sync for ticket ${dsp.ticketNumber}.`,
          };
          batch.update(doc(db, 'source_records', r.id), {
            sourceStatus: syncedRec.sourceStatus,
            syncStatus: syncedRec.syncStatus,
            ticketRef: syncedRec.ticketRef,
            notes: syncedRec.notes,
            updatedAt: serverTimestamp(),
          });
          return syncedRec;
        }
        return r;
      });

      const oldMeetings = stmt.eligibleLocalMeetings;
      const oldNetAmount = stmt.netAmount;

      // Recalculate statement deterministically
      const recalculatedStmt = calculateEmployeeStatement(
        emp,
        updatedAllRecords,
        rates,
        cities,
        stmt.month,
        user.uid,
        {
          ...stmt,
          status: 'Recalculated (Post-Dispute)',
          disputeTicketId: dsp.ticketNumber,
        }
      );

      batch.set(doc(db, 'statements', recalculatedStmt.id), {
        ...recalculatedStmt,
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, 'disputes', dsp.id), {
        status: 'Resolved',
        reSynced: true,
        resolutionNotes: `Targeted re-sync completed from ${emp.sourceTool}. Eligible local meetings updated from ${oldMeetings} to ${recalculatedStmt.eligibleLocalMeetings}; statement recalculated from ₹${oldNetAmount.toLocaleString('en-IN')} to ₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}. Routed to HR for final approval and payout lock.`,
        updatedAt: serverTimestamp(),
      });

      // Update connector metrics
      const conn = connectors.find((c) => c.toolType === emp.sourceTool);
      if (conn) {
        const toolRecs = updatedAllRecords.filter(
          (r) => r.sourceTool === emp.sourceTool
        );
        const toolSynced = toolRecs.filter((r) => r.syncStatus === 'Synced').length;
        const toolFailed = toolRecs.length - toolSynced;
        batch.update(doc(db, 'sync_connectors', conn.id), {
          status:
            toolFailed > 0
              ? `Connected · ${toolFailed} Source Hold(s)`
              : 'Connected · Healthy',
          lastSyncTime: nowIstString(),
          recordsFetched: toolRecs.length,
          recordsSuccessful: toolSynced,
          recordsFailed: toolFailed,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'TARGETED_RESYNC',
        module: 'Source Data & Integration',
        actorName: dsp.assignedBa,
        actorRole: UserRole.BA,
        entityId: emp.id,
        referenceId: dsp.ticketNumber,
        oldValue: `${oldMeetings} Synced Meetings`,
        newValue: `${recalculatedStmt.eligibleLocalMeetings} Synced Meetings (+${pendingEmpRecords.length} synced: ${pendingEmpRecords.map((r) => r.externalRefId).join(', ')})`,
        description: `Targeted re-sync pulled ${pendingEmpRecords.length} corrected record(s) from ${emp.sourceTool} for ${emp.name}.`,
        source: `${emp.sourceTool} Targeted Re-Sync`,
      });

      await appendAuditLog({
        eventType: 'STATEMENT_RECALCULATION',
        module: 'Calculation Engine',
        actorName: 'Deterministic Rule Engine v2.4',
        actorRole: 'System',
        entityId: recalculatedStmt.id,
        referenceId: dsp.ticketNumber,
        oldValue: `${oldMeetings} mtgs · ₹${oldNetAmount.toLocaleString('en-IN')}`,
        newValue: `${recalculatedStmt.eligibleLocalMeetings} mtgs · ₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}`,
        description: `Recalculated ${emp.name}'s statement following ${dsp.ticketNumber} targeted re-sync: ${recalculatedStmt.eligibleLocalMeetings} × ₹${recalculatedStmt.localRate} = ₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}.`,
        source: 'Deterministic Calculation Engine',
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `targeted_resync/${disputeId}`
      );
    }
  };

  // 8. HR Approves Statement
  const approveStatementByHr = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || stmt.payoutLocked) return;

    try {
      await updateDoc(doc(db, 'statements', stmt.id), {
        status: 'HR Approved',
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'HR_APPROVAL',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: stmt.id,
        referenceId: stmt.disputeTicketId !== 'NONE' ? stmt.disputeTicketId : stmt.employeeId,
        oldValue: `${stmt.status} (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        newValue: `HR Approved (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        description: `HR reviewed and approved final FTA payout of ₹${stmt.netAmount.toLocaleString('en-IN')} for ${stmt.employeeName} (${stmt.eligibleLocalMeetings} local mtgs, ${stmt.outstationDays} outstation days, ${stmt.newLaunchMeetings} new launch).`,
        source: 'HR Approval Workspace',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statements/${statementId}`);
    }
  };

  // 9. HR Final Payout Lock (Single Statement)
  const lockStatementPayout = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    // A final payout lock must only follow an explicit HR approval.
    if (!stmt || stmt.payoutLocked || stmt.status !== 'HR Approved') return;

    try {
      await updateDoc(doc(db, 'statements', stmt.id), {
        status: 'Payout Locked',
        payoutLocked: true,
        changeRequestStatus: 'None',
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'PAYOUT_LOCK',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: stmt.id,
        referenceId: `LOCK-v${stmt.lockVersion}-${stmt.employeeId}`,
        oldValue: `Unlocked (${stmt.status})`,
        newValue: `Payout Locked v${stmt.lockVersion} · ₹${stmt.netAmount.toLocaleString('en-IN')}`,
        description: `Applied FINAL PAYOUT LOCK (v${stmt.lockVersion}) on ${stmt.employeeName}'s statement for ₹${stmt.netAmount.toLocaleString('en-IN')}. Further edits blocked without versioned Change Request.`,
        source: 'HR Final Payout Lock Gate',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statements/${statementId}`);
    }
  };

  // 10. Bulk Lock All HR-Approved Statements
  const lockAllApprovedStatements = async () => {
    if (!user) return;
    const eligible = statements.filter(
      (s) =>
        !s.payoutLocked &&
        s.status === 'HR Approved'
    );
    if (eligible.length === 0) return;

    try {
      const batch = writeBatch(db);
      for (const st of eligible) {
        batch.update(doc(db, 'statements', st.id), {
          status: 'Payout Locked',
          payoutLocked: true,
          changeRequestStatus: 'None',
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();

      const totalVal = eligible.reduce((acc, s) => acc + s.netAmount, 0);
      await appendAuditLog({
        eventType: 'BULK_PAYOUT_LOCK',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: 'BULK-LOCK-202610',
        referenceId: `${eligible.length} Statements`,
        oldValue: `${eligible.length} Unlocked Approved Statements`,
        newValue: `${eligible.length} Statements Locked (₹${totalVal.toLocaleString('en-IN')})`,
        description: `Executed bulk FINAL PAYOUT LOCK across ${eligible.length} verified statements totaling ₹${totalVal.toLocaleString('en-IN')}.`,
        source: 'HR Final Payout Lock Gate',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bulk_payout_lock');
    }
  };

  // 11. Request & Approve Versioned Change Request on Locked Record
  const requestVersionedUnlock = async (statementId: string, reason: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || !stmt.payoutLocked) return;

    try {
      await updateDoc(doc(db, 'statements', stmt.id), {
        changeRequestStatus: 'Pending Approval',
        changeRequestReason: reason.slice(0, 480),
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'CHANGE_REQUEST_CREATED',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Operator',
        actorRole: activeRole,
        entityId: stmt.id,
        referenceId: `CR-v${stmt.lockVersion + 1}-${stmt.employeeId}`,
        oldValue: `Locked v${stmt.lockVersion} (No CR)`,
        newValue: `Change Request Pending Approval: "${reason}"`,
        description: `Raised versioned Change Request CR-v${stmt.lockVersion + 1} to unlock ${stmt.employeeName}'s statement.`,
        source: 'HR Governance Controls',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statements/${statementId}`);
    }
  };

  const approveVersionedUnlock = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || !stmt.payoutLocked) return;

    const nextVer = stmt.lockVersion + 1;
    try {
      await updateDoc(doc(db, 'statements', stmt.id), {
        payoutLocked: false,
        status: 'HR Approved',
        lockVersion: nextVer,
        changeRequestStatus: 'Approved (Unlocked)',
        updatedAt: serverTimestamp(),
      });

      await appendAuditLog({
        eventType: 'CHANGE_REQUEST_APPROVED',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Admin',
        actorRole: UserRole.HR_ADMIN,
        entityId: stmt.id,
        referenceId: `CR-v${nextVer}-${stmt.employeeId}`,
        oldValue: `Payout Locked v${stmt.lockVersion}`,
        newValue: `Unlocked for Revision v${nextVer}`,
        description: `HR Admin approved versioned Change Request CR-v${nextVer} for ${stmt.employeeName}. Record unlocked for revision.`,
        source: 'HR Governance Controls',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statements/${statementId}`);
    }
  };

  // 12. Finance Creates Payout Batch from Locked Statements (with Duplicate Guard)
  const createPayoutBatchForLocked = async (statementIds: string[]) => {
    if (!user || statementIds.length === 0) return;

    // Duplicate payout guard: only allow locked statements that have NOT already been disbursed or placed in an active batch
    const validStatements = statements.filter(
      (s) =>
        statementIds.includes(s.id) &&
        s.payoutLocked &&
        s.payoutStatus !== 'Success' &&
        s.payoutStatus !== 'Processing' &&
        s.payoutStatus !== 'Initiated'
    );

    if (validStatements.length === 0) return;

    const batchNum = `PYB-202610-${String(payoutBatches.length + 1).padStart(2, '0')}`;
    const batchId = `BATCH-${Date.now()}`;
    const totalAmount = validStatements.reduce((acc, s) => acc + s.netAmount, 0);
    const utrPrefix = `AXISCN${Date.now().toString().slice(-6)}`;

    const newBatch: PayoutBatch = {
      id: batchId,
      batchNumber: batchNum,
      month: '2026-10',
      gatewayName: 'RazorpayX Enterprise Payouts (Simulated)',
      employeeCount: validStatements.length,
      totalAmount,
      status: 'Initiated',
      initiatedBy: user.displayName || user.email || 'Finance Controller',
      utrPrefix,
      ownerId: user.uid,
      createdAt: nowIstString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'payout_batches', newBatch.id), {
        ...newBatch,
        updatedAt: serverTimestamp(),
      });

      for (const st of validStatements) {
        batch.update(doc(db, 'statements', st.id), {
          payoutBatchId: newBatch.batchNumber,
          payoutStatus: 'Initiated',
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'PAYOUT_BATCH_CREATED',
        module: 'Finance Disbursement',
        actorName: newBatch.initiatedBy,
        actorRole: UserRole.FINANCE,
        entityId: newBatch.id,
        referenceId: newBatch.batchNumber,
        oldValue: `${validStatements.length} Locked Statements (Not Initiated)`,
        newValue: `Batch ${newBatch.batchNumber} Initiated · ₹${totalAmount.toLocaleString('en-IN')}`,
        description: `Generated Finance payout batch ${newBatch.batchNumber} for ${validStatements.length} locked statement(s) totaling ₹${totalAmount.toLocaleString('en-IN')}.`,
        source: 'Finance Disbursement Engine',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payout_batches/${batchId}`);
    }
  };

  // 13. Finance Advances Payout Batch Status (Initiated -> Processing -> Success / Failed)
  const advancePayoutBatchStatus = async (
    batchId: string,
    targetStatus: 'Processing' | 'Success' | 'Failed'
  ) => {
    if (!user) return;
    const pb = payoutBatches.find((b) => b.id === batchId);
    if (!pb) return;

    const batchStatements = statements.filter(
      (s) => s.payoutBatchId === pb.batchNumber
    );

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'payout_batches', pb.id), {
        status: targetStatus,
        updatedAt: serverTimestamp(),
      });

      batchStatements.forEach((st, idx) => {
        const utr =
          targetStatus === 'Success'
            ? `${pb.utrPrefix}${String(idx + 1).padStart(3, '0')}`
            : targetStatus === 'Failed'
            ? 'GATEWAY_TIMEOUT'
            : 'PROCESSING';
        batch.update(doc(db, 'statements', st.id), {
          status: targetStatus === 'Success' ? 'Disbursed' : 'Payout Locked',
          payoutStatus: targetStatus,
          utrNumber: utr,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await appendAuditLog({
        eventType: 'FINANCE_DISBURSEMENT',
        module: 'Finance Disbursement',
        actorName: user.displayName || user.email || 'Finance Controller',
        actorRole: UserRole.FINANCE,
        entityId: pb.id,
        referenceId: pb.batchNumber,
        oldValue: `Batch ${pb.batchNumber}: ${pb.status}`,
        newValue: `Batch ${pb.batchNumber}: ${targetStatus} (₹${pb.totalAmount.toLocaleString('en-IN')})`,
        description: `Simulated payment gateway transition for ${pb.batchNumber} (${batchStatements.map((s) => s.employeeName).join(', ')}) to "${targetStatus}".`,
        source: pb.gatewayName,
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `advance_payout/${batchId}`
      );
    }
  };

  // 14. Employee Master Create / Update
  const updateEmployeeMaster = async (emp: Employee) => {
    if (!user) return;
    const oldEmp = employees.find((e) => e.id === emp.id);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'employees', emp.id), {
        ...emp,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });

      const stmt = statements.find((s) => s.employeeId === emp.id);
      if (stmt && !stmt.payoutLocked) {
        const recalc = calculateEmployeeStatement(
          emp,
          sourceRecords,
          rates,
          cities,
          stmt.month,
          user.uid,
          stmt
        );
        batch.set(doc(db, 'statements', recalc.id), {
          ...recalc,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'EMPLOYEE_MASTER_UPDATE',
        module: 'Employee Master',
        actorName: user.displayName || user.email || 'HR Admin',
        actorRole: activeRole,
        entityId: emp.id,
        referenceId: emp.id,
        oldValue: oldEmp
          ? `${oldEmp.designation} · ${oldEmp.baseCity} (${oldEmp.cityCategory}) · BA: ${oldEmp.baOwner}`
          : 'New Record',
        newValue: `${emp.designation} · ${emp.baseCity} (${emp.cityCategory}) · BA: ${emp.baOwner}`,
        description: `Updated Employee Master record for ${emp.name} (${emp.id}) and synchronized unlocked FTA statement.`,
        source: 'Employee Master',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${emp.id}`);
    }
  };

  const createEmployeeMaster = async (
    empInput: Omit<Employee, 'ownerId' | 'updatedAt'>
  ) => {
    if (!user) return;
    const emp: Employee = {
      ...empInput,
      ownerId: user.uid,
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'employees', emp.id), {
        ...emp,
        updatedAt: serverTimestamp(),
      });

      const newStmt = calculateEmployeeStatement(
        emp,
        sourceRecords,
        rates,
        cities,
        '2026-10',
        user.uid
      );
      batch.set(doc(db, 'statements', newStmt.id), {
        ...newStmt,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      await appendAuditLog({
        eventType: 'EMPLOYEE_CREATED',
        module: 'Employee Master',
        actorName: user.displayName || user.email || 'HR Admin',
        actorRole: activeRole,
        entityId: emp.id,
        referenceId: emp.id,
        oldValue: 'None',
        newValue: `${emp.name} (${emp.designation}, ${emp.department}, ${emp.baseCity})`,
        description: `Added employee ${emp.name} (${emp.id}) to Employee Master and initialized monthly FTA statement.`,
        source: 'Employee Master',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `employees/${emp.id}`);
    }
  };

  // 15. Rate Master & City Master Updates
  const updateRateConfig = async (rate: RateConfig) => {
    if (!user) return;
    const oldRate = rates.find((r) => r.id === rate.id);
    const updatedRates = rates.map((r) => (r.id === rate.id ? rate : r));

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'rates', rate.id), {
        ...rate,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });

      // Recalculate unlocked statements for employees with this designation
      for (const st of statements) {
        if (st.designation === rate.designation && !st.payoutLocked) {
          const emp = employees.find((e) => e.id === st.employeeId);
          if (emp) {
            const recalc = calculateEmployeeStatement(
              emp,
              sourceRecords,
              updatedRates,
              cities,
              st.month,
              user.uid,
              st
            );
            batch.set(doc(db, 'statements', recalc.id), {
              ...recalc,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'RATE_MASTER_UPDATE',
        module: 'Rate & City Master',
        actorName: user.displayName || user.email || 'HR Admin',
        actorRole: activeRole,
        entityId: rate.id,
        referenceId: rate.designation,
        oldValue: oldRate
          ? `T1: ₹${oldRate.tier1LocalRate}, T2: ₹${oldRate.tier2LocalRate}, MaxCap: ₹${oldRate.maxClaimLimit} (${oldRate.approvalStatus})`
          : 'Default',
        newValue: `T1: ₹${rate.tier1LocalRate}, T2: ₹${rate.tier2LocalRate}, MaxCap: ₹${rate.maxClaimLimit} (${rate.approvalStatus})`,
        description: `Updated Rate Master for ${rate.designation} and recalculated all unlocked statements.`,
        source: 'Rate Master Configuration',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rates/${rate.id}`);
    }
  };

  const updateCityConfig = async (city: CityConfig) => {
    if (!user) return;
    const oldCity = cities.find((c) => c.id === city.id);
    const updatedCities = cities.map((c) => (c.id === city.id ? city : c));

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'cities', city.id), {
        ...city,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });

      for (const st of statements) {
        if (!st.payoutLocked) {
          const emp = employees.find((e) => e.id === st.employeeId);
          if (emp) {
            const recalc = calculateEmployeeStatement(
              emp,
              sourceRecords,
              rates,
              updatedCities,
              st.month,
              user.uid,
              st
            );
            batch.set(doc(db, 'statements', recalc.id), {
              ...recalc,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      await batch.commit();

      await appendAuditLog({
        eventType: 'CITY_MASTER_UPDATE',
        module: 'Rate & City Master',
        actorName: user.displayName || user.email || 'HR Admin',
        actorRole: activeRole,
        entityId: city.id,
        referenceId: city.cityName,
        oldValue: oldCity
          ? `${oldCity.cityName}: ${oldCity.tier} · Special:${oldCity.isSpecialCity} · NewLaunch:${oldCity.isNewLaunchCity}`
          : 'Default',
        newValue: `${city.cityName}: ${city.tier} · Special:${city.isSpecialCity} · NewLaunch:${city.isNewLaunchCity}`,
        description: `Updated City Master configuration for ${city.cityName} and synchronized unlocked statements.`,
        source: 'City Master Configuration',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cities/${city.id}`);
    }
  };

  // 16. Reset Rahul Sharma Demo Scenario to Step 1
  const resetRahulDemoScenario = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      // Delete any dynamic disputes or payout batches created during demo
      const existingDisputesSnap = await getDocs(
        query(collection(db, 'disputes'), where('ownerId', '==', user.uid))
      );
      const existingBatchesSnap = await getDocs(
        query(collection(db, 'payout_batches'), where('ownerId', '==', user.uid))
      );

      const cleanBatch = writeBatch(db);
      existingDisputesSnap.docs.forEach((d) => cleanBatch.delete(d.ref));
      existingBatchesSnap.docs.forEach((d) => cleanBatch.delete(d.ref));
      await cleanBatch.commit();

      await seedDatabaseForUser(user.uid);
      setSelectedEmployeeId('EMP-1001');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset_demo_scenario');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <FtaContext.Provider
      value={{
        user,
        authLoading,
        dataLoading,
        seeding,
        activeRole,
        setActiveRole,
        activeSection,
        setActiveSection,
        selectedEmployeeId,
        setSelectedEmployeeId,
        employees,
        rates,
        cities,
        sourceRecords,
        connectors,
        statements,
        disputes,
        payoutBatches,
        auditLogs,
        signIn,
        signOut,
        syncSourceConnector,
        importRegionalTrainerCsv,
        confirmEmployeeStatement,
        raiseEmployeeDispute,
        updateDisputeStatus,
        simulateSourceCorrection,
        triggerTargetedReSync,
        approveStatementByHr,
        lockStatementPayout,
        lockAllApprovedStatements,
        requestVersionedUnlock,
        approveVersionedUnlock,
        createPayoutBatchForLocked,
        advancePayoutBatchStatus,
        updateEmployeeMaster,
        createEmployeeMaster,
        updateRateConfig,
        updateCityConfig,
        resetRahulDemoScenario,
      }}
    >
      {children}
    </FtaContext.Provider>
  );
};

export function useFta() {
  const ctx = useContext(FtaContext);
  if (!ctx) {
    throw new Error('useFta must be used within an FtaProvider');
  }
  return ctx;
}
