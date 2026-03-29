export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          currency: string;
          default_roas_target: number;
          default_cpa_target: number;
          closing_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          currency?: string;
          default_roas_target?: number;
          default_cpa_target?: number;
          closing_day?: number;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          ad_account_id: string | null;
          pixel_id: string | null;
          token_expires_at: string | null;
          webhook_secret: string;
          is_active: boolean;
          metadata: Record<string, unknown>;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          ad_account_id?: string | null;
          pixel_id?: string | null;
          token_expires_at?: string | null;
          webhook_secret?: string;
          is_active?: boolean;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['integrations']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          external_id: string;
          status: string;
          platform: string | null;
          payment_method: string | null;
          amount: number;
          net_amount: number | null;
          commission: number | null;
          currency: string;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          product_name: string | null;
          product_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          src: string | null;
          sck: string | null;
          sale_date: string;
          approved_date: string | null;
          raw_payload: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          external_id: string;
          status?: string;
          platform?: string | null;
          payment_method?: string | null;
          amount: number;
          net_amount?: number | null;
          commission?: number | null;
          currency?: string;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          product_name?: string | null;
          product_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          src?: string | null;
          sck?: string | null;
          sale_date?: string;
          approved_date?: string | null;
          raw_payload?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          meta_campaign_id: string;
          name: string | null;
          status: string | null;
          objective: string | null;
          daily_budget: number | null;
          lifetime_budget: number | null;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          meta_campaign_id: string;
          name?: string | null;
          status?: string | null;
          objective?: string | null;
          daily_budget?: number | null;
          lifetime_budget?: number | null;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      campaign_metrics: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          date: string;
          spend: number;
          impressions: number;
          reach: number;
          clicks: number;
          link_clicks: number;
          conversions: number;
          leads: number;
          purchases: number;
          purchase_value: number;
          add_to_cart: number;
          initiate_checkout: number;
          view_content: number;
          cpa: number | null;
          roas: number | null;
          ctr: number | null;
          cpc: number | null;
          cpm: number | null;
          frequency: number | null;
          video_p25: number;
          video_p50: number;
          video_p75: number;
          video_p100: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id: string;
          date: string;
          spend?: number;
          impressions?: number;
          reach?: number;
          clicks?: number;
          link_clicks?: number;
          conversions?: number;
          leads?: number;
          purchases?: number;
          purchase_value?: number;
          add_to_cart?: number;
          initiate_checkout?: number;
          view_content?: number;
          cpa?: number | null;
          roas?: number | null;
          ctr?: number | null;
          cpc?: number | null;
          cpm?: number | null;
          frequency?: number | null;
          video_p25?: number;
          video_p50?: number;
          video_p75?: number;
          video_p100?: number;
        };
        Update: Partial<Database['public']['Tables']['campaign_metrics']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          description: string | null;
          amount: number;
          is_recurring: boolean;
          recurring_day: number | null;
          reference_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          category: string;
          description?: string | null;
          amount: number;
          is_recurring?: boolean;
          recurring_day?: number | null;
          reference_date: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          severity: string;
          title: string;
          message: string;
          metric_name: string | null;
          threshold: number | null;
          current_value: number | null;
          campaign_id: string | null;
          dismissed: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          severity: string;
          title: string;
          message: string;
          metric_name?: string | null;
          threshold?: number | null;
          current_value?: number | null;
          campaign_id?: string | null;
          dismissed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      alert_rules: {
        Row: {
          id: string;
          user_id: string;
          metric: string;
          operator: string;
          threshold: number;
          period_hours: number;
          channels: string[];
          is_active: boolean;
          last_triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          metric: string;
          operator: string;
          threshold: number;
          period_hours?: number;
          channels?: string[];
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['alert_rules']['Insert']>;
      };
      webhook_logs: {
        Row: {
          id: string;
          user_id: string | null;
          source: string;
          event_type: string | null;
          status: string;
          payload: Record<string, unknown>;
          error_message: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          source: string;
          event_type?: string | null;
          status?: string;
          payload: Record<string, unknown>;
          error_message?: string | null;
          processed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['webhook_logs']['Insert']>;
      };
    };
    Views: {
      sales_summary: {
        Row: {
          user_id: string;
          total_sales: number;
          pending_sales: number;
          refunded_sales: number;
          gross_revenue: number;
          net_revenue: number;
          total_commission: number;
          refunded_amount: number;
          avg_ticket: number;
          date: string;
        };
      };
      monthly_dre: {
        Row: {
          user_id: string;
          month: string;
          receita_bruta: number;
          taxas_plataforma: number;
          reembolsos: number;
          receita_liquida: number;
        };
      };
      utm_ranking: {
        Row: {
          user_id: string;
          utm_source: string;
          utm_medium: string | null;
          utm_campaign: string | null;
          vendas: number;
          receita: number;
          ticket_medio: number;
        };
      };
    };
  };
}
