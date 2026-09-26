// ─────────────────────────────────────────────────────────────────────────────
// Team, permissions, branches & audit — GraphQL documents + types.
// The role catalogue and effective permission matrices come from the backend
// (apps/accounts/rbac.py) so the UI shows exactly what the API enforces.
// ─────────────────────────────────────────────────────────────────────────────

export type Action = 'view' | 'create' | 'edit' | 'delete';
export type PermMatrix = Record<string, Action[]>;

export interface RoleDef { id: string; label: string; description: string; defaultPermissions: PermMatrix }
export interface ModuleDef { id: string; label: string; group: string }
export interface RoleCatalogue { orgType: string; roles: RoleDef[]; modules: ModuleDef[]; actions: Action[]; branchKinds: [string, string][] }
export interface Branch { id: string; name: string; code: string; kind: string; kindDisplay: string; province: string; district: string; address: string; phone: string; isHeadquarters: boolean; isActive: boolean; memberCount: number }
export interface TeamMember { id: string; email: string; fullName: string; role: string; roleLabel: string; phone: string; isActive: boolean; isOrgAdmin: boolean; permissions: PermMatrix; hasOverride: boolean; branch: { id: string; name: string } | null; createdAt: string; lastLogin: string | null }
export interface AuditEntry { id: string; action: string; detail: any; createdAt: string; actorName: string; targetName: string | null }

export function parseJson<T>(raw: any, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') { try { return JSON.parse(raw) as T; } catch { return fallback; } }
  return raw as T;
}

const BRANCH = `id name code kind kindDisplay province district address phone isHeadquarters isActive memberCount`;
const MEMBER = `id email fullName role roleLabel phone isActive isOrgAdmin permissions hasOverride branch { id name } createdAt lastLogin`;

export const TEAM_HOME_QUERY = `query TeamHome($inactive: Boolean) {
  roleCatalogue { orgType roles { id label description defaultPermissions } modules { id label group } actions branchKinds }
  teamMembers(includeInactive: $inactive) { ${MEMBER} }
  branches(includeInactive: true) { ${BRANCH} }
}`;
export const AUDIT_QUERY = `query Audit { accessAuditLog(limit: 200) { id action detail createdAt actorName targetName } }`;

export const INVITE_MUTATION = `mutation($i: InviteUserInput!) { inviteUser(input: $i) { profile { id } tempPassword } }`;
export const UPDATE_ROLE_MUTATION = `mutation($id: ID!, $role: String!) { updateMemberRole(userId: $id, role: $role) { profile { id } } }`;
export const SET_PERMISSIONS_MUTATION = `mutation($id: ID!, $p: JSONString!) { setMemberPermissions(userId: $id, permissions: $p) { profile { id } } }`;
export const RESET_PERMISSIONS_MUTATION = `mutation($id: ID!) { resetMemberPermissions(userId: $id) { member { id } } }`;
export const SET_ADMIN_MUTATION = `mutation($id: ID!, $a: Boolean!) { setOrgAdmin(userId: $id, isAdmin: $a) { member { id } } }`;
export const SET_BRANCH_MUTATION = `mutation($id: ID!, $b: UUID) { setMemberBranch(userId: $id, branchId: $b) { member { id } } }`;
export const ACTIVATE_MUTATION = `mutation($id: ID!) { activateUser(userId: $id) { success } }`;
export const DEACTIVATE_MUTATION = `mutation($id: ID!) { deactivateUser(userId: $id) { success } }`;
export const CREATE_BRANCH_MUTATION = `mutation($i: BranchInput!) { createBranch(input: $i) { branch { id } } }`;
export const UPDATE_BRANCH_MUTATION = `mutation($id: UUID!, $i: BranchInput!) { updateBranch(id: $id, input: $i) { branch { id } } }`;
export const DELETE_BRANCH_MUTATION = `mutation($id: UUID!) { deleteBranch(id: $id) { ok } }`;
