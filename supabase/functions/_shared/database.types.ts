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
      app_config: {
        Row: {
          enabled: boolean
          key: string
          note: string
          updated_at: string
          value: Json
        }
        Insert: {
          enabled?: boolean
          key: string
          note?: string
          updated_at?: string
          value?: Json
        }
        Update: {
          enabled?: boolean
          key?: string
          note?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      code_attempts: {
        Row: {
          attempted_at: string
          id: number
          ok: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: never
          ok: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: never
          ok?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          agreed_at: string
          doc: string
          id: string
          user_id: string
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          agreed_at?: string
          doc: string
          id?: string
          user_id: string
          version: string
          withdrawn_at?: string | null
        }
        Update: {
          agreed_at?: string
          doc?: string
          id?: string
          user_id?: string
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string
          call_token: string | null
          id: string
          install_id: string
          last_active_at: string
          platform: string
          push_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string
          call_token?: string | null
          id?: string
          install_id: string
          last_active_at?: string
          platform: string
          push_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string
          call_token?: string | null
          id?: string
          install_id?: string
          last_active_at?: string
          platform?: string
          push_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_as: string
          inviter_id: string
          joined_by: string | null
          relationship_id: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_as: string
          inviter_id: string
          joined_by?: string | null
          relationship_id?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_as?: string
          inviter_id?: string
          joined_by?: string | null
          relationship_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_joined_by_fkey"
            columns: ["joined_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_settings: {
        Row: {
          avoid_topics: string[]
          curious_topics: string[]
          next_freq: number | null
          next_freq_from: string | null
          question_freq: number
          relationship_id: string
          user_id: string
        }
        Insert: {
          avoid_topics?: string[]
          curious_topics?: string[]
          next_freq?: number | null
          next_freq_from?: string | null
          question_freq?: number
          relationship_id: string
          user_id: string
        }
        Update: {
          avoid_topics?: string[]
          curious_topics?: string[]
          next_freq?: number | null
          next_freq_from?: string | null
          question_freq?: number
          relationship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_settings_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          child_id: string | null
          connected_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          parent_id: string | null
          parent_kind: string
          status: string
        }
        Insert: {
          child_id?: string | null
          connected_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          parent_id?: string | null
          parent_kind: string
          status?: string
        }
        Update: {
          child_id?: string | null
          connected_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          parent_id?: string | null
          parent_kind?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          large_text: boolean
          memo_draft_on: boolean
          name: string
          notify_on: boolean
          notify_time: string
          side: string
        }
        Insert: {
          created_at?: string
          id: string
          large_text?: boolean
          memo_draft_on?: boolean
          name: string
          notify_on?: boolean
          notify_time?: string
          side: string
        }
        Update: {
          created_at?: string
          id?: string
          large_text?: boolean
          memo_draft_on?: boolean
          name?: string
          notify_on?: boolean
          notify_time?: string
          side?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      feature_enabled: { Args: { feature: string }; Returns: boolean }
      is_connected: { Args: { relationship: string }; Returns: boolean }
      is_member: { Args: { relationship: string }; Returns: boolean }
      my_families: {
        Args: never
        Returns: {
          connected_at: string
          my_side: string
          parent_kind: string
          partner_id: string
          partner_name: string
          relationship_id: string
          status: string
        }[]
      }
      register_device: {
        Args: {
          app_version: string
          call_token?: string
          install_id: string
          platform: string
          push_token?: string
        }
        Returns: undefined
      }
      unregister_device: { Args: { install_id: string }; Returns: undefined }
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
