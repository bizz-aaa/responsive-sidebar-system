export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contributions: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          event_id: string | null
          id: string
          kind: string
          title: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          kind?: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          kind?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          full_name: string
          id: string
          paid: boolean
          phone: string
          residence: string
          user_id: string | null
          year_of_study: number
        }
        Insert: {
          created_at?: string
          event_id: string
          full_name: string
          id?: string
          paid?: boolean
          phone: string
          residence: string
          user_id?: string | null
          year_of_study: number
        }
        Update: {
          created_at?: string
          event_id?: string
          full_name?: string
          id?: string
          paid?: boolean
          phone?: string
          residence?: string
          user_id?: string | null
          year_of_study?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          contribution_amount: number
          created_at: string
          id: string
          location: string
          starts_at: string
          title: string
        }
        Insert: {
          contribution_amount?: number
          created_at?: string
          id?: string
          location: string
          starts_at: string
          title: string
        }
        Update: {
          contribution_amount?: number
          created_at?: string
          id?: string
          location?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          group_id: string
          is_leader: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          is_leader?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          is_leader?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          created_at: string
          id: string
          leader_name: string
          leader_phone: string | null
          position_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_name: string
          leader_phone?: string | null
          position_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_name?: string
          leader_phone?: string | null
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "leadership_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_positions: {
        Row: {
          body: string
          created_at: string
          id: string
          is_admin: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          contribution_id: string
          created_at: string
          id: string
          reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          contribution_id: string
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          contribution_id?: string
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          baptized: boolean | null
          church: string | null
          course: string | null
          course_duration: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          phone: string
          registration_complete: boolean
          year_of_study: number | null
        }
        Insert: {
          baptized?: boolean | null
          church?: string | null
          course?: string | null
          course_duration?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id: string
          phone: string
          registration_complete?: boolean
          year_of_study?: number | null
        }
        Update: {
          baptized?: boolean | null
          church?: string | null
          course?: string | null
          course_duration?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string
          registration_complete?: boolean
          year_of_study?: number | null
        }
        Relationships: []
      }
      readings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_family_group: { Args: { _uid: string }; Returns: undefined }
      assign_unassigned_members: { Args: never; Returns: number }
      claim_first_admin: { Args: never; Returns: boolean }
      event_registration_count: { Args: { _event: string }; Returns: number }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      my_family_group: { Args: { _uid: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
