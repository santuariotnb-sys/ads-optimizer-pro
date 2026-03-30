import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
};

/**
 * SUBSCRIPTION WEBHOOK — Ads.Everest (Kiwify)
 *
 * Handles Kiwify subscription events:
 * - order_approved → activate plan
 * - subscription_renewed → renew plan
 * - refund / chargeback → downgrade to free
 * - subscription_cancelled → mark cancelled (keeps plan until expires_at)
 *
 * POST /subscription-webhook
 * Headers: X-Webhook-Secret: <secret> OR ?token=<secret>
 */

function getProductPlan(productId: string): string {
  const starterIds = (Deno.env.get('KIWIFY_STARTER_PRODUCT_IDS') || '').split(',').filter(Boolean);
  const proIds = (Deno.env.get('KIWIFY_PRO_PRODUCT_IDS') || '').split(',').filter(Boolean);
  const agencyIds = (Deno.env.get('KIWIFY_AGENCY_PRODUCT_IDS') || '').split(',').filter(Boolean);

  if (agencyIds.includes(productId)) return 'agency';
  if (proIds.includes(productId)) return 'pro';
  if (starterIds.includes(productId)) return 'starter';
  return 'pro'; // default fallback
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Auth via header or query param
    const secret = req.headers.get('x-webhook-secret')
      || req.headers.get('authorization')?.replace('Bearer ', '')
      || new URL(req.url).searchParams.get('token');

    const expectedSecret = Deno.env.get('KIWIFY_WEBHOOK_SECRET');

    if (!secret || !expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Secret invalido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Kiwify sends event type at top level or nested
    const eventType: string = body.event || body.webhook_event_type || body.type || '';
    const customerEmail: string = body.Customer?.email || body.customer_email || body.email || '';
    const orderId: string = body.order_id || body.Order?.order_id || '';
    const subscriptionId: string = body.subscription_id || body.Subscription?.id || '';
    const productId: string = body.Product?.product_id || body.product_id || '';
    const price: number = Number(body.Order?.amount || body.amount || body.price || 0);

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'Email do cliente ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log webhook
    const { data: logEntry } = await supabase.from('webhook_logs').insert({
      source: 'kiwify-subscription',
      event_type: eventType,
      payload: body,
      status: 'received',
    }).select('id').single();

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customerEmail)
      .limit(1)
      .maybeSingle();

    if (!profile) {
      // Try auth.users as fallback
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(
        (u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
      );

      if (!authUser) {
        if (logEntry?.id) {
          await supabase.from('webhook_logs').update({
            status: 'failed',
            error_message: `Usuario nao encontrado: ${customerEmail}`,
            processed_at: new Date().toISOString(),
          }).eq('id', logEntry.id);
        }
        return new Response(JSON.stringify({ error: 'Usuario nao encontrado', email: customerEmail }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Use authUser id
      return await processEvent({
        supabase, eventType, userId: authUser.id, customerEmail, orderId,
        subscriptionId, productId, price, body, logId: logEntry?.id,
      });
    }

    return await processEvent({
      supabase, eventType, userId: profile.id, customerEmail, orderId,
      subscriptionId, productId, price, body, logId: logEntry?.id,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface ProcessParams {
  supabase: ReturnType<typeof createClient>;
  eventType: string;
  userId: string;
  customerEmail: string;
  orderId: string;
  subscriptionId: string;
  productId: string;
  price: number;
  body: Record<string, unknown>;
  logId?: string;
}

async function processEvent(params: ProcessParams) {
  const {
    supabase, eventType, userId, customerEmail, orderId,
    subscriptionId, productId, price, body, logId,
  } = params;

  const now = new Date();
  const plan = getProductPlan(productId);
  const expiresAt = addDays(now, 33); // 30 days + 3 grace

  const normalizedEvent = eventType.toLowerCase().replace(/[.\-_]/g, '');

  try {
    if (['orderapproved', 'orderapproveds', 'subscriptioncreated'].includes(normalizedEvent)
      || normalizedEvent.includes('approved') || normalizedEvent.includes('created')) {
      // Activate subscription
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        kiwify_subscription_id: subscriptionId || null,
        kiwify_order_id: orderId || null,
        kiwify_customer_email: customerEmail,
        price,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        cancelled_at: null,
        last_webhook_at: now.toISOString(),
        metadata: body,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').update({
        plan,
        plan_expires_at: expiresAt.toISOString(),
      }).eq('id', userId);

    } else if (['subscriptionrenewed', 'subscriptionrenewal'].includes(normalizedEvent)
      || normalizedEvent.includes('renewed') || normalizedEvent.includes('renewal')) {
      // Renew subscription
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        kiwify_subscription_id: subscriptionId || null,
        kiwify_order_id: orderId || null,
        kiwify_customer_email: customerEmail,
        price,
        expires_at: expiresAt.toISOString(),
        cancelled_at: null,
        last_webhook_at: now.toISOString(),
        metadata: body,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').update({
        plan,
        plan_expires_at: expiresAt.toISOString(),
      }).eq('id', userId);

    } else if (['refund', 'refunded', 'chargeback', 'chargebacked'].includes(normalizedEvent)
      || normalizedEvent.includes('refund') || normalizedEvent.includes('chargeback')) {
      // Downgrade to free immediately
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'free',
        status: 'cancelled',
        kiwify_customer_email: customerEmail,
        expires_at: now.toISOString(),
        cancelled_at: now.toISOString(),
        last_webhook_at: now.toISOString(),
        metadata: body,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').update({
        plan: 'free',
        plan_expires_at: now.toISOString(),
      }).eq('id', userId);

    } else if (['subscriptioncancelled', 'subscriptioncanceled'].includes(normalizedEvent)
      || normalizedEvent.includes('cancelled') || normalizedEvent.includes('canceled')) {
      // Mark cancelled but keep plan until expires_at
      await supabase.from('subscriptions').update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        last_webhook_at: now.toISOString(),
        metadata: body,
        updated_at: now.toISOString(),
      }).eq('user_id', userId);
      // Do NOT update profiles.plan — user keeps access until expires_at

    } else {
      // Unknown event — log and return ok
      if (logId) {
        await supabase.from('webhook_logs').update({
          status: 'skipped',
          error_message: `Evento desconhecido: ${eventType}`,
          processed_at: now.toISOString(),
        }).eq('id', logId);
      }

      return new Response(JSON.stringify({ ok: true, event: eventType, action: 'skipped' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update log as processed
    if (logId) {
      await supabase.from('webhook_logs').update({
        status: 'processed',
        processed_at: now.toISOString(),
      }).eq('id', logId);
    }

    return new Response(JSON.stringify({
      ok: true,
      event: eventType,
      plan,
      user_id: userId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar evento';
    if (logId) {
      await supabase.from('webhook_logs').update({
        status: 'failed',
        error_message: message,
        processed_at: now.toISOString(),
      }).eq('id', logId);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
