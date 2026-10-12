export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          slug: string;
          category: string | null;
          description: string | null;
          tagline: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          accent_color: string | null;
          font_style: string | null;
          default_language: string | null;
          menu_enabled: boolean | null;
          services_enabled: boolean | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          slug: string;
          category?: string | null;
          description?: string | null;
          tagline?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          accent_color?: string | null;
          font_style?: string | null;
          default_language?: string | null;
          menu_enabled?: boolean | null;
          services_enabled?: boolean | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          slug?: string;
          category?: string | null;
          description?: string | null;
          tagline?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          accent_color?: string | null;
          font_style?: string | null;
          default_language?: string | null;
          menu_enabled?: boolean | null;
          services_enabled?: boolean | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'staff';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'manager' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'manager' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
      };
      trials: {
        Row: {
          id: string;
          user_id: string | null;
          business_id: string | null;
          started_at: string;
          expires_at: string;
          status: 'active' | 'expired' | 'cancelled';
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          business_id?: string | null;
          started_at?: string;
          expires_at?: string;
          status?: 'active' | 'expired' | 'cancelled';
        };
        Update: {
          id?: string;
          user_id?: string | null;
          business_id?: string | null;
          started_at?: string;
          expires_at?: string;
          status?: 'active' | 'expired' | 'cancelled';
        };
      };
      onboarding_progress: {
        Row: {
          id: string;
          user_id: string | null;
          business_id: string | null;
          current_step: number;
          completed: boolean;
          account_completed: boolean;
          business_completed: boolean;
          category_completed: boolean;
          branding_completed: boolean;
          funnel_completed: boolean;
          go_live_completed: boolean;
          step_data: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          business_id?: string | null;
          current_step?: number;
          completed?: boolean;
          account_completed?: boolean;
          business_completed?: boolean;
          category_completed?: boolean;
          branding_completed?: boolean;
          funnel_completed?: boolean;
          go_live_completed?: boolean;
          step_data?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          business_id?: string | null;
          current_step?: number;
          completed?: boolean;
          account_completed?: boolean;
          business_completed?: boolean;
          category_completed?: boolean;
          branding_completed?: boolean;
          funnel_completed?: boolean;
          go_live_completed?: boolean;
          step_data?: Json | null;
          updated_at?: string;
        };
      };
      funnels: {
        Row: {
          id: string;
          business_id: string;
          slug: string;
          status: string;
          review_enabled: boolean;
          smart_review_enabled: boolean;
          menu_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          slug: string;
          status?: string;
          review_enabled?: boolean;
          smart_review_enabled?: boolean;
          menu_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          slug?: string;
          status?: string;
          review_enabled?: boolean;
          smart_review_enabled?: boolean;
          menu_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      qr_codes: {
        Row: {
          id: string;
          business_id: string;
          funnel_id: string | null;
          name: string;
          location_name: string | null;
          table_name: string | null;
          short_code: string;
          destination_url: string;
          status: string;
          style: string;
          primary_color: string | null;
          secondary_color: string | null;
          logo_url: string | null;
          cta_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          funnel_id?: string | null;
          name: string;
          location_name?: string | null;
          table_name?: string | null;
          short_code: string;
          destination_url: string;
          status?: string;
          style?: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          logo_url?: string | null;
          cta_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          funnel_id?: string | null;
          name?: string;
          location_name?: string | null;
          table_name?: string | null;
          short_code?: string;
          destination_url?: string;
          status?: string;
          style?: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          logo_url?: string | null;
          cta_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      menus: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          status: 'active' | 'draft' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name?: string;
          description?: string | null;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          menu_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          menu_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          sort_order: number;
          active: boolean;
          bestseller: boolean;
          tags: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          bestseller?: boolean;
          tags?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          bestseller?: boolean;
          tags?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      google_reviews: {
        Row: {
          id: string;
          business_id: string;
          google_review_id: string;
          reviewer_name: string | null;
          reviewer_photo_url: string | null;
          rating: number;
          review_text: string | null;
          review_time: string;
          sentiment: 'positive' | 'neutral' | 'negative';
          topics: Json | null;
          reply_status: 'unanswered' | 'replied' | 'draft';
          reply_text: string | null;
          google_review_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          google_review_id: string;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          rating: number;
          review_text?: string | null;
          review_time?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          topics?: Json | null;
          reply_status?: 'unanswered' | 'replied' | 'draft';
          reply_text?: string | null;
          google_review_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          google_review_id?: string;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          rating?: number;
          review_text?: string | null;
          review_time?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          topics?: Json | null;
          reply_status?: 'unanswered' | 'replied' | 'draft';
          reply_text?: string | null;
          google_review_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_settings: {
        Row: {
          id: string;
          business_id: string;
          auto_reply_enabled: boolean;
          auto_reply_tone: string;
          auto_reply_language: string;
          custom_reply_instructions: string | null;
          business_hours: Json | null;
          notification_preferences: Json | null;
          appearance_settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          auto_reply_enabled?: boolean;
          auto_reply_tone?: string;
          auto_reply_language?: string;
          custom_reply_instructions?: string | null;
          business_hours?: Json | null;
          notification_preferences?: Json | null;
          appearance_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          auto_reply_enabled?: boolean;
          auto_reply_tone?: string;
          auto_reply_language?: string;
          custom_reply_instructions?: string | null;
          business_hours?: Json | null;
          notification_preferences?: Json | null;
          appearance_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_business_member: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
      is_business_owner_or_admin: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
    };
  };
}
