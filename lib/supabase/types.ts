export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          headline: string | null
          bio: string | null
          avatar_url: string | null
          phone: string | null
          email: string | null
          location: string | null
          links: Json | null
          template_id: number
          username_random: string
          username_custom: string | null
          custom_username_expires_at: string | null
          custom_username_expired: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          location?: string | null
          links?: Json | null
          template_id?: number
          username_random: string
          username_custom?: string | null
          custom_username_expires_at?: string | null
          custom_username_expired?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          location?: string | null
          links?: Json | null
          template_id?: number
          username_random?: string
          username_custom?: string | null
          custom_username_expires_at?: string | null
          custom_username_expired?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expired_custom_usernames: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          profile_id: string
          user_id: string
          email: string | null
          username_custom: string | null
          custom_username_expires_at: string | null
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

