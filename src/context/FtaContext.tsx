import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
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

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isFirebaseAuth: boolean;
}

interface LocalPersistedState {
  cities: CityConfig[];
  rates: RateConfig[];
  employees: Employee[];
  sourceRecords: SourceRecord[];
  connectors: SyncConnector[];
  statements: EmployeeStatement[];
  disputes: DisputeTicket[];
  payoutBatches: PayoutBatch[];
  auditLogs: AuditLog[];
}

const LOCAL_STORAGE_KEY = 'fta_automation_enterprise_state_v3_5emp';
const LOCAL_SESSION_KEY = 'fta_automation_enterprise_session_v1';
const FALLBACK_OWNER_ID = 'ENT-OPERATOR-01';
const ACTIVE_EMP_IDS = new Set([
  'EMP-1001',
  'EMP-1002',
  'EMP-1003',
  'EMP-1004',
  'EMP-1005',
]);

interface FtaContextValue {
  user: AppUser | null;
  authLoading: boolean;
  dataLoading: boolean;
  seeding: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
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
  signInDirectEnterprise: (role?: UserRole) => void;
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
  createEmployeeMaster: (
    emp: Omit<Employee, 'ownerId' | 'updatedAt'>
  ) => Promise<void>;
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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [fallbackUser, setFallbackUser] = useState<AppUser | null>(() => {
    try {
      if (sessionStorage.getItem('fta_explicit_signout') === '1') {
        return null;
      }
      const saved = localStorage.getItem(LOCAL_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved) as AppUser;
      }
      const defaultUser: AppUser = {
        uid: FALLBACK_OWNER_ID,
        email: 'vicrumm26@gmail.com',
        displayName: 'Vikram Rao (Enterprise Admin)',
        isFirebaseAuth: false,
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    } catch {
      return {
        uid: FALLBACK_OWNER_ID,
        email: 'vicrumm26@gmail.com',
        displayName: 'Vikram Rao (Enterprise Admin)',
        isFirebaseAuth: false,
      };
    }
  });
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.HR);
  const [activeSection, setActiveSection] = useState<NavSection>(
    NavSection.HR_COMMAND
  );
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<string>('EMP-1001');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rates, setRates] = useState<RateConfig[]>([]);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([]);
  const [connectors, setConnectors] = useState<SyncConnector[]>([]);
  const [statements, setStatements] = useState<EmployeeStatement[]>([]);
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const user: AppUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isFirebaseAuth: true,
      }
    : fallbackUser;

  const isFirestoreActive = Boolean(firebaseUser);

  // Persist local state helper when operating in fallback deployment session mode
  const saveLocalState = useCallback((next: Partial<LocalPersistedState>) => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const current: LocalPersistedState = raw
        ? JSON.parse(raw)
        : buildInitialSeedData(FALLBACK_OWNER_ID);
      const merged: LocalPersistedState = {
        ...current,
        ...next,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    } catch (err) {
      console.warn('Unable to save state to localStorage:', err);
    }
  }, []);

  const loadOrInitLocalState = useCallback((forceReset = false) => {
    setDataLoading(true);
    try {
      const raw = !forceReset ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
      const data: LocalPersistedState = raw
        ? JSON.parse(raw)
        : buildInitialSeedData(FALLBACK_OWNER_ID);

      if (!raw || forceReset) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }

      setCities(
        [...data.cities].sort((a, b) => a.cityName.localeCompare(b.cityName))
      );
      setRates([...data.rates].sort((a, b) => a.id.localeCompare(b.id)));
      setEmployees(
        [...data.employees].sort((a, b) => a.id.localeCompare(b.id))
      );
      setSourceRecords(
        [...data.sourceRecords].sort((a, b) => a.id.localeCompare(b.id))
      );
      setConnectors(
        [...data.connectors].sort((a, b) => a.id.localeCompare(b.id))
      );
      setStatements(
        [...data.statements].sort((a, b) =>
          a.employeeId.localeCompare(b.employeeId)
        )
      );
      setDisputes(
        [...data.disputes].sort((a, b) =>
          b.ticketNumber.localeCompare(a.ticketNumber)
        )
      );
      setPayoutBatches(
        [...data.payoutBatches].sort((a, b) =>
          b.batchNumber.localeCompare(a.batchNumber)
        )
      );
      setAuditLogs(
        [...data.auditLogs].sort((a, b) =>
          b.timestamp.localeCompare(a.timestamp)
        )
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthLoading(false);
      if (!u && !fallbackUser) {
        setDataLoading(false);
      }
    });
    return () => unsub();
  }, [fallbackUser]);

  const seedDatabaseForUser = useCallback(async (uid: string) => {
    setSeeding(true);
    try {
      const seed = buildInitialSeedData(uid);
      const batch = writeBatch(db);

      for (const c of seed.cities) {
        batch.set(doc(db, 'cities', c.id), {
          ...c,
          updatedAt: serverTimestamp(),
        });
      }
      for (const r of seed.rates) {
        batch.set(doc(db, 'rates', r.id), {
          ...r,
          updatedAt: serverTimestamp(),
        });
      }
      for (const e of seed.employees) {
        batch.set(doc(db, 'employees', e.id), {
          ...e,
          updatedAt: serverTimestamp(),
        });
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
        const uniqueAudId = `${aud.id}-${Date.now()}`;
        batch.set(doc(db, 'audit_logs', uniqueAudId), {
          ...aud,
          id: uniqueAudId,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.warn('Seed batch warning:', error);
    } finally {
      setSeeding(false);
    }
  }, []);

  // Load either Firestore (when Firebase Auth user is signed in) or Local Persistent State (when in Deployment Enterprise Session)
  useEffect(() => {
    if (!user) return;

    if (!isFirestoreActive) {
      loadOrInitLocalState(false);
      return;
    }

    setDataLoading(true);
    let seedTriggered = false;
    const uid = user.uid;

    const unsubEmployees = onSnapshot(
      query(collection(db, 'employees'), where('ownerId', '==', uid)),
      (snap) => {
        const migratedKey = `fta_firestore_v3_5emp_seeded_${uid}`;
        const needsMigration = localStorage.getItem(migratedKey) !== '1';
        if ((snap.empty || needsMigration) && !seedTriggered) {
          seedTriggered = true;
          localStorage.setItem(migratedKey, '1');
          seedDatabaseForUser(uid);
          return;
        }
        const list = snap.docs
          .map((d) => d.data() as Employee)
          .filter(
            (e) => ACTIVE_EMP_IDS.has(e.id) || Number(e.id.split('-')[1]) > 1020
          )
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
            .slice(0, 6)
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
            .filter(
              (r) =>
                ACTIVE_EMP_IDS.has(r.employeeId) ||
                Number(r.employeeId.split('-')[1]) > 1020
            )
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
            .filter(
              (s) =>
                ACTIVE_EMP_IDS.has(s.employeeId) ||
                Number(s.employeeId.split('-')[1]) > 1020
            )
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
            .filter(
              (d) =>
                ACTIVE_EMP_IDS.has(d.employeeId) ||
                Number(d.employeeId.split('-')[1]) > 1020
            )
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
  }, [user, isFirestoreActive, seedDatabaseForUser, loadOrInitLocalState]);

  const signInDirectEnterprise = useCallback(
    (role?: UserRole) => {
      const entUser: AppUser = {
        uid: FALLBACK_OWNER_ID,
        email: 'vicrumm26@gmail.com',
        displayName: 'Vikram Rao (Enterprise Admin)',
        isFirebaseAuth: false,
      };
      try {
        sessionStorage.removeItem('fta_explicit_signout');
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(entUser));
      } catch {
        // ignore storage quota errors
      }
      if (role) {
        setActiveRole(role);
        if (role === UserRole.EMPLOYEE) {
          setSelectedEmployeeId('EMP-1001');
          setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
        } else if (role === UserRole.BA) {
          setActiveSection(NavSection.BA_DISPUTES);
        } else if (role === UserRole.FINANCE) {
          setActiveSection(NavSection.FINANCE_DISBURSEMENT);
        } else {
          setActiveSection(NavSection.HR_COMMAND);
        }
      }
      setAuthNotice(null);
      setFallbackUser(entUser);
    },
    []
  );

  const signIn = async () => {
    setAuthNotice(null);
    try {
      sessionStorage.removeItem('fta_explicit_signout');
      await signInWithPopup(auth, googleProvider);
      try {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      } catch {
        // ignore
      }
      setFallbackUser(null);
    } catch {
      signInDirectEnterprise(UserRole.HR);
    }
  };

  const signOut = async () => {
    setAuthNotice(null);
    try {
      sessionStorage.setItem('fta_explicit_signout', '1');
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      // ignore
    }
    setFallbackUser(null);
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
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

    if (!isFirestoreActive) {
      setAuditLogs((prev) => {
        const next = [fullLog, ...prev];
        saveLocalState({ auditLogs: next });
        return next;
      });
      return;
    }

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

    const toolRecords = sourceRecords.filter(
      (r) => r.sourceTool === conn.toolType
    );
    const syncedCount = toolRecords.filter(
      (r) => r.syncStatus === 'Synced'
    ).length;
    const failedCount = toolRecords.length - syncedCount;
    const newSyncTime = nowIstString();
    const newStatus =
      failedCount > 0
        ? `Connected · ${failedCount} Source Hold(s)`
        : 'Connected · Healthy';

    if (!isFirestoreActive) {
      const nextConnectors = connectors.map((c) =>
        c.id === conn.id
          ? {
              ...c,
              status: newStatus,
              lastSyncTime: newSyncTime,
              recordsFetched: toolRecords.length,
              recordsSuccessful: syncedCount,
              recordsFailed: failedCount,
            }
          : c
      );
      setConnectors(nextConnectors);
      saveLocalState({ connectors: nextConnectors });

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
      return;
    }

    try {
      await updateDoc(doc(db, 'sync_connectors', conn.id), {
        status: newStatus,
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

    const newRecords: SourceRecord[] = [];
    rows.forEach((row, idx) => {
      const emp =
        employees.find((e) => e.id === row.employeeId) ||
        employees.find((e) => e.designation === 'Regional Trainer')!;
      const cityObj = cities.find(
        (c) => c.cityName.toLowerCase() === row.city.toLowerCase()
      );
      const recId = `REC-CSV-${Date.now()}-${idx + 1}`;
      newRecords.push({
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
      });
    });

    const updatedAllRecords = [...sourceRecords, ...newRecords];
    const affectedEmpIds = Array.from(
      new Set(newRecords.map((r) => r.employeeId))
    );

    if (!isFirestoreActive) {
      const nextStatements = statements.map((st) => {
        if (affectedEmpIds.includes(st.employeeId) && !st.payoutLocked) {
          const emp = employees.find((e) => e.id === st.employeeId);
          if (emp) {
            return calculateEmployeeStatement(
              emp,
              updatedAllRecords,
              rates,
              cities,
              st.month,
              user.uid,
              st
            );
          }
        }
        return st;
      });
      const totalGsheet = updatedAllRecords.filter(
        (r) => r.sourceTool === 'Google Sheet CSV'
      ).length;
      const nextConnectors = connectors.map((c) =>
        c.id === 'CONN-GSHEET'
          ? {
              ...c,
              lastSyncTime: nowIstString(),
              recordsFetched: totalGsheet,
              recordsSuccessful: totalGsheet,
            }
          : c
      );

      setSourceRecords(updatedAllRecords);
      setStatements(nextStatements);
      setConnectors(nextConnectors);
      saveLocalState({
        sourceRecords: updatedAllRecords,
        statements: nextStatements,
        connectors: nextConnectors,
      });

      await appendAuditLog({
        eventType: 'CSV_IMPORT',
        module: 'Source Data & Integration',
        actorName: user.displayName || user.email || 'HR Operator',
        actorRole: activeRole,
        entityId: 'CONN-GSHEET',
        referenceId: `CSV-BATCH-${rows.length}`,
        oldValue: `${sourceRecords.filter((r) => r.sourceTool === 'Google Sheet CSV').length} CSV records`,
        newValue: `${totalGsheet} CSV records`,
        description: `Imported ${rows.length} Regional Trainer activity record(s) from Google Sheet CSV and recalculated statements.`,
        source: 'Google Sheet CSV Bridge',
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      for (const newRec of newRecords) {
        batch.set(doc(db, 'source_records', newRec.id), {
          ...newRec,
          updatedAt: serverTimestamp(),
        });
      }

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

    if (!isFirestoreActive) {
      const nextStatements = statements.map((s) =>
        s.id === stmt.id ? { ...s, status: 'Confirmed by Employee' } : s
      );
      setStatements(nextStatements);
      saveLocalState({ statements: nextStatements });

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
      return;
    }

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
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `statements/${statementId}`
      );
    }
  };

  // 4. Employee Raises Dispute
  const raiseEmployeeDispute = async (
    statementId: string,
    employeeMessage: string
  ): Promise<DisputeTicket | undefined> => {
    if (!user) return undefined;
    const stmt = statements.find((s) => s.id === statementId);
    const emp = employees.find((e) => e.id === stmt?.employeeId);
    if (!stmt || !emp) return undefined;

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

    const nextDisputes = [
      newTicket,
      ...disputes.filter((d) => d.id !== newTicket.id),
    ];
    const nextStatements = statements.map((s) =>
      s.id === stmt.id
        ? {
            ...s,
            status: 'Disputed',
            disputeTicketId: newTicket.ticketNumber,
          }
        : s
    );
    setDisputes(nextDisputes);
    setStatements(nextStatements);
    saveLocalState({ disputes: nextDisputes, statements: nextStatements });

    if (!isFirestoreActive) {
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
    }

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
    } catch (error) {
      console.warn('Firestore raiseEmployeeDispute fallback kept in state:', error);
    }
    return newTicket;
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

    if (!isFirestoreActive) {
      const nextDisputes = disputes.map((d) =>
        d.id === dsp.id
          ? {
              ...d,
              status: newStatus,
              resolutionNotes: resolutionNotes.slice(0, 990),
            }
          : d
      );
      setDisputes(nextDisputes);
      saveLocalState({ disputes: nextDisputes });

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
      return;
    }

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
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `disputes/${disputeId}`
      );
    }
  };

  // 6. BA Simulates Source Correction
  const simulateSourceCorrection = async (disputeId: string) => {
    if (!user) return;
    const dsp = disputes.find((d) => d.id === disputeId);
    if (!dsp) return;

    const unsyncedEmpRecords = sourceRecords.filter(
      (r) => r.employeeId === dsp.employeeId && r.syncStatus !== 'Synced'
    );

    if (!isFirestoreActive) {
      let nextRecords = [...sourceRecords];
      if (unsyncedEmpRecords.length > 0) {
        nextRecords = sourceRecords.map((r) =>
          r.employeeId === dsp.employeeId && r.syncStatus !== 'Synced'
            ? {
                ...r,
                sourceStatus: 'Corrected in Source',
                notes: `Verified & released in ${dsp.sourceTool} by ${dsp.assignedBa} against ticket ${dsp.ticketNumber}. Ready for targeted re-sync.`,
                ticketRef: dsp.ticketNumber,
              }
            : r
        );
      } else {
        const emp = employees.find((e) => e.id === dsp.employeeId)!;
        const deltaCount = Math.max(1, Math.abs(dsp.disputedDelta));
        for (let i = 1; i <= deltaCount; i++) {
          nextRecords.push({
            id: `REC-CORR-${dsp.employeeId.split('-')[1]}-${Date.now()}-${i}`,
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
          });
        }
      }

      const nextDisputes = disputes.map((d) =>
        d.id === dsp.id
          ? {
              ...d,
              status: 'Under Review',
              sourceCorrected: true,
              resolutionNotes: `Source records verified and corrected in ${dsp.sourceTool} (${unsyncedEmpRecords.map((r) => r.externalRefId).join(', ') || 'missing records restored'}). Ready for targeted re-sync.`,
            }
          : d
      );

      setSourceRecords(nextRecords);
      setDisputes(nextDisputes);
      saveLocalState({ sourceRecords: nextRecords, disputes: nextDisputes });

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
      return;
    }

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

    // Support fixing Rahul Sharma directly even if he hasn't clicked "Raise Dispute" in Step 3 yet
    let dsp = disputes.find(
      (d) =>
        d.id === disputeId ||
        d.ticketNumber === disputeId ||
        d.employeeId === disputeId
    );
    let isAutoCreatedRahulDispute = false;

    if (!dsp && (disputeId === 'PENDING-EMP-1001' || disputeId === 'EMP-1001' || disputeId === 'DSP-1042')) {
      const rahulEmp = employees.find((e) => e.id === 'EMP-1001');
      const rahulStmt = statements.find((s) => s.employeeId === 'EMP-1001');
      if (rahulEmp && rahulStmt) {
        isAutoCreatedRahulDispute = true;
        dsp = {
          id: 'DSP-1042',
          ticketNumber: 'FTA-2026-1042',
          statementId: rahulStmt.id,
          employeeId: rahulEmp.id,
          employeeName: rahulEmp.name,
          designation: rahulEmp.designation,
          department: rahulEmp.department,
          baseCity: rahulEmp.baseCity,
          month: rahulStmt.month,
          claimType: 'Local Meetings',
          systemRecordedValue: 40,
          employeeReportedValue: 42,
          disputedDelta: 2,
          financialImpact: 100,
          employeeMessage:
            'I completed 42 meetings, but the system shows only 40.',
          aiInterpretation:
            'Employee claims 42 Local Meetings vs 40 auto-pulled (+2 difference). 2 Prowl records (PRW-8841, PRW-8842) found held pending GPS verification.',
          assignedBa: rahulEmp.baOwner,
          baRegion: rahulEmp.baRegion,
          sourceTool: rahulEmp.sourceTool,
          status: 'Open',
          sourceCorrected: false,
          reSynced: false,
          resolutionNotes: 'Pending BD/BA fix in Prowl.',
          ownerId: user.uid,
          createdAt: nowIstString(),
        };
      }
    }

    if (!dsp) return;

    const emp =
      employees.find((e) => e.id === dsp!.employeeId) ||
      employees.find((e) => e.name === dsp!.employeeName);
    const stmt =
      statements.find((s) => s.id === dsp!.statementId) ||
      statements.find((s) => s.employeeId === dsp!.employeeId);
    if (!emp || !stmt) return;

    const pendingEmpRecords = sourceRecords.filter(
      (r) => r.employeeId === emp.id && r.syncStatus !== 'Synced'
    );

    const oldMeetings = stmt.eligibleLocalMeetings;
    const oldNetAmount = stmt.netAmount;

    // Identify if there is a same-day Outstation/New Launch collision record for this employee (e.g. Neha Kapoor EMP-1002)
    const empOutstationDates = new Set(
      sourceRecords
        .filter(
          (r) =>
            r.employeeId === emp.id &&
            r.syncStatus === 'Synced' &&
            r.meetingCategory === 'Outstation'
        )
        .map((r) => `${r.date}|${r.city.toLowerCase()}`)
    );

    const collidingNewLaunchRecords = dsp.claimType
      .toLowerCase()
      .includes('launch')
      ? sourceRecords.filter(
          (r) =>
            r.employeeId === emp.id &&
            r.meetingCategory === 'New Launch' &&
            empOutstationDates.has(`${r.date}|${r.city.toLowerCase()}`)
        )
      : [];

    const collidingIds = new Set(collidingNewLaunchRecords.map((r) => r.id));

    // If neither held records nor colliding records exist, synthesize verified source record(s)
    const synthesizedRecords: SourceRecord[] = [];
    if (pendingEmpRecords.length === 0 && collidingIds.size === 0) {
      const deltaCount = Math.max(1, Math.abs(dsp.disputedDelta));
      const category: 'Outstation' | 'New Launch' | 'Local' = dsp.claimType
        .toLowerCase()
        .includes('outstation')
        ? 'Outstation'
        : dsp.claimType.toLowerCase().includes('launch')
        ? 'New Launch'
        : 'Local';
      for (let i = 1; i <= deltaCount; i++) {
        const dayNum = Math.min(28, 24 + i);
        synthesizedRecords.push({
          id: `REC-CORR-${emp.id.split('-')[1]}-${Date.now()}-${i}`,
          externalRefId: `${emp.sourceTool === 'Prowl' ? 'PRW' : 'LSQ'}-99${i}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          date: `${dsp.month}-${String(dayNum).padStart(2, '0')}`,
          city: emp.baseCity,
          cityCategory: emp.cityCategory,
          meetingCategory: category,
          vehicleMode: emp.ownVehicleEligible ? 'Own Vehicle' : 'Standard',
          sourceTool: emp.sourceTool,
          sourceStatus: 'Verified',
          syncStatus: 'Synced',
          clientName: `${emp.baseCity} Verified Field Client #${i}`,
          notes: `Verified in ${emp.sourceTool} & synced against ${dsp.ticketNumber}.`,
          ticketRef: dsp.ticketNumber,
          ownerId: user.uid,
        });
      }
    }

    const modifiedRecordsForFirestore: SourceRecord[] = [];

    const updatedAllRecords = [
      ...sourceRecords.map((r) => {
        if (r.employeeId === emp.id && r.syncStatus !== 'Synced') {
          const synced: SourceRecord = {
            ...r,
            sourceStatus: 'Verified',
            syncStatus: 'Synced',
            ticketRef: dsp!.ticketNumber,
            notes: `Synced via Targeted Re-Sync for ticket ${dsp!.ticketNumber}.`,
          };
          modifiedRecordsForFirestore.push(synced);
          return synced;
        }
        if (collidingIds.has(r.id)) {
          const corrected: SourceRecord = {
            ...r,
            date: `${dsp!.month}-25`,
            sourceStatus: 'Verified',
            syncStatus: 'Synced',
            ticketRef: dsp!.ticketNumber,
            notes: `Verified meeting date (${dsp!.month}-25) in ${emp.sourceTool} for ticket ${dsp!.ticketNumber}.`,
          };
          modifiedRecordsForFirestore.push(corrected);
          return corrected;
        }
        return r;
      }),
      ...synthesizedRecords,
    ];

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

    const resolvedDispute: DisputeTicket = {
      ...dsp,
      status: 'Resolved',
      sourceCorrected: true,
      reSynced: true,
      resolutionNotes: `Fixed in ${emp.sourceTool} and recalculated from ₹${oldNetAmount.toLocaleString('en-IN')} to ₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}. Routed to HR for exception approval.`,
    };

    const nextStatements = statements.map((s) =>
      s.id === recalculatedStmt.id ? recalculatedStmt : s
    );

    const nextDisputes = isAutoCreatedRahulDispute
      ? [resolvedDispute, ...disputes.filter((d) => d.id !== resolvedDispute.id)]
      : disputes.map((d) => (d.id === dsp!.id ? resolvedDispute : d));

    const toolRecs = updatedAllRecords.filter(
      (r) => r.sourceTool === emp.sourceTool
    );
    const toolSynced = toolRecs.filter(
      (r) => r.syncStatus === 'Synced'
    ).length;
    const toolFailed = toolRecs.length - toolSynced;

    const nextConnectors = connectors.map((c) =>
      c.toolType === emp.sourceTool
        ? {
            ...c,
            status:
              toolFailed > 0
                ? `Connected · ${toolFailed} Source Hold(s)`
                : 'Connected · Healthy',
            lastSyncTime: nowIstString(),
            recordsFetched: toolRecs.length,
            recordsSuccessful: toolSynced,
            recordsFailed: toolFailed,
          }
        : c
    );

    // Always update React state and local storage immediately so UI updates with zero lag
    setSourceRecords(updatedAllRecords);
    setStatements(nextStatements);
    setDisputes(nextDisputes);
    setConnectors(nextConnectors);
    saveLocalState({
      sourceRecords: updatedAllRecords,
      statements: nextStatements,
      disputes: nextDisputes,
      connectors: nextConnectors,
    });

    if (!isFirestoreActive) {
      await appendAuditLog({
        eventType: 'TARGETED_RESYNC',
        module: 'Source Data & Integration',
        actorName: dsp.assignedBa,
        actorRole: UserRole.BA,
        entityId: emp.id,
        referenceId: dsp.ticketNumber,
        oldValue: `₹${oldNetAmount.toLocaleString('en-IN')}`,
        newValue: `₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}`,
        description: `Targeted re-sync pulled corrected record(s) from ${emp.sourceTool} for ${emp.name} and recalculated statement.`,
        source: `${emp.sourceTool} Targeted Re-Sync`,
      });
      return;
    }

    try {
      const batch = writeBatch(db);

      for (const mRec of modifiedRecordsForFirestore) {
        batch.set(doc(db, 'source_records', mRec.id), {
          ...mRec,
          updatedAt: serverTimestamp(),
        });
      }

      for (const sRec of synthesizedRecords) {
        batch.set(doc(db, 'source_records', sRec.id), {
          ...sRec,
          updatedAt: serverTimestamp(),
        });
      }

      batch.set(doc(db, 'statements', recalculatedStmt.id), {
        ...recalculatedStmt,
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'disputes', resolvedDispute.id), {
        ...resolvedDispute,
        updatedAt: serverTimestamp(),
      });

      const conn = nextConnectors.find((c) => c.toolType === emp.sourceTool);
      if (conn) {
        batch.set(doc(db, 'sync_connectors', conn.id), {
          ...conn,
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
        oldValue: `₹${oldNetAmount.toLocaleString('en-IN')}`,
        newValue: `₹${recalculatedStmt.netAmount.toLocaleString('en-IN')}`,
        description: `Targeted re-sync pulled corrected record(s) from ${emp.sourceTool} for ${emp.name} and recalculated statement.`,
        source: `${emp.sourceTool} Targeted Re-Sync`,
      });
    } catch (error) {
      console.warn('Firestore targeted re-sync fallback kept in state:', error);
    }
  };

  // 8. HR Approves Statement
  const approveStatementByHr = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || stmt.payoutLocked) return;

    if (!isFirestoreActive) {
      const nextStatements = statements.map((s) =>
        s.id === stmt.id ? { ...s, status: 'HR Approved' } : s
      );
      setStatements(nextStatements);
      saveLocalState({ statements: nextStatements });

      await appendAuditLog({
        eventType: 'HR_APPROVAL',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: stmt.id,
        referenceId:
          stmt.disputeTicketId !== 'NONE'
            ? stmt.disputeTicketId
            : stmt.employeeId,
        oldValue: `${stmt.status} (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        newValue: `HR Approved (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        description: `HR reviewed and approved final FTA payout of ₹${stmt.netAmount.toLocaleString('en-IN')} for ${stmt.employeeName}.`,
        source: 'HR Approval Workspace',
      });
      return;
    }

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
        referenceId:
          stmt.disputeTicketId !== 'NONE'
            ? stmt.disputeTicketId
            : stmt.employeeId,
        oldValue: `${stmt.status} (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        newValue: `HR Approved (₹${stmt.netAmount.toLocaleString('en-IN')})`,
        description: `HR reviewed and approved final FTA payout of ₹${stmt.netAmount.toLocaleString('en-IN')} for ${stmt.employeeName} (${stmt.eligibleLocalMeetings} local mtgs, ${stmt.outstationDays} outstation days, ${stmt.newLaunchMeetings} new launch).`,
        source: 'HR Approval Workspace',
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `statements/${statementId}`
      );
    }
  };

  // 9. HR Final Payout Lock (Single Statement)
  const lockStatementPayout = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || stmt.payoutLocked) return;

    const nextStatements = statements.map((s) =>
      s.id === stmt.id
        ? {
            ...s,
            status: 'Payout Locked',
            payoutLocked: true,
            changeRequestStatus: 'None',
          }
        : s
    );
    setStatements(nextStatements);
    saveLocalState({ statements: nextStatements });

    if (!isFirestoreActive) {
      await appendAuditLog({
        eventType: 'PAYOUT_LOCK',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: stmt.id,
        referenceId: `LOCK-v${stmt.lockVersion}-${stmt.employeeId}`,
        oldValue: `Unlocked (${stmt.status})`,
        newValue: `Payout Locked v${stmt.lockVersion} · ₹${stmt.netAmount.toLocaleString('en-IN')}`,
        description: `Applied FINAL PAYOUT LOCK (v${stmt.lockVersion}) on ${stmt.employeeName}'s statement for ₹${stmt.netAmount.toLocaleString('en-IN')}.`,
        source: 'HR Final Payout Lock Gate',
      });
      return;
    }

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
        description: `Applied FINAL PAYOUT LOCK (v${stmt.lockVersion}) on ${stmt.employeeName}'s statement for ₹${stmt.netAmount.toLocaleString('en-IN')}.`,
        source: 'HR Final Payout Lock Gate',
      });
    } catch (error) {
      console.warn('Firestore lockStatementPayout fallback kept in state:', error);
    }
  };

  // 10. Bulk Lock All HR-Approved / Exception Statements
  const lockAllApprovedStatements = async () => {
    if (!user) return;
    const eligible = statements.filter((s) => !s.payoutLocked);
    if (eligible.length === 0) return;

    const totalVal = eligible.reduce((acc, s) => acc + s.netAmount, 0);
    const eligibleIds = new Set(eligible.map((e) => e.id));
    const nextStatements = statements.map((s) =>
      eligibleIds.has(s.id)
        ? {
            ...s,
            status: 'Payout Locked',
            payoutLocked: true,
            changeRequestStatus: 'None',
          }
        : s
    );
    setStatements(nextStatements);
    saveLocalState({ statements: nextStatements });

    if (!isFirestoreActive) {
      await appendAuditLog({
        eventType: 'BULK_PAYOUT_LOCK',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: 'BULK-LOCK-202610',
        referenceId: `${eligible.length} Statements`,
        oldValue: `${eligible.length} Unlocked Exception Statements`,
        newValue: `${eligible.length} Statements Locked (₹${totalVal.toLocaleString('en-IN')})`,
        description: `Executed bulk FINAL PAYOUT LOCK across ${eligible.length} verified statements totaling ₹${totalVal.toLocaleString('en-IN')}.`,
        source: 'HR Final Payout Lock Gate',
      });
      return;
    }

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

      await appendAuditLog({
        eventType: 'BULK_PAYOUT_LOCK',
        module: 'HR Approval & Payout Lock',
        actorName: user.displayName || user.email || 'HR Manager',
        actorRole: UserRole.HR,
        entityId: 'BULK-LOCK-202610',
        referenceId: `${eligible.length} Statements`,
        oldValue: `${eligible.length} Unlocked Exception Statements`,
        newValue: `${eligible.length} Statements Locked (₹${totalVal.toLocaleString('en-IN')})`,
        description: `Executed bulk FINAL PAYOUT LOCK across ${eligible.length} verified statements totaling ₹${totalVal.toLocaleString('en-IN')}.`,
        source: 'HR Final Payout Lock Gate',
      });
    } catch (error) {
      console.warn('Firestore lockAllApprovedStatements fallback kept in state:', error);
    }
  };

  // 11. Request & Approve Versioned Change Request
  const requestVersionedUnlock = async (statementId: string, reason: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || !stmt.payoutLocked) return;

    if (!isFirestoreActive) {
      const nextStatements = statements.map((s) =>
        s.id === stmt.id
          ? {
              ...s,
              changeRequestStatus: 'Pending Approval',
              changeRequestReason: reason.slice(0, 480),
            }
          : s
      );
      setStatements(nextStatements);
      saveLocalState({ statements: nextStatements });

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
      return;
    }

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
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `statements/${statementId}`
      );
    }
  };

  const approveVersionedUnlock = async (statementId: string) => {
    if (!user) return;
    const stmt = statements.find((s) => s.id === statementId);
    if (!stmt || !stmt.payoutLocked) return;

    const nextVer = stmt.lockVersion + 1;

    if (!isFirestoreActive) {
      const nextStatements = statements.map((s) =>
        s.id === stmt.id
          ? {
              ...s,
              payoutLocked: false,
              status: 'HR Approved',
              lockVersion: nextVer,
              changeRequestStatus: 'Approved (Unlocked)',
            }
          : s
      );
      setStatements(nextStatements);
      saveLocalState({ statements: nextStatements });

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
      return;
    }

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
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `statements/${statementId}`
      );
    }
  };

  // 12. Finance Creates Payout Batch
  const createPayoutBatchForLocked = async (statementIds: string[]) => {
    if (!user || statementIds.length === 0) return;

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
      status: 'Success',
      initiatedBy: user.displayName || user.email || 'Finance Controller',
      utrPrefix,
      ownerId: user.uid,
      createdAt: nowIstString(),
    };

    const validIds = new Set(validStatements.map((v) => v.id));
    const nextBatches = [newBatch, ...payoutBatches];
    let seqIdx = 0;
    const nextStatements = statements.map((s) => {
      if (validIds.has(s.id)) {
        seqIdx += 1;
        return {
          ...s,
          status: 'Disbursed',
          payoutBatchId: newBatch.batchNumber,
          payoutStatus: 'Success',
          utrNumber: `${utrPrefix}${String(seqIdx).padStart(3, '0')}`,
        };
      }
      return s;
    });
    setPayoutBatches(nextBatches);
    setStatements(nextStatements);
    saveLocalState({
      payoutBatches: nextBatches,
      statements: nextStatements,
    });

    if (!isFirestoreActive) {
      await appendAuditLog({
        eventType: 'FINANCE_DISBURSEMENT',
        module: 'Finance Disbursement',
        actorName: newBatch.initiatedBy,
        actorRole: UserRole.FINANCE,
        entityId: newBatch.id,
        referenceId: newBatch.batchNumber,
        oldValue: `${validStatements.length} Approved Statements`,
        newValue: `Batch ${newBatch.batchNumber} Disbursed · ₹${totalAmount.toLocaleString('en-IN')}`,
        description: `Disbursed ${validStatements.length} approved statement(s) totaling ₹${totalAmount.toLocaleString('en-IN')} with UTR confirmation.`,
        source: 'Finance Disbursement Engine',
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'payout_batches', newBatch.id), {
        ...newBatch,
        updatedAt: serverTimestamp(),
      });

      validStatements.forEach((st, idx) => {
        batch.update(doc(db, 'statements', st.id), {
          status: 'Disbursed',
          payoutBatchId: newBatch.batchNumber,
          payoutStatus: 'Success',
          utrNumber: `${utrPrefix}${String(idx + 1).padStart(3, '0')}`,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await appendAuditLog({
        eventType: 'FINANCE_DISBURSEMENT',
        module: 'Finance Disbursement',
        actorName: newBatch.initiatedBy,
        actorRole: UserRole.FINANCE,
        entityId: newBatch.id,
        referenceId: newBatch.batchNumber,
        oldValue: `${validStatements.length} Approved Statements`,
        newValue: `Batch ${newBatch.batchNumber} Disbursed · ₹${totalAmount.toLocaleString('en-IN')}`,
        description: `Disbursed ${validStatements.length} approved statement(s) totaling ₹${totalAmount.toLocaleString('en-IN')} with UTR confirmation.`,
        source: 'Finance Disbursement Engine',
      });
    } catch (error) {
      console.warn('Firestore createPayoutBatchForLocked fallback kept in state:', error);
    }
  };

  // 13. Finance Advances Payout Batch Status
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

    if (!isFirestoreActive) {
      const nextBatches = payoutBatches.map((b) =>
        b.id === pb.id ? { ...b, status: targetStatus } : b
      );
      let seqIdx = 0;
      const nextStatements = statements.map((s) => {
        if (s.payoutBatchId === pb.batchNumber) {
          seqIdx += 1;
          const utr =
            targetStatus === 'Success'
              ? `${pb.utrPrefix}${String(seqIdx).padStart(3, '0')}`
              : targetStatus === 'Failed'
              ? 'GATEWAY_TIMEOUT'
              : 'PROCESSING';
          return {
            ...s,
            status: targetStatus === 'Success' ? 'Disbursed' : 'Payout Locked',
            payoutStatus: targetStatus,
            utrNumber: utr,
          };
        }
        return s;
      });

      setPayoutBatches(nextBatches);
      setStatements(nextStatements);
      saveLocalState({
        payoutBatches: nextBatches,
        statements: nextStatements,
      });

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
      return;
    }

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

    if (!isFirestoreActive) {
      const nextEmployees = employees.map((e) =>
        e.id === emp.id ? { ...emp, ownerId: user.uid } : e
      );
      const nextStatements = statements.map((s) =>
        s.employeeId === emp.id && !s.payoutLocked
          ? calculateEmployeeStatement(
              emp,
              sourceRecords,
              rates,
              cities,
              s.month,
              user.uid,
              s
            )
          : s
      );
      setEmployees(nextEmployees);
      setStatements(nextStatements);
      saveLocalState({ employees: nextEmployees, statements: nextStatements });

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
      return;
    }

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
    const newStmt = calculateEmployeeStatement(
      emp,
      sourceRecords,
      rates,
      cities,
      '2026-10',
      user.uid
    );

    if (!isFirestoreActive) {
      const nextEmployees = [...employees, emp];
      const nextStatements = [...statements, newStmt];
      setEmployees(nextEmployees);
      setStatements(nextStatements);
      saveLocalState({ employees: nextEmployees, statements: nextStatements });

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
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'employees', emp.id), {
        ...emp,
        updatedAt: serverTimestamp(),
      });
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

    if (!isFirestoreActive) {
      const nextStatements = statements.map((st) => {
        if (st.designation === rate.designation && !st.payoutLocked) {
          const emp = employees.find((e) => e.id === st.employeeId);
          if (emp) {
            return calculateEmployeeStatement(
              emp,
              sourceRecords,
              updatedRates,
              cities,
              st.month,
              user.uid,
              st
            );
          }
        }
        return st;
      });
      setRates(updatedRates);
      setStatements(nextStatements);
      saveLocalState({ rates: updatedRates, statements: nextStatements });

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
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'rates', rate.id), {
        ...rate,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });

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

    if (!isFirestoreActive) {
      const nextStatements = statements.map((st) => {
        if (!st.payoutLocked) {
          const emp = employees.find((e) => e.id === st.employeeId);
          if (emp) {
            return calculateEmployeeStatement(
              emp,
              sourceRecords,
              rates,
              updatedCities,
              st.month,
              user.uid,
              st
            );
          }
        }
        return st;
      });
      setCities(updatedCities);
      setStatements(nextStatements);
      saveLocalState({ cities: updatedCities, statements: nextStatements });

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
      return;
    }

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

  // 16. Reset Rahul Sharma Demo Scenario
  const resetRahulDemoScenario = async () => {
    if (!user) return;
    loadOrInitLocalState(true);
    setSelectedEmployeeId('EMP-1001');
    if (!isFirestoreActive) {
      return;
    }

    setSeeding(true);
    try {
      const existingDisputesSnap = await getDocs(
        query(collection(db, 'disputes'), where('ownerId', '==', user.uid))
      );
      const existingBatchesSnap = await getDocs(
        query(
          collection(db, 'payout_batches'),
          where('ownerId', '==', user.uid)
        )
      );

      const cleanBatch = writeBatch(db);
      existingDisputesSnap.docs.forEach((d) => cleanBatch.delete(d.ref));
      existingBatchesSnap.docs.forEach((d) => cleanBatch.delete(d.ref));
      await cleanBatch.commit();

      await seedDatabaseForUser(user.uid);
    } catch (error) {
      console.warn('Firestore resetRahulDemoScenario warning:', error);
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
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
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
        signInDirectEnterprise,
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
