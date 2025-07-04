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
      add_to_cart_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "add_to_cart_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      add_to_carts: {
        Row: {
          amount: number
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "add_to_cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          arrangement: number | null
          created_at: string
          id: string
          media_url: string
          name: string
          parent: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url: string
          name: string
          parent?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url?: string
          name?: string
          parent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      homepage_elements: {
        Row: {
          amount: number | null
          arrangement: number
          contentType: string | null
          created_at: string
          id: string
          targetId: string
          type: string
        }
        Insert: {
          amount?: number | null
          arrangement: number
          contentType?: string | null
          created_at?: string
          id?: string
          targetId: string
          type: string
        }
        Update: {
          amount?: number | null
          arrangement?: number
          contentType?: string | null
          created_at?: string
          id?: string
          targetId?: string
          type?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          media_url: string
          sender: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          media_url: string
          sender?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string
          sender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "post_medias_post_id_fkey"
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
          font_family: string | null
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
          font_family?: string | null
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
          font_family?: string | null
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
      product_events: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string | null
          report_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id?: string | null
          report_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string | null
          report_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "product_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "product_reports"
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
          remarks: string | null
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
          remarks?: string | null
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
          remarks?: string | null
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
          delivery_address: string | null
          delivery_date: string | null
          id: string
          order_date: string | null
          order_no: string | null
          product_event: string
          product_id: string
          purchase_order_no: string | null
          salesman_no: string | null
          shipping_date: string | null
          status: string
          terms: number | null
        }
        Insert: {
          brand?: string | null
          cancel_date?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          product_event: string
          product_id: string
          purchase_order_no?: string | null
          salesman_no?: string | null
          shipping_date?: string | null
          status?: string
          terms?: number | null
        }
        Update: {
          brand?: string | null
          cancel_date?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          product_event?: string
          product_id?: string
          purchase_order_no?: string | null
          salesman_no?: string | null
          shipping_date?: string | null
          status?: string
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
          {
            foreignKeyName: "product_purchase_orders_product_event_fkey"
            columns: ["product_event"]
            isOneToOne: false
            referencedRelation: "product_events"
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
          product_event: string
          product_id: string
          reason: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          department?: string | null
          id?: string
          oc_department?: string | null
          oc_name?: string | null
          person_in_charge?: string | null
          product_event: string
          product_id: string
          reason?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          department?: string | null
          id?: string
          oc_department?: string | null
          oc_name?: string | null
          person_in_charge?: string | null
          product_event?: string
          product_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_report_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reports_product_event_fkey"
            columns: ["product_event"]
            isOneToOne: false
            referencedRelation: "product_events"
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
          warranty_description: string | null
          warranty_period: string | null
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
          warranty_description?: string | null
          warranty_period?: string | null
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
          warranty_description?: string | null
          warranty_period?: string | null
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
      promotion_folder_medias: {
        Row: {
          created_at: string
          id: string
          media_url: string
          promotion_folder_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_url: string
          promotion_folder_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_url?: string
          promotion_folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_folder_medias_promotion_folder_id_fkey"
            columns: ["promotion_folder_id"]
            isOneToOne: false
            referencedRelation: "promotion_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_folders: {
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
      promotion_product: {
        Row: {
          auto_apply: boolean
          created_at: string
          expiry: string | null
          id: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          auto_apply?: boolean
          created_at?: string
          expiry?: string | null
          id?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          auto_apply?: boolean
          created_at?: string
          expiry?: string | null
          id?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_product_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_product_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          amount: number
          auto_apply: boolean
          code: string
          created_at: string
          end_date: string | null
          id: string
          minimum_purchase_amount: number
          start_date: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          auto_apply?: boolean
          code: string
          created_at?: string
          end_date?: string | null
          id?: string
          minimum_purchase_amount?: number
          start_date: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          auto_apply?: boolean
          code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          minimum_purchase_amount?: number
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      sales_logs: {
        Row: {
          city: string | null
          created_at: string
          id: string
          price: number
          product_id: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          price: number
          product_id: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          birthdate: string | null
          city: string | null
          id: string
          lifetime_val: number
          race: string | null
          role: string
          state: string | null
        }
        Insert: {
          birthdate?: string | null
          city?: string | null
          id: string
          lifetime_val?: number
          race?: string | null
          role?: string
          state?: string | null
        }
        Update: {
          birthdate?: string | null
          city?: string | null
          id?: string
          lifetime_val?: number
          race?: string | null
          role?: string
          state?: string | null
        }
        Relationships: []
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
          id: string
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
          created_at: string
          product_id: string
          status: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
