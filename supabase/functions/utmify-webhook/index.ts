import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from '../_shared/web-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface UtmifyPayload {
  order: {
    id: string;
    status: string;
    payment_method?: string;
    created_at?: string;
    approved_at?: string;
    currency?: string;
    total: number;
    discount?: number;
    installments?: number;
    platform?: string;
  };
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  };
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  commissions?: Array<{
    role: string;
    value: number;
  }>;
  utm: {
    src?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  tracking?: {
    sck?: string;
    utm_id?: string;
  };
}

function normalizeStatus(raw: string): string {
  const lower = raw.toLowerCase();
  if (['approved', 'paid', 'completed', 'complete'].includes(lower)) return 'approved';
  if (['refunded', 'refund'].includes(lower)) return 'refunded';
  if (['chargeback', 'chargedback', 'dispute'].includes(lower)) return 'chargeback';
  if (['canceled', 'cancelled'].includes(lower)) return 'cancelled';
  return 'pending';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find integration by webhook_secret
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('provider', 'utmify')
      .eq('webhook_secret', token)
      .eq('is_active', true)
      .single();

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = integration.user_id;
    const payload: UtmifyPayload = await req.json();

    // Log webhook — capture ID for later update
    const { data: logEntry } = await supabase.from('webhook_logs').insert({
      user_id: userId,
      source: 'utmify',
      event_type: payload.order?.status || 'unknown',
      payload: payload as unknown as Record<string, unknown>,
      status: 'received',
    }).select('id').single();
    const logId = logEntry?.id;

    if (!payload.order?.id) {
      return new Response(JSON.stringify({ error: 'Missing order.id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const status = normalizeStatus(payload.order.status);
    const orderTotal = Number(payload.order.total) || 0;
    const platformCommission = Number(payload.commissions?.find(c => c.role === 'platform')?.value) || 0;
    const productName = payload.products?.[0]?.name || null;
    const productId = payload.products?.[0]?.id || null;

    // Upsert sale (deduplication by user_id + external_id)
    const { error: saleError } = await supabase
      .from('sales')
      .upsert(
        {
          user_id: userId,
          external_id: payload.order.id,
          status,
          platform: payload.order.platform || null,
          payment_method: payload.order.payment_method || null,
          amount: orderTotal,
          net_amount: orderTotal - platformCommission,
          commission: platformCommission,
          currency: payload.order.currency || 'BRL',
          customer_name: payload.customer?.name || null,
          customer_email: payload.customer?.email || null,
          customer_phone: payload.customer?.phone || null,
          product_name: productName,
          product_id: productId,
          utm_source: payload.utm?.utm_source || null,
          utm_medium: payload.utm?.utm_medium || null,
          utm_campaign: payload.utm?.utm_campaign || null,
          utm_content: payload.utm?.utm_content || null,
          utm_term: payload.utm?.utm_term || null,
          src: payload.utm?.src || null,
          sck: payload.tracking?.sck || null,
          sale_date: payload.order.created_at || new Date().toISOString(),
          approved_date: status === 'approved' ? (payload.order.approved_at || new Date().toISOString()) : null,
          raw_payload: payload as unknown as Record<string, unknown>,
        },
        { onConflict: 'user_id,external_id' }
      );

    if (saleError) {
      // Update webhook log with error
      if (logId) {
        await supabase
          .from('webhook_logs')
          .update({ status: 'failed', error_message: saleError.message, processed_at: new Date().toISOString() })
          .eq('id', logId);
      }

      return new Response(JSON.stringify({ error: 'Failed to process sale' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send push notification for approved sales
    if (status === 'approved') {
      try {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', userId);

        if (subscriptions && subscriptions.length > 0) {
          const vapidKeys = {
            publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
            privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
            subject: Deno.env.get('VAPID_SUBJECT')!,
          };

          const amount = orderTotal.toFixed(2).replace('.', ',');
          const notifPayload = {
            title: '\u{1F4B0} Nova Venda Aprovada!',
            body: `${payload.customer?.name || 'Cliente'} \u2014 ${productName || 'Produto'} \u2014 R$ ${amount}`,
            tag: `sale-${payload.order.id}`,
            url: '/',
          };

          const results = await Promise.allSettled(
            subscriptions.map(sub => sendPushNotification(sub, notifPayload, vapidKeys))
          );

          // Clean up expired subscriptions
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled' && result.value.expired) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscriptions[i].endpoint)
                .eq('user_id', userId);
            }
          }
        }
      } catch {
        // Push failure should never fail the webhook
      }
    }

    // Update webhook log to processed
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', logId);
    }

    return new Response(JSON.stringify({ status: 'received', order_id: payload.order.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
