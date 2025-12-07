/**
 * VETAP Event - Domain Model Types
 * 
 * هذا الملف يحتوي على جميع أنواع البيانات والكيانات للنظام
 */

// ==================== User Roles ====================
export type UserRole = 'owner' | 'partner_admin' | 'organizer' | 'gate_staff';

// ==================== Event Status ====================
export type EventStatus = 'draft' | 'active' | 'archived';

// ==================== Pass Status ====================
export type PassStatus = 'unused' | 'used' | 'revoked' | 'expired';

// ==================== Guest Type ====================
export type GuestType = 'VIP' | 'Regular' | 'Staff' | 'Media' | 'Other';

// ==================== Scan Result ====================
export type ScanResult = 
  | 'valid' 
  | 'already_used' 
  | 'invalid' 
  | 'expired' 
  | 'not_allowed_zone'
  | 'revoked';

// ==================== Webhook Event Types ====================
export type WebhookEventType = 
  | 'on_pass_generated' 
  | 'on_check_in_valid' 
  | 'on_check_in_invalid'
  | 'on_event_created'
  | 'on_event_updated';

// ==================== User Entity ====================
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partner_id: string | null; // For multi-tenant
  phone?: string;
  phone_country_code?: string;
  country?: string;
  city?: string;
  created_at: string;
  updated_at?: string;
}

// ==================== Partner Entity ====================
export interface Partner {
  id: string;
  name: string;
  api_key?: string; // Hashed
  client_id?: string;
  client_secret?: string; // Hashed
  logo_url?: string;
  webhook_url?: string;
  settings?: Record<string, any>; // JSON field for custom settings
  created_at: string;
  updated_at?: string;
}

// ==================== Event Entity ====================
export interface Event {
  id: string;
  partner_id: string;
  name: string;
  description?: string;
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  venue?: string; // Free text or reference to Venue table
  venue_id?: string; // Optional reference to Venue table
  template_id?: string; // Selected invitation template
  status: EventStatus;
  created_at: string;
  updated_at?: string;
  created_by: string; // User ID
}

// ==================== Venue Entity (Optional but Professional) ====================
export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
  created_at: string;
}

// ==================== Zone Entity ====================
export interface Zone {
  id: string;
  event_id: string;
  name: string; // Main, VIP, Backstage, etc.
  description?: string;
  capacity?: number;
  created_at: string;
}

// ==================== Guest Entity ====================
export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  type: GuestType;
  notes?: string;
  zone_ids?: string[]; // Array of zone IDs this guest can access
  created_at: string;
  updated_at?: string;
}

// ==================== Pass Entity ====================
export interface Pass {
  id: string;
  event_id: string;
  guest_id: string;
  token: string; // Unique, random token
  qr_payload: string; // Text to be placed in QR code
  status: PassStatus;
  first_scanned_at?: string; // ISO datetime
  last_scanned_at?: string; // ISO datetime
  allowed_zones?: string[]; // Array of zone IDs
  valid_from?: string; // ISO datetime
  valid_to?: string; // ISO datetime
  generated_at: string;
  revoked_at?: string;
  invite_file_url?: string; // URL of generated invitation file (PNG/PDF/Wallet)
}

// ==================== Gate / Device Entity ====================
export interface Gate {
  id: string;
  event_id: string;
  name: string; // Main Gate, VIP Gate, etc.
  secret?: string; // For device authentication
  login_code?: string; // For device login
  last_seen_at?: string; // ISO datetime
  created_at: string;
  updated_at?: string;
}

// ==================== ScanLog Entity ====================
export interface ScanLog {
  id: string;
  event_id: string;
  pass_id?: string | null; // NULL if invalid
  gate_id: string;
  scanner_user_id?: string; // User who scanned
  result: ScanResult;
  raw_payload: string; // Original scanned data
  scanned_at: string; // ISO datetime
  client_ip?: string;
  user_agent?: string;
}

// ==================== Template Entity ====================
export interface Template {
  id: string;
  partner_id?: string | null; // NULL for global templates
  name: string;
  description?: string;
  base_file_url: string; // Image or PDF URL
  file_type?: 'image' | 'pdf'; // Type of base file
  qr_position_x?: number; // Position in pixels or percentage
  qr_position_y?: number;
  qr_width?: number;
  qr_height?: number;
  qr_rotation?: number; // QR code rotation in degrees
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ==================== WebhookEndpoint Entity ====================
export interface WebhookEndpoint {
  id: string;
  partner_id: string;
  url: string;
  event: WebhookEventType;
  secret: string; // For webhook signature verification
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ==================== ApiKey Entity ====================
export interface ApiKey {
  id: string;
  partner_id: string;
  key_hash: string; // Hashed API key
  name?: string; // Optional name for the key
  last_used_at?: string; // ISO datetime
  expires_at?: string; // ISO datetime (optional expiration)
  created_at: string;
  created_by: string; // User ID
}

// ==================== PassZone Junction Table (if using relational approach) ====================
export interface PassZone {
  pass_id: string;
  zone_id: string;
  created_at: string;
}

// ==================== Database Table Names ====================
export const TABLES = {
  users: 'event_users',
  partners: 'event_partners',
  events: 'event_events',
  venues: 'event_venues',
  zones: 'event_zones',
  guests: 'event_guests',
  passes: 'event_passes',
  gates: 'event_gates',
  scan_logs: 'event_scan_logs',
  templates: 'event_templates',
  webhook_endpoints: 'event_webhook_endpoints',
  api_keys: 'event_api_keys',
  pass_zones: 'event_pass_zones',
} as const;

