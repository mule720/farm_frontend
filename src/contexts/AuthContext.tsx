import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { gqlRequest, getToken, setToken, clearToken } from '@/lib/api';
import { resolveMatrix, can, resolvePermissions, type Action } from '@/lib/permissions';

export type UserRole =
  | 'director'
  | 'production_manager'
  | 'finance_manager'
  | 'sales_manager'
  | 'supervisor'
  | 'farmhand'
  | 'vet_officer'
  | 'driver'
  | 'saas_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization: string;
  phone?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, organization: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  /** Can the user see the module at all? (view action) */
  hasPermission: (moduleId: string) => boolean;
  /** Can the user create new records in this module? */
  canCreate: (moduleId: string) => boolean;
  /** Can the user edit existing records in this module? */
  canEdit: (moduleId: string) => boolean;
  /** Can the user delete records in this module? */
  canDelete: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── GraphQL documents ────────────────────────────────────────────────────────

const USER_FIELDS = `id email fullName role organizationName avatarUrl phone preferences`;

const ME_QUERY       = `query Me { me { ${USER_FIELDS} } }`;
const LOGIN_MUTATION = `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { ${USER_FIELDS} } } }`;
const REGISTER_MUTATION = `mutation Register($input: RegisterInput!) { register(input: $input) { token user { ${USER_FIELDS} } } }`;
const UPDATE_PROFILE_MUTATION = `mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { profile { ${USER_FIELDS} } } }`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePreferences(raw: any): Record<string, any> {
  if (!raw) return {};
  // graphene JSONString scalar double-encodes to a JSON string — parse it
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw as Record<string, any>;
}

function mapGql(u: any): Profile {
  return {
    id: u.id,
    email: u.email,
    full_name: u.fullName ?? '',
    role: ((u.role ?? 'farmhand') as string).toLowerCase() as UserRole,
    organization: u.organizationName ?? '',
    phone: u.phone || undefined,
    avatar_url: u.avatarUrl || undefined,
    preferences: parsePreferences(u.preferences),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    gqlRequest<{ me: any }>(ME_QUERY)
      .then(data => { if (data?.me) setProfile(mapGql(data.me)); else clearToken(); })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await gqlRequest<{ login: { token: string; user: any } }>(LOGIN_MUTATION, { email, password }, null);
      setToken(data.login.token);
      setProfile(mapGql(data.login.user));
      return { error: null };
    } catch (e: any) { return { error: e.message ?? 'Sign-in failed' }; }
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole, organization: string) {
    try {
      const data = await gqlRequest<{ register: { token: string; user: any } }>(REGISTER_MUTATION, { input: { email, password, fullName, organizationName: organization, role } }, null);
      setToken(data.register.token);
      setProfile(mapGql(data.register.user));
      return { error: null };
    } catch (e: any) { return { error: e.message ?? 'Registration failed' }; }
  }

  async function signOut() { clearToken(); setProfile(null); }

  async function resetPassword(_email: string) {
    return { error: 'Password reset is not yet available. Please contact your administrator.' };
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      const input: Record<string, any> = {};
      if (updates.full_name !== undefined) input.fullName = updates.full_name;
      if (updates.phone !== undefined) input.phone = updates.phone;
      if (updates.avatar_url !== undefined) input.avatarUrl = updates.avatar_url;
      const data = await gqlRequest<{ updateProfile: { profile: any } }>(UPDATE_PROFILE_MUTATION, { input });
      setProfile(mapGql(data.updateProfile.profile));
      return { error: null };
    } catch (e: any) { return { error: e.message ?? 'Update failed' }; }
  }

  function hasRole(roles: UserRole | UserRole[]) {
    if (!profile) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(profile.role);
  }

  function _checkAction(moduleId: string, action: Action): boolean {
    if (!profile) return false;
    if (profile.role === 'director' || profile.role === 'saas_admin') return true;
    const matrix = resolveMatrix(profile.role, profile.preferences?.permissions);
    return can(matrix, moduleId, action);
  }

  const hasPermission = (moduleId: string) => _checkAction(moduleId, 'view');
  const canCreate     = (moduleId: string) => _checkAction(moduleId, 'create');
  const canEdit       = (moduleId: string) => _checkAction(moduleId, 'edit');
  const canDelete     = (moduleId: string) => _checkAction(moduleId, 'delete');

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile, hasRole, hasPermission, canCreate, canEdit, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
}
