export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      habit_logs: {
        Row: {
          completed_on: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_on: string
          created_at?: string
          habit_id: string
          id?: string
          user_id?: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived: boolean
          color: string
          created_at: string
          frequency: number[]
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: string
          frequency?: number[]
          id?: string
          name: string
          sort_order?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: string
          frequency?: number[]
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          timezone: string | null
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          timezone?: string | null
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          timezone?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          key: string
          unlocked_at?: string
          user_id?: string
        }
        Update: {
          key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          content: string
          created_at: string
          generations: number
          period_end: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          generations?: number
          period_end: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          generations?: number
          period_end?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reorder_habits: {
        Args: {
          habit_ids: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
