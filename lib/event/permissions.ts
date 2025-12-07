/**
 * VETAP Event - Permissions System
 */

import type { UserRole } from './types';

// Feature permissions for each role
export const rolePermissions: Record<UserRole, string[]> = {
  owner: [
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'guests.view', 'guests.create', 'guests.edit', 'guests.delete', 'guests.import',
    'invites.view', 'invites.generate', 'invites.revoke', 'invites.download',
    'statistics.view', 'statistics.export',
    'check-in.view', 'check-in.scan',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
  ],
  partner_admin: [
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'guests.view', 'guests.create', 'guests.edit', 'guests.delete', 'guests.import',
    'invites.view', 'invites.generate', 'invites.revoke', 'invites.download',
    'statistics.view', 'statistics.export',
    'check-in.view', 'check-in.scan',
    'templates.view', 'templates.create',
    'users.view',
  ],
  organizer: [
    'events.view', 'events.create', 'events.edit',
    'guests.view', 'guests.create', 'guests.edit', 'guests.delete', 'guests.import',
    'invites.view', 'invites.generate', 'invites.download',
    'statistics.view',
    'check-in.view', 'check-in.scan',
    'templates.view',
  ],
  gate_staff: [
    'events.view',
    'guests.view',
    'statistics.view',
    'check-in.view', 'check-in.scan',
  ],
};

// Menu feature mapping
export const menuFeatures: Record<string, string> = {
  'events': 'events.view',
  'guests': 'guests.view',
  'invites': 'invites.view',
  'statistics': 'statistics.view',
  'check-in': 'check-in.view',
  'analytics': 'statistics.view',
  'monitoring': 'settings.view',
  'settings': 'settings.view',
};

// Check if role can access settings
export function canAccessSettings(role: UserRole): boolean {
  return hasPermission(role, 'settings.view');
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role can access a menu feature
 */
export function canAccessMenu(role: UserRole, feature: string): boolean {
  const permission = menuFeatures[feature];
  if (!permission) return false;
  return hasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): string[] {
  return rolePermissions[role] || [];
}

/**
 * Check if role can create events
 */
export function canCreateEvents(role: UserRole): boolean {
  return hasPermission(role, 'events.create');
}

/**
 * Check if role can manage guests
 */
export function canManageGuests(role: UserRole): boolean {
  return hasPermission(role, 'guests.create');
}

/**
 * Check if role can generate invites
 */
export function canGenerateInvites(role: UserRole): boolean {
  return hasPermission(role, 'invites.generate');
}

/**
 * Check if role can scan passes
 */
export function canScanPasses(role: UserRole): boolean {
  return hasPermission(role, 'check-in.scan');
}

/**
 * Check if role is admin level (owner or partner_admin)
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'owner' || role === 'partner_admin';
}

