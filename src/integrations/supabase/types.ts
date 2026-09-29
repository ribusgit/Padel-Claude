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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string
          date: string
          id: string
          present: boolean
          student_id: string
        }
        Insert: {
          class_id: string
          date: string
          id?: string
          present?: boolean
          student_id: string
        }
        Update: {
          class_id?: string
          date?: string
          id?: string
          present?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          court: number
          created_at: string
          date: string
          end_time: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          start_time: string
          type: string
        }
        Insert: {
          court: number
          created_at?: string
          date: string
          end_time: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          start_time: string
          type?: string
        }
        Update: {
          court?: number
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          start_time?: string
          type?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          attendance: Json
          coach_id: string | null
          court: number
          created_at: string
          date: string
          duration_min: number
          id: string
          is_trial: boolean
          level: string
          plan: string
          student_ids: string[]
          time: string
        }
        Insert: {
          attendance?: Json
          coach_id?: string | null
          court: number
          created_at?: string
          date: string
          duration_min?: number
          id?: string
          is_trial?: boolean
          level: string
          plan?: string
          student_ids?: string[]
          time: string
        }
        Update: {
          attendance?: Json
          coach_id?: string | null
          court?: number
          created_at?: string
          date?: string
          duration_min?: number
          id?: string
          is_trial?: boolean
          level?: string
          plan?: string
          student_ids?: string[]
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      club_hours: {
        Row: {
          close_time: string
          closed: boolean
          created_at: string
          open_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          close_time?: string
          closed?: boolean
          created_at?: string
          open_time?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          close_time?: string
          closed?: boolean
          created_at?: string
          open_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      club_settings: {
        Row: {
          bizum_phone: string
          id: boolean
          updated_at: string
        }
        Insert: {
          bizum_phone?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          bizum_phone?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          specialty: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          specialty?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          specialty?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          level: string
          position: number
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          level: string
          position?: number
          title: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          level?: string
          position?: number
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      fee_plans: {
        Row: {
          amount: number
          plan: string
          updated_at: string
        }
        Insert: {
          amount?: number
          plan: string
          updated_at?: string
        }
        Update: {
          amount?: number
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_budgets: {
        Row: {
          amount: number
          created_at: string
          month: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_items: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          notes: string
          purchase_date: string
          quantity: number
          supplier: string
          unit_cost: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          purchase_date?: string
          quantity?: number
          supplier?: string
          unit_cost?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          purchase_date?: string
          quantity?: number
          supplier?: string
          unit_cost?: number
        }
        Relationships: []
      }
      media: {
        Row: {
          coach_id: string | null
          comment: string
          created_at: string
          file_name: string
          id: string
          kind: string
          mime_type: string
          size: number
          storage_path: string
          student_id: string
          title: string
        }
        Insert: {
          coach_id?: string | null
          comment?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string
          size?: number
          storage_path: string
          student_id: string
          title?: string
        }
        Update: {
          coach_id?: string | null
          comment?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string
          size?: number
          storage_path?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          method: string
          month: string
          paid: boolean
          paid_at: string | null
          student_id: string
        }
        Insert: {
          amount?: number
          id?: string
          method?: string
          month: string
          paid?: boolean
          paid_at?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          id?: string
          method?: string
          month?: string
          paid?: boolean
          paid_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coach_id: string | null
          created_at: string
          full_name: string
          id: string
          student_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          full_name?: string
          id: string
          student_id?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_notes: {
        Row: {
          coach_id: string | null
          created_at: string
          date: string
          id: string
          student_id: string
          text: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          student_id: string
          text: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          student_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_summaries: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          student_id: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          student_id: string
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          student_id?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_summaries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_state: {
        Row: {
          admin_claimed: boolean
          id: boolean
        }
        Insert: {
          admin_claimed?: boolean
          id?: boolean
        }
        Update: {
          admin_claimed?: boolean
          id?: boolean
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          created_at: string
          email: string
          enrolled_at: string
          id: string
          level: number
          name: string
          payment_status: string
          phone: string
          photo_path: string | null
          plan: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string
          enrolled_at?: string
          id?: string
          level?: number
          name: string
          payment_status?: string
          phone?: string
          photo_path?: string | null
          plan?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          enrolled_at?: string
          id?: string
          level?: number
          name?: string
          payment_status?: string
          phone?: string
          photo_path?: string | null
          plan?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          created_at: string
          direction: string
          id: string
          kind: string
          phone: string
          recipient_name: string
          sent_by: string | null
          student_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          direction?: string
          id?: string
          kind?: string
          phone?: string
          recipient_name?: string
          sent_by?: string | null
          student_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          direction?: string
          id?: string
          kind?: string
          phone?: string
          recipient_name?: string
          sent_by?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_claimed: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coach" | "alumno"
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
    Enums: {
      app_role: ["admin", "coach", "alumno"],
    },
  },
} as const
