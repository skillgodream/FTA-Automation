/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  { id: 1, name: 'Unauthenticated Write', collection: 'employees', docId: 'EMP-1001', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Write', collection: 'employees', docId: 'EMP-1001', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Owner Spoofing on Create', collection: 'statements', docId: 'STMT-1001', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection', collection: 'rates', docId: 'RATE-1', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'ID Poisoning Attack', collection: 'employees', docId: 'INVALID$ID!', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'String Overflow Attack', collection: 'disputes', docId: 'DSP-1001', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Forged Client Timestamp', collection: 'cities', docId: 'CITY-1', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Cross-Tenant PII Read', collection: 'employees', docId: 'EMP-1001', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Blanket List Scraping', collection: 'statements', docId: '*', operation: 'list', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'Immutable Owner Mutation', collection: 'statements', docId: 'STMT-1001', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Value Poisoning on Update', collection: 'statements', docId: 'STMT-1001', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Audit Log Tampering', collection: 'audit_logs', docId: 'LOG-1001', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
];
