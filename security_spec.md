# Security Specification — FTA Automation Platform

## 1. Data Invariants
1. **Tenant & Owner Isolation**: Every document across `/employees`, `/rates`, `/cities`, `/source_records`, `/sync_connectors`, `/statements`, `/disputes`, `/payout_batches`, and `/audit_logs` MUST carry an `ownerId` strictly matching `request.auth.uid` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
2. **Verified Identity**: All write operations (`create`, `update`, `delete`) require `request.auth != null && request.auth.token.email_verified == true`.
3. **Strict Schema & Key Allowlisting**: Every `create` and `update` must pass `isValid[Entity](incoming())` enforcing `hasAll` and `hasOnly` key sets, string `.size()` bounds, regex pattern checks, and number type validations.
4. **Temporal Integrity**: Every document write must set `updatedAt == request.time` using server timestamps (`serverTimestamp()`).
5. **Immutable Audit Trail**: Documents in `/audit_logs/{logId}` are append-only (`allow update, delete: if false`).
6. **PII & Query Enforcer**: No blanket `isSignedIn()` reads. Both `get` and `list` verify `resource.data.ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/employees/EMP-1001` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth = { uid: 'u1', token: { email_verified: false } }`, creating `/employees/EMP-1001` -> `PERMISSION_DENIED`.
3. **Owner Spoofing on Create**: `auth.uid = 'u1'`, payload `ownerId: 'u2'` on `/statements/STMT-1` -> `PERMISSION_DENIED`.
4. **Shadow / Ghost Field Injection**: Adding `isAdminOverride: true` to `/rates/RATE-1` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Document ID with 200 characters or invalid characters (`EMP/../../admin`) -> `PERMISSION_DENIED`.
6. **String Overflow (Denial of Wallet)**: `employeeMessage` of 5,000 chars on `/disputes/DSP-1` (limit 1000) -> `PERMISSION_DENIED`.
7. **Forged Client Timestamp**: `updatedAt` set to past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **Cross-Tenant PII Read**: `auth.uid = 'attacker'` reading `/employees/EMP-1001` owned by `'victim'` -> `PERMISSION_DENIED`.
9. **Blanket List Scraping**: `auth.uid = 'attacker'` listing `/statements` without `where('ownerId', '==', 'attacker')` -> `PERMISSION_DENIED`.
10. **Immutable Owner Mutation on Update**: Changing `ownerId` or `id` during update on `/statements/STMT-1` -> `PERMISSION_DENIED`.
11. **Value Poisoning on Update**: Updating `netAmount` on `/statements/STMT-1` with a string `"999999"` instead of a number -> `PERMISSION_DENIED`.
12. **Audit Log Tampering**: Attempting `update` or `delete` on `/audit_logs/LOG-1` -> `PERMISSION_DENIED`.
