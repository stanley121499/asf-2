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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      add_to_cart_logs: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          action_type: string
          amount?: number
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          action_type?: string
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
          color_id: string | null
          created_at: string
          id: string
          product_id: string
          size_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          color_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          size_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          color_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          size_id?: string | null
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
          {
            foreignKeyName: "add_to_carts_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "add_to_carts_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      brand: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          media_url: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Relationships: []
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
        }
        Insert: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url: string
          name: string
          parent?: string | null
        }
        Update: {
          active?: boolean
          arrangement?: number | null
          created_at?: string
          id?: string
          media_url?: string
          name?: string
          parent?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string
          id: string
          media_url: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          media_url: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          active: boolean | null
          created_at: string
          group_id: string | null
          id: string
          ticket_id: string | null
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          group_id?: string | null
          id?: string
          ticket_id?: string | null
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          group_id?: string | null
          id?: string
          ticket_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          media_url: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          community_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          media_url: string | null
          name: string | null
          type: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          name?: string | null
          type?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_elements: {
        Row: {
          amount: number | null
          arrangement: number | null
          contentType: string | null
          created_at: string
          id: string
          targetId: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          arrangement?: number | null
          contentType?: string | null
          created_at?: string
          id?: string
          targetId?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          arrangement?: number | null
          contentType?: string | null
          created_at?: string
          id?: string
          targetId?: string | null
          type?: string | null
        }
        Relationships: []
      }
      membership_tiers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string | null
          point_required: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string | null
          point_required?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string | null
          point_required?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          amount: number | null
          color_id: string | null
          created_at: string
          id: string
          order_id: string | null
          product_id: string | null
          size_id: string | null
        }
        Insert: {
          amount?: number | null
          color_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          size_id?: string | null
        }
        Update: {
          amount?: number | null
          color_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          size_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount_type: string | null
          discounted_amount: number | null
          id: string
          points_earned: number | null
          points_spent: number | null
          shipping_address: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_type?: string | null
          discounted_amount?: number | null
          id?: string
          points_earned?: number | null
          points_spent?: number | null
          shipping_address?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_type?: string | null
          discounted_amount?: number | null
          id?: string
          points_earned?: number | null
          points_spent?: number | null
          shipping_address?: string | null
          total_amount?: number | null
          user_id?: string | null
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
          brand_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          festival: string | null
          id: string
          name: string
          price: number
          product_folder_id: string | null
          range_id: string | null
          season: string | null
          status: string
          stock_code: string | null
          stock_place: string | null
          time_post: string | null
          updated_at: string
          warranty_description: string | null
          warranty_period: string | null
        }
        Insert: {
          article_number?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          festival?: string | null
          id?: string
          name: string
          price?: number
          product_folder_id?: string | null
          range_id?: string | null
          season?: string | null
          status?: string
          stock_code?: string | null
          stock_place?: string | null
          time_post?: string | null
          updated_at?: string
          warranty_description?: string | null
          warranty_period?: string | null
        }
        Update: {
          article_number?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          festival?: string | null
          id?: string
          name?: string
          price?: number
          product_folder_id?: string | null
          range_id?: string | null
          season?: string | null
          status?: string
          stock_code?: string | null
          stock_place?: string | null
          time_post?: string | null
          updated_at?: string
          warranty_description?: string | null
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_folder_id_fkey"
            columns: ["product_folder_id"]
            isOneToOne: false
            referencedRelation: "product_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "ranges"
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
      ranges: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          media_url: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          media_url?: string | null
          name?: string | null
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
      ticket_status_change_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_change_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          id: string
          priority: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_details: {
        Row: {
          birthdate: string | null
          city: string | null
          id: string
          lifetime_val: number
          profile_image: string | null
          race: string | null
          role: string
          state: string | null
        }
        Insert: {
          birthdate?: string | null
          city?: string | null
          id: string
          lifetime_val?: number
          profile_image?: string | null
          race?: string | null
          role?: string
          state?: string | null
        }
        Update: {
          birthdate?: string | null
          city?: string | null
          id?: string
          lifetime_val?: number
          profile_image?: string | null
          race?: string | null
          role?: string
          state?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_points_logs: {
        Row: {
          amount: number | null
          created_at: string
          id: number
          point_id: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: number
          point_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: number
          point_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_logs_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "user_points"
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
          article_number: string
          created_at: string
          description: string
          festival: string
          id: string
          name: string
          price: number
          product_categories: Json
          product_colors: Json
          product_folder_id: string
          product_sizes: Json
          season: string
          status: string
          stock_code: string
          stock_count: number
          stock_place: string
          stock_status: string
          time_post: string
          updated_at: string
        }[]
      }
      fetch_purchase_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand: string
          cancel_date: string
          created_at: string
          delivery_address: string
          delivery_date: string
          id: string
          items: Json
          order_date: string
          order_no: string
          product_id: string
          purchase_order_no: string
          salesman_no: string
          shipping_date: string
          status: string
          terms: number
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
