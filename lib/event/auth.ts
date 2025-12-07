/**
 * VETAP Event - Authentication & Authorization Helpers
 * 
 * Helper functions for checking user permissions and multi-tenant security
 */

import { createEventClient } from '@/lib/supabase/event-server';
import type { UserRole } from './types';

export interface EventUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partner_id: string | null;
}

/**
 * Get the current authenticated user from Supabase Auth
 */
export async function getCurrentEventUser(): Promise<EventUser | null> {
  try {
    const supabase = await createEventClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get user data from event_users table
    const { data: eventUser, error: userError } = await supabase
      .from('event_users')
      .select('id, name, email, role, partner_id, phone, phone_country_code, country, city')
      .eq('id', user.id)
      .single();

    if (userError || !eventUser) {
      return null;
    }

    return eventUser as EventUser;
  } catch (error) {
    console.error('Error getting current event user:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentEventUser();
  return user !== null;
}

/**
 * Check if the current user is an owner
 */
export async function isOwner(): Promise<boolean> {
  const user = await getCurrentEventUser();
  return user?.role === 'owner';
}

/**
 * Check if the current user is a partner admin
 */
export async function isPartnerAdmin(): Promise<boolean> {
  const user = await getCurrentEventUser();
  return user?.role === 'partner_admin';
}

/**
 * Check if the current user is an organizer
 */
export async function isOrganizer(): Promise<boolean> {
  const user = await getCurrentEventUser();
  return user?.role === 'organizer';
}

/**
 * Check if the current user is gate staff
 */
export async function isGateStaff(): Promise<boolean> {
  const user = await getCurrentEventUser();
  return user?.role === 'gate_staff';
}

/**
 * Get the current user's partner_id
 */
export async function getCurrentPartnerId(): Promise<string | null> {
  const user = await getCurrentEventUser();
  return user?.partner_id || null;
}

/**
 * Check if the current user has access to a specific partner
 */
export async function hasPartnerAccess(partnerId: string): Promise<boolean> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    return false;
  }

  // Owners have access to all partners
  if (user.role === 'owner') {
    return true;
  }

  // Users can only access their own partner
  return user.partner_id === partnerId;
}

/**
 * Check if the current user can manage events
 */
export async function canManageEvents(): Promise<boolean> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    return false;
  }

  return ['owner', 'partner_admin', 'organizer'].includes(user.role);
}

/**
 * Check if the current user can perform check-in
 */
export async function canPerformCheckIn(): Promise<boolean> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    return false;
  }

  return ['owner', 'partner_admin', 'organizer', 'gate_staff'].includes(user.role);
}

/**
 * Check if the current user can manage users
 */
export async function canManageUsers(): Promise<boolean> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    return false;
  }

  return ['owner', 'partner_admin'].includes(user.role);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<EventUser> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require owner role - throws error if not owner
 */
export async function requireOwner(): Promise<EventUser> {
  const user = await requireAuth();
  
  if (user.role !== 'owner') {
    throw new Error('Owner role required');
  }

  return user;
}

/**
 * Require partner access - throws error if user doesn't have access
 */
export async function requirePartnerAccess(partnerId: string): Promise<EventUser> {
  const user = await requireAuth();
  const hasAccess = await hasPartnerAccess(partnerId);
  
  if (!hasAccess) {
    throw new Error('Access denied: Partner access required');
  }

  return user;
}

/**
 * Require event management permission - throws error if user can't manage events
 */
export async function requireEventManagement(): Promise<EventUser> {
  const user = await requireAuth();
  const canManage = await canManageEvents();
  
  if (!canManage) {
    throw new Error('Access denied: Event management permission required');
  }

  return user;
}

/**
 * Get user's accessible partner IDs
 * Returns all partner IDs for owners, or single partner_id for others
 */
export async function getAccessiblePartnerIds(): Promise<string[]> {
  const user = await getCurrentEventUser();
  
  if (!user) {
    return [];
  }

  // Owners can access all partners
  if (user.role === 'owner') {
    const supabase = await createEventClient();
    const { data: partners } = await supabase
      .from('event_partners')
      .select('id');
    
    return partners?.map(p => p.id) || [];
  }

  // Others can only access their own partner
  return user.partner_id ? [user.partner_id] : [];
}

