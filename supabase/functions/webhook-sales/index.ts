import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from '../_shared/web-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
};

/**
 * WEBHOOK GENÉRICO DE VENDAS — Ads.Everest
 *
 * Aceita vendas de qualquer fonte: checkout próprio, Hotmart, Kiwify,
 * Monetizze, Eduzz, Stripe, PagSeguro, ou qualquer gateway.
 *
 * POST /webhook-sales
 * Headers: X-Webhook-Secret: <seu_secret> OU Authorization: Bearer <seu_secret>
 *
 * Body (JSON):
 * {
 *   "order_id": "ORDER-123",           // obrigatório
 *   "status": "approved",              // approved, pending, refunded, chargeback
 *   "amount": 97.00,                   // obrigatório (valor em reais)
 *   "product_name": "Curso X",         // opcional
 *   "product_id": "prod_123",          // opcional
 *   "customer_name": "Maria Santos",   // opcional
 *   "customer_email": "maria@email",   // opcional
 *   "customer_phone": "11999998888",   // opcional
 *   "payment_method": "credit_card",   // opcional
 *   "platform": "checkout_proprio",    // opcional
 *   "commission": 9.70,               // opcional (taxa da plataforma)
 *   "utm_source": "facebook",          // opcional
 *   "utm_medium": "cpc",              // opcional
 *   "utm_campaign": "campanha_x",      // opcional
 *   "utm_content": "video_1",          // opcional
 *   "utm_term": "keyword",            // opcional
 *   "currency": "BRL",                // opcional (default: BRL)
 *   "metadata": {}                     // opcional (dados extras)
 * }
 */

function normalizeStatus(raw: string): string {
  const lower = (raw || '').toLowerCase();
  if (['approved', 'paid', 'completed', 'complete', 'aprovado', 'pago'].includes(lower)) return 'approved';
  if (['refunded', 'refund', 'reembolsado', 'estornado'].includes(lower)) return 'refunded';
  if (['chargeback', 'chargedback', 'dispute', 'contestado'].includes(lower)) return 'chargeback';
  if (['canceled', 'cancelled', 'cancelado'].includes(lower)) return 'cancelled';
  return 'pending';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Auth via header
    const secret = req.headers.get('x-webhook-secret')
      || req.headers.get('authorization')?.replace('Bearer ', '')
      || new URL(req.url).searchParams.get('token');

    if (!secret) {
      return new Response(JSON.stringify({ error: 'Secret ausente. Use header X-Webhook-Secret ou ?token=' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find integration by webhook_secret
    const { data: integration, error: intErr } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('webhook_secret', secret)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (intErr || !integration) {
      return new Response(JSON.stringify({ error: 'Secret inválido ou integração inativa' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = integration.user_id;
    const body = await req.json();

    // Validate required fields
    if (!body.order_id) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (body.amount == null || isNaN(Number(body.amount))) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: amount (número)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const status = normalizeStatus(body.status || 'approved');
    const amount = Number(body.amount);
    const commission = Number(body.commission || 0);

    // Log webhook
    const { data: logEntry } = await supabase.from('webhook_logs').insert({
      user_id: userId,
      source: body.platform || 'api',
      event_type: status,
      payload: body,
      status: 'received',
    }).select('id').single();

    // Upsert sale
    const { error: saleErr } = await supabase.from('sales').upsert({
      user_id: userId,
      external_id: String(body.order_id),
      status,
      platform: body.platform || 'api',
      payment_method: body.payment_method || null,
      amount,
      net_amount: amount - commission,
      commission,
      currency: body.currency || 'BRL',
      customer_name: body.customer_name || null,
      customer_email: body.customer_email || null,
      customer_phone: body.customer_phone || null,
      product_name: body.product_name || null,
      product_id: body.product_id || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      sale_date: body.sale_date || new Date().toISOString(),
      approved_date: status === 'approved' ? new Date().toISOString() : null,
      raw_payload: body,
    }, { onConflict: 'user_id,external_id' });

    if (saleErr) {
      if (logEntry?.id) {
        await supabase.from('webhook_logs').update({
          status: 'failed', error_message: saleErr.message, processed_at: new Date().toISOString(),
        }).eq('id', logEntry.id);
      }
      return new Response(JSON.stringify({ error: 'Falha ao salvar venda' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update log
    if (logEntry?.id) {
      await supabase.from('webhook_logs').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('id', logEntry.id);
    }

    // Push notification for approved sales
    if (status === 'approved') {
      try {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', userId);

        if (subscriptions && subscriptions.length > 0) {
          const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
          const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
          const vapidSubject = Deno.env.get('VAPID_SUBJECT');

          if (vapidPublic && vapidPrivate && vapidSubject) {
            const formatted = amount.toFixed(2).replace('.', ',');
            const notif = {
              title: '💰 Nova Venda!',
              body: `${body.customer_name || 'Cliente'} — ${body.product_name || 'Produto'} — R$ ${formatted}`,
              tag: `sale-${body.order_id}`,
              url: '/?module=utm-vendas',
            };

            for (const sub of subscriptions) {
              await sendPushNotification(sub, notif, {
                publicKey: vapidPublic,
                privateKey: vapidPrivate,
                subject: vapidSubject,
              }).catch(() => {});
            }
          }
        }
      } catch {
        // Push failure should not block webhook response
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      order_id: body.order_id,
      status,
      amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
