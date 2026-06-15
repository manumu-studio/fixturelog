// resolve-role.ts — pure mapping from a provisioned AppUser to its audience role and
// post-login home route. Used by the landing redirect (charterer -> /portal,
// broker -> /requirements) and by the portal guard. Pure and synchronous: it reflects
// stored identity only and performs no provisioning or I/O.
import type { AppRole } from '@prisma/client';

export type Role = 'BROKER' | 'CLIENT';
// Broker home is the broker dashboard (/dashboard, PACKET-009 TASK-091/093); charterer
// home is the portal. /requirements remains a page inside the broker workspace.
export type HomeRoute = '/dashboard' | '/portal';

export interface RoleResolution {
  role: Role;
  homeRoute: HomeRoute;
}

// The minimal AppUser shape role resolution depends on.
export interface RoleInput {
  role: AppRole;
  brokerId: string | null;
  chartererId: string | null;
}

const HOME_ROUTE: Record<Role, HomeRoute> = {
  BROKER: '/dashboard',
  CLIENT: '/portal',
};

/**
 * Resolve an AppUser to its role + home route.
 * A concrete charterer link, or an explicit CLIENT role, is a client; everything else
 * (including a broker link or the unprovisioned default) is treated as a broker.
 */
export function resolveRole(appUser: RoleInput): RoleResolution {
  const isClient = appUser.chartererId !== null || appUser.role === 'CLIENT';
  const role: Role = isClient ? 'CLIENT' : 'BROKER';
  return { role, homeRoute: HOME_ROUTE[role] };
}
