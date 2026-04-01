import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enrichIdentity, calculatePredictedLTV } from '../_shared/enrichment.ts';
import { validateEvent, isSyntheticEvent } from '../_shared/validation.ts';
import { buildCAPIPayload } from '../_shared/capi-builder.ts';
import { sendToMeta } from '../_shared/delivery.ts';
import type { BrowserEvent } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Funnel-Id',
};

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
    const event: BrowserEvent = await req.json();

    // Capture server-side data
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || event.visitor.user_agent;
    const funnelId = req.headers.get('x-funnel-id') || event.funnel_id;

    // 1. VALIDATE
    const validation = validateEvent(event);
    if (!validation.valid) {
      return new Response(JSON.stringify({ ok: false, reason: validation.reason }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Resolve user from funnel config
    let userId: string | null = null;
    let pixelId: string | null = null;
    let capiToken: string | null = null;

    if (funnelId) {
      const { data: funnel } = await supabase
        .from('funnel_config')
        .select('user_id, pixel_id, capi_token_encrypted')
        .eq('id', funnelId)
        .eq('is_active', true)
        .maybeSingle();

      if (funnel) {
        userId = funnel.user_id;
        pixelId = funnel.pixel_id;
        capiToken = funnel.capi_token_encrypted;
      }
    }

    // Fallback: try authorization header
    if (!userId) {
      const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
      if (authToken) {
        const { data: funnel } = await supabase
          .from('funnel_config')
          .select('id, user_id, pixel_id, capi_token_encrypted')
          .eq('capi_token_encrypted', authToken)
          .eq('is_active', true)
          .maybeSingle();

        if (funnel) {
          userId = funnel.user_id;
          pixelId = funnel.pixel_id;
          capiToken = funnel.capi_token_encrypted;
        }
      }
    }

    if (!userId || !pixelId || !capiToken) {
      return new Response(JSON.stringify({ ok: false, reason: 'Funnel não encontrado ou inativo' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. ENRICH IDENTITY
    const enrichedIdentity = await enrichIdentity(supabase, event, clientIp, userId);

    // 4. CALCULATE PREDICTED LTV
    const predictedLtv = await calculatePredictedLTV(
      supabase, userId, funnelId, enrichedIdentity.customer_type
    );

    // 5. BUILD CAPI PAYLOAD & SEND TO META (skip synthetic events)
    const isSynthetic = isSyntheticEvent(event);
    let metaResponse = { status: 0, body: { skipped: 'synthetic_event' }, attempts: 0 };

    if (!isSynthetic) {
      const capiPayload = buildCAPIPayload(
        event, enrichedIdentity, predictedLtv, clientIp, userAgent, capiToken,
        event.test_event_code
      );
      metaResponse = await sendToMeta(capiPayload, pixelId);
    }

    // 6. LOG EVENT
    await supabase.from('gateway_events').insert({
      user_id: userId,
      funnel_id: funnelId || null,
      event_id: event.event_id,
      event_name: event.event_name,
      event_time: new Date(event.timestamp).toISOString(),
      event_source_url: event.event_source_url,
      has_email: !!enrichedIdentity.email_hash,
      has_phone: !!enrichedIdentity.phone_hash,
      has_external_id: !!enrichedIdentity.external_id_hash,
      has_fbp: !!enrichedIdentity.fbp,
      has_fbc: !!enrichedIdentity.fbc,
      emq_estimate: enrichedIdentity.emq_estimate,
      value: event.conversion?.value || null,
      currency: event.conversion?.currency || 'BRL',
      customer_type: enrichedIdentity.customer_type,
      predicted_ltv: predictedLtv,
      meta_response_status: metaResponse.status,
      meta_response_body: metaResponse.body,
      delivery_attempts: metaResponse.attempts,
      pixel_also_fired: event.pixel_fired,
      client_ip: clientIp,
      user_agent: userAgent,
    });

    // 8. SAVE PURCHASE if applicable
    if (event.event_name === 'Purchase' && event.conversion?.value) {
      await supabase.from('purchases').upsert({
        user_id: userId,
        email_hash: enrichedIdentity.email_hash,
        order_id: event.conversion.order_id,
        value: event.conversion.value,
        currency: event.conversion.currency || 'BRL',
        items: event.conversion.content_ids
          ? event.conversion.content_ids.map(id => ({ content_id: id }))
          : null,
        event_id: event.event_id,
      }, { onConflict: 'user_id,order_id' });

      // Update visitor purchase stats
      if (enrichedIdentity.email_hash) {
        const { data: vi } = await supabase
          .from('visitor_identities')
          .select('purchase_count, total_spent')
          .eq('user_id', userId)
          .eq('email_hash', enrichedIdentity.email_hash)
          .maybeSingle();

        if (vi) {
          await supabase
            .from('visitor_identities')
            .update({
              purchase_count: (vi.purchase_count || 0) + 1,
              total_spent: Number(vi.total_spent || 0) + Number(event.conversion.value),
              customer_type: (vi.purchase_count || 0) >= 1 ? 'vip' : 'returning',
              predicted_ltv: predictedLtv,
              last_seen: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('email_hash', enrichedIdentity.email_hash);
        }
      }
    }

    // 9. AUDIT LOG
    await supabase.from('gateway_audit_log').insert({
      user_id: userId,
      action: metaResponse.status === 200 ? 'event_sent' : 'event_failed',
      event_id: event.event_id,
      details: `${event.event_name} → Meta ${metaResponse.status} (${metaResponse.attempts} attempts)`,
    });

    return new Response(JSON.stringify({
      ok: metaResponse.status === 200,
      event_id: event.event_id,
      emq_estimate: enrichedIdentity.emq_estimate,
      meta_status: metaResponse.status,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
