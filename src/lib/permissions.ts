// Central module + action permissions registry.
// Permissions are stored as { moduleId: Action[] } in Profile.preferences.permissions.

export type Action = 'view' | 'create' | 'edit' | 'delete';
export const ACTIONS: Action[] = ['view', 'create', 'edit', 'delete'];

export interface ModuleDef {
  id: string;
  label: string;
  group: string;
}

export const ALL_MODULES: ModuleDef[] = [
  { id: 'dashboard',       label: 'Dashboard',           group: 'Overview'    },
  { id: 'smart-engine',    label: 'Smart AI Engine',      group: 'Overview'    },
  { id: 'planner',         label: 'Daily Planner',        group: 'Overview'    },
  { id: 'poultry',         label: 'Broiler Poultry',      group: 'Production'  },
  { id: 'village-chicken', label: 'Village Chicken',      group: 'Production'  },
  { id: 'piggery',         label: 'Piggery',              group: 'Production'  },
  { id: 'fish',            label: 'Fish Farming',         group: 'Production'  },
  { id: 'duck',            label: 'Duck Management',      group: 'Production'  },
  { id: 'goat-sheep',      label: 'Goats & Sheep',        group: 'Production'  },
  { id: 'horticulture',    label: 'Horticulture',         group: 'Production'  },
  { id: 'inventory',       label: 'Feed & Inventory',     group: 'Operations'  },
  { id: 'sales',           label: 'Sales & Customers',    group: 'Operations'  },
  { id: 'finance',         label: 'Financial Management', group: 'Operations'  },
  { id: 'hr',              label: 'Human Resources',      group: 'Operations'  },
  { id: 'procurement',     label: 'Procurement',          group: 'Operations'  },
  { id: 'biosecurity',     label: 'Biosecurity & Vet',    group: 'Operations'  },
  { id: 'reports',         label: 'Reports & BI',         group: 'Strategy'    },
  { id: 'export',          label: 'Export & Logistics',   group: 'Strategy'    },
  { id: 'assets',          label: 'Assets & Infra',       group: 'Strategy'    },
  { id: 'mobile',          label: 'Mobile App',           group: 'Strategy'    },
  { id: 'settings',        label: 'Settings',             group: 'Strategy'    },
];

export const ALL_IDS = ALL_MODULES.map(m => m.id);
export const MODULE_GROUPS = [...new Set(ALL_MODULES.map(m => m.group))];

// ─── Permission matrix type ────────────────────────────────────────────────────
// Stored in Profile.preferences.permissions as { moduleId: Action[] }
export type PermMatrix = Record<string, Action[]>;

// ─── Role default matrices ─────────────────────────────────────────────────────

function full(...ids: string[]): PermMatrix {
  return Object.fromEntries(ids.map(id => [id, ['view', 'create', 'edit', 'delete'] as Action[]]));
}
function rw(...ids: string[]): PermMatrix {
  return Object.fromEntries(ids.map(id => [id, ['view', 'create', 'edit'] as Action[]]));
}
function ro(...ids: string[]): PermMatrix {
  return Object.fromEntries(ids.map(id => [id, ['view'] as Action[]]));
}
function merge(...parts: PermMatrix[]): PermMatrix {
  return Object.assign({}, ...parts);
}

const LIVESTOCK = ['poultry', 'village-chicken', 'piggery', 'fish', 'duck', 'goat-sheep', 'horticulture'];

export const ROLE_DEFAULT_MATRIX: Record<string, PermMatrix> = {
  director:   full(...ALL_IDS),
  saas_admin: full(...ALL_IDS),
  owner:      full(...ALL_IDS),   // farm owner = full access to all modules

  production_manager: merge(
    ro('dashboard', 'smart-engine'),
    rw('planner', ...LIVESTOCK, 'inventory', 'procurement', 'biosecurity'),
    ro('reports', 'settings'),
  ),

  finance_manager: merge(
    ro('dashboard', 'planner'),
    rw('finance', 'sales', 'inventory', 'procurement'),
    ro('reports', 'export', 'settings'),
  ),

  sales_manager: merge(
    ro('dashboard', 'planner'),
    rw('sales'),
    ro('inventory', 'reports', 'export', 'settings'),
  ),

  supervisor: merge(
    ro('dashboard', 'planner'),
    rw(...LIVESTOCK, 'inventory', 'biosecurity'),
    ro('procurement', 'settings'),
  ),

  farmhand: merge(
    ro('dashboard', 'planner'),
    // can log daily records (create) but not edit/delete existing ones
    Object.fromEntries(LIVESTOCK.map(id => [id, ['view', 'create'] as Action[]])),
    ro('mobile'),
  ),

  vet_officer: merge(
    ro('dashboard', 'planner'),
    Object.fromEntries(LIVESTOCK.map(id => [id, ['view', 'create'] as Action[]])),
    rw('biosecurity'),
    ro('mobile'),
  ),

  driver: ro('dashboard', 'planner', 'mobile'),
};

// ─── Resolvers ─────────────────────────────────────────────────────────────────

/** Migrate old flat-array format → PermMatrix */
function migrateOldFormat(old: string[]): PermMatrix {
  return Object.fromEntries(old.map(id => [id, ['view'] as Action[]]));
}

/** Resolve the effective PermMatrix for a profile */
export function resolveMatrix(role: string, rawPerms: any): PermMatrix {
  if (role === 'director' || role === 'saas_admin') return full(...ALL_IDS);

  // Handle custom permissions stored in preferences
  if (rawPerms) {
    // Old format: plain array of module IDs → migrate
    if (Array.isArray(rawPerms)) return migrateOldFormat(rawPerms as string[]);
    // New format: dict { moduleId: Action[] }
    if (typeof rawPerms === 'object') return rawPerms as PermMatrix;
  }

  return ROLE_DEFAULT_MATRIX[role] ?? ro('dashboard');
}

/** Check if a specific action is allowed on a module */
export function can(matrix: PermMatrix, moduleId: string, action: Action): boolean {
  return (matrix[moduleId] ?? []).includes(action);
}

/** Backward-compat helper used by Sidebar: can the user see this module? */
export function resolvePermissions(role: string, rawPerms: any): string[] {
  const matrix = resolveMatrix(role, rawPerms);
  return Object.entries(matrix)
    .filter(([, actions]) => actions.includes('view'))
    .map(([id]) => id);
}
