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
      categories: {
        Row: {
          active: boolean
          arrangement: number | null
          created_at: string
          id: string
          media_url: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      product_categories: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          product_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color: string
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_folder_medias: {
        Row: {
          created_at: string
          id: string
          media_url: string
          product_folder_id: string
          udpated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_url: string
          product_folder_id: string
          udpated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          media_url?: string
          product_folder_id?: string
          udpated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_folder_medias_product_folder_id_fkey"
            columns: ["product_folder_id"]
            isOneToOne: false
            referencedRelation: "product_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_folders: {
        Row: {
          created_at: string
          id: string
          image_count: number
          name: string
          updated_at: string
          video_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_count?: number
          name: string
          updated_at?: string
          video_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_count?: number
          name?: string
          updated_at?: string
          video_count?: number
        }
        Relationships: []
      }
      product_medias: {
        Row: {
          arrangement: number
          created_at: string
          id: string
          media_url: string
          product_id: string
          updated_at: string
        }
        Insert: {
          arrangement?: number
          created_at?: string
          id?: string
          media_url: string
          product_id: string
          updated_at?: string
        }
        Update: {
          arrangement?: number
          created_at?: string
          id?: string
          media_url?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_medias_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchase_order_entries: {
        Row: {
          article_no: string | null
          color_id: string | null
          created_at: string
          id: string
          product_purchase_order_id: string | null
          quantity: number | null
          set: number | null
          size_id: string | null
          supplier_article: string | null
          unit_price: number | null
        }
        Insert: {
          article_no?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          product_purchase_order_id?: string | null
          quantity?: number | null
          set?: number | null
          size_id?: string | null
          supplier_article?: string | null
          unit_price?: number | null
        }
        Update: {
          article_no?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          product_purchase_order_id?: string | null
          quantity?: number | null
          set?: number | null
          size_id?: string | null
          supplier_article?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_purchase_order_entries_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchase_order_entries_product_purchase_order_id_fkey"
            columns: ["product_purchase_order_id"]
            isOneToOne: false
            referencedRelation: "product_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchase_order_entries_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchase_orders: {
        Row: {
          brand: string | null
          cancel_date: string | null
          created_at: string
          customer_no: string | null
          delivery_address: string | null
          delivery_date: string | null
          id: string
          order_date: string | null
          order_no: string | null
          product_id: string | null
          purchase_order_no: string | null
          salesman_no: string | null
          shipping_date: string | null
          terms: number | null
        }
        Insert: {
          brand?: string | null
          cancel_date?: string | null
          created_at?: string
          customer_no?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          product_id?: string | null
          purchase_order_no?: string | null
          salesman_no?: string | null
          shipping_date?: string | null
          terms?: number | null
        }
        Update: {
          brand?: string | null
          cancel_date?: string | null
          created_at?: string
          customer_no?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          product_id?: string | null
          purchase_order_no?: string | null
          salesman_no?: string | null
          shipping_date?: string | null
          terms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_purchase_order_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reports: {
        Row: {
          company: string | null
          created_at: string
          department: string | null
          id: string
          oc_department: string | null
          oc_name: string | null
          person_in_charge: string | null
          product_id: string
          reason: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          department?: string | null
          id?: string
          oc_department?: string | null
          oc_name?: string | null
          person_in_charge?: string | null
          product_id: string
          reason?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          department?: string | null
          id?: string
          oc_department?: string | null
          oc_name?: string | null
          person_in_charge?: string | null
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_report_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          product_id: string
          size: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          product_id: string
          size: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock: {
        Row: {
          color_id: string | null
          count: number
          created_at: string
          id: string
          product_id: string
          size_id: string | null
        }
        Insert: {
          color_id?: string | null
          count?: number
          created_at?: string
          id?: string
          product_id: string
          size_id?: string | null
        }
        Update: {
          color_id?: string | null
          count?: number
          created_at?: string
          id?: string
          product_id?: string
          size_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          product_stock_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          product_stock_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          product_stock_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_logs_product_stock_id_fkey"
            columns: ["product_stock_id"]
            isOneToOne: false
            referencedRelation: "product_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          article_number: string | null
          created_at: string
          description: string | null
          festival: string | null
          id: string
          name: string
          price: number
          product_folder_id: string | null
          season: string | null
          status: string
          stock_code: string | null
          stock_place: string | null
          time_post: string | null
          udpated_at: string
        }
        Insert: {
          article_number?: string | null
          created_at?: string
          description?: string | null
          festival?: string | null
          id?: string
          name: string
          price?: number
          product_folder_id?: string | null
          season?: string | null
          status?: string
          stock_code?: string | null
          stock_place?: string | null
          time_post?: string | null
          udpated_at?: string
        }
        Update: {
          article_number?: string | null
          created_at?: string
          description?: string | null
          festival?: string | null
          id?: string
          name?: string
          price?: number
          product_folder_id?: string | null
          season?: string | null
          status?: string
          stock_code?: string | null
          stock_place?: string | null
          time_post?: string | null
          udpated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_product_folder_id_fkey"
            columns: ["product_folder_id"]
            isOneToOne: false
            referencedRelation: "product_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role?: string
        }
        Update: {
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
      fetch_products_with_computed_attributes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          article_number: string
          created_at: string
          description: string
          festival: string
          name: string
          price: number
          product_folder_id: string
          season: string
          status: string
          stock_code: string
          stock_place: string
          time_post: string
          udpated_at: string
          stock_count: number
          stock_status: string
          product_colors: Json
          product_sizes: Json
          product_categories: Json
        }[]
      }
      fetch_purchase_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_no: string
          brand: string
          order_no: string
          salesman_no: string
          terms: number
          delivery_address: string
          purchase_order_no: string
          order_date: string
          delivery_date: string
          shipping_date: string
          cancel_date: string
          items: Json
        }[]
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
