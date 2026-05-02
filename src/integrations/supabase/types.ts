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
      admin_reimbursements: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          form_type: string
          id: string
          receipt_image_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          form_type?: string
          id?: string
          receipt_image_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          form_type?: string
          id?: string
          receipt_image_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_insights: {
        Row: {
          competitor_name: string
          created_at: string
          description: string | null
          id: string
          strategy_type: string | null
          updated_at: string
        }
        Insert: {
          competitor_name: string
          created_at?: string
          description?: string | null
          id?: string
          strategy_type?: string | null
          updated_at?: string
        }
        Update: {
          competitor_name?: string
          created_at?: string
          description?: string | null
          id?: string
          strategy_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          awb_manual: number | null
          awb_otomatis: number | null
          city: string | null
          created_at: string
          id: string
          longlat: string | null
          name: string
          owner: string | null
          period_end: string | null
          period_start: string | null
          shipper: string | null
          trend_awb_otomatis: string | null
          trend_shipper: string | null
          updated_at: string
        }
        Insert: {
          awb_manual?: number | null
          awb_otomatis?: number | null
          city?: string | null
          created_at?: string
          id?: string
          longlat?: string | null
          name: string
          owner?: string | null
          period_end?: string | null
          period_start?: string | null
          shipper?: string | null
          trend_awb_otomatis?: string | null
          trend_shipper?: string | null
          updated_at?: string
        }
        Update: {
          awb_manual?: number | null
          awb_otomatis?: number | null
          city?: string | null
          created_at?: string
          id?: string
          longlat?: string | null
          name?: string
          owner?: string | null
          period_end?: string | null
          period_start?: string | null
          shipper?: string | null
          trend_awb_otomatis?: string | null
          trend_shipper?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      select_options: {
        Row: {
          bg_color: string
          created_at: string
          fg_color: string
          field: string
          id: string
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          fg_color?: string
          field: string
          id?: string
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          fg_color?: string
          field?: string
          id?: string
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          checklist: Json | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          image_path: string | null
          location_lat_lng: string | null
          partner_id: string | null
          position: number | null
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          image_path?: string | null
          location_lat_lng?: string | null
          partner_id?: string | null
          position?: number | null
          priority?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          image_path?: string | null
          location_lat_lng?: string | null
          partner_id?: string | null
          position?: number | null
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
