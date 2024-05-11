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
      post_folder_medias: {
        Row: {
          created_at: string
          id: string
          media_url: string
          post_folder_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_url: string
          post_folder_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_url?: string
          post_folder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_folder_medias_post_folder_id_fkey"
            columns: ["post_folder_id"]
            isOneToOne: false
            referencedRelation: "post_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      post_folders: {
        Row: {
          created_at: string
          id: string
          image_count: number
          name: string
          video_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_count?: number
          name: string
          video_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_count?: number
          name?: string
          video_count?: number
        }
        Relationships: []
      }
      post_medias: {
        Row: {
          arrangement: number | null
          created_at: string
          id: number
          media_url: string
          post_id: string
        }
        Insert: {
          arrangement?: number | null
          created_at?: string
          id?: number
          media_url: string
          post_id: string
        }
        Update: {
          arrangement?: number | null
          created_at?: string
          id?: number
          media_url?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          caption_position: string
          created_at: string
          cta_text: string | null
          id: string
          name: string
          photo_size: string
          post_folder_id: string | null
          status: string
          time_post: string | null
        }
        Insert: {
          caption?: string | null
          caption_position?: string
          created_at?: string
          cta_text?: string | null
          id?: string
          name: string
          photo_size?: string
          post_folder_id?: string | null
          status?: string
          time_post?: string | null
        }
        Update: {
          caption?: string | null
          caption_position?: string
          created_at?: string
          cta_text?: string | null
          id?: string
          name?: string
          photo_size?: string
          post_folder_id?: string | null
          status?: string
          time_post?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_post_folder_id_fkey"
            columns: ["post_folder_id"]
            isOneToOne: false
            referencedRelation: "post_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
