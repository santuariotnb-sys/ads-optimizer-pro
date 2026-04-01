import { supabase } from '../lib/supabase';

export interface GatewayStats {
  eventsTotal: number;
  eventsWithEmail: number;
  eventsWithPhone: number;
  eventsWithExternalId: number;
  eventsWithFbp: number;
  eventsWithFbc: number;
  avgEmq: number;
  deliverySuccess: number;
  deliveryFailed: number;
  recoveryCount: number;
  totalValue: number;
  // Observability
  dedupCount: number;
  capiOnlyCount: number;
  pixelOnlyCount: number;
  bothCount: number;
  rejectedCount: number;
}

export interface GatewayPipeline {
  pageviews: number;
  viewContent: number;
  leads: number;
  initiateCheckout: number;
  purchases: number;
  purchaseValue: number;
}

export interface FunnelConfig {
  id: string;
  funnel_name: string;
  funnel_type: string;
  front_price: number;
  bump1_price: number;
  bump1_rate: number;
  bump2_price: number;
  bump2_rate: number;
  upsell_price: number;
  upsell_rate: number;
  downsell_price: number;
  downsell_rate: number;
  pixel_id: string;
  capi_token_encrypted: string;
  gateway_url: string;
  is_active: boolean;
}

export function calculateEPV(config: Partial<FunnelConfig>): number {
  return (
    Number(config.front_price || 0) +
    Number(config.bump1_price || 0) * Number(config.bump1_rate || 0) +
    Number(config.bump2_price || 0) * Number(config.bump2_rate || 0) +
    Number(config.upsell_price || 0) * Number(config.upsell_rate || 0) +
    Number(config.downsell_price || 0) * Number(config.downsell_rate || 0) * (1 - Number(config.upsell_rate || 0))
  );
}

export function calculatePredictedLTV(config: Partial<FunnelConfig>): number {
  return Math.round(calculateEPV(config) * 3 * 100) / 100;
}

export async function fetchGatewayStats(period: 'today' | '7d' | '14d' | '30d' = '7d'): Promise<GatewayStats> {
  const daysMap = { today: 0, '7d': 7, '14d': 14, '30d': 30 };
  const days = daysMap[period];
  const since = new Date();
  since.setDate(since.getDate() - (days || 1));
  if (period === 'today') since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('gateway_events')
    .select('has_email, has_phone, has_external_id, has_fbp, has_fbc, emq_estimate, meta_response_status, pixel_also_fired, value')
    .gte('created_at', since.toISOString());

  const empty: GatewayStats = {
    eventsTotal: 0, eventsWithEmail: 0, eventsWithPhone: 0,
    eventsWithExternalId: 0, eventsWithFbp: 0, eventsWithFbc: 0,
    avgEmq: 0, deliverySuccess: 0, deliveryFailed: 0,
    recoveryCount: 0, totalValue: 0,
    dedupCount: 0, capiOnlyCount: 0, pixelOnlyCount: 0, bothCount: 0, rejectedCount: 0,
  };

  if (!data || data.length === 0) return empty;

  const delivered = data.filter(e => e.meta_response_status === 200);
  const failed = data.filter(e => e.meta_response_status !== 200 && e.meta_response_status !== 0);
  const withPixel = data.filter(e => e.pixel_also_fired);
  const capiOnly = delivered.filter(e => !e.pixel_also_fired);
  const both = delivered.filter(e => e.pixel_also_fired);

  return {
    eventsTotal: data.length,
    eventsWithEmail: data.filter(e => e.has_email).length,
    eventsWithPhone: data.filter(e => e.has_phone).length,
    eventsWithExternalId: data.filter(e => e.has_external_id).length,
    eventsWithFbp: data.filter(e => e.has_fbp).length,
    eventsWithFbc: data.filter(e => e.has_fbc).length,
    avgEmq: Math.round((data.reduce((s, e) => s + Number(e.emq_estimate || 0), 0) / data.length) * 10) / 10,
    deliverySuccess: delivered.length,
    deliveryFailed: failed.length,
    recoveryCount: capiOnly.length,
    totalValue: data.reduce((s, e) => s + Number(e.value || 0), 0),
    // Observability
    dedupCount: both.length,
    capiOnlyCount: capiOnly.length,
    pixelOnlyCount: withPixel.length - both.length,
    bothCount: both.length,
    rejectedCount: failed.length,
  };
}

export async function fetchGatewayPipeline(period: 'today' | '7d' | '14d' | '30d' = '7d'): Promise<GatewayPipeline> {
  const daysMap = { today: 0, '7d': 7, '14d': 14, '30d': 30 };
  const days = daysMap[period];
  const since = new Date();
  since.setDate(since.getDate() - (days || 1));
  if (period === 'today') since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('gateway_events')
    .select('event_name, value')
    .gte('created_at', since.toISOString());

  if (!data) return { pageviews: 0, viewContent: 0, leads: 0, initiateCheckout: 0, purchases: 0, purchaseValue: 0 };

  return {
    pageviews: data.filter(e => e.event_name === 'PageView').length,
    viewContent: data.filter(e => e.event_name === 'ViewContent').length,
    leads: data.filter(e => e.event_name === 'Lead').length,
    initiateCheckout: data.filter(e => e.event_name === 'InitiateCheckout').length,
    purchases: data.filter(e => e.event_name === 'Purchase').length,
    purchaseValue: data.filter(e => e.event_name === 'Purchase').reduce((s, e) => s + Number(e.value || 0), 0),
  };
}

export async function fetchFunnelConfig(): Promise<FunnelConfig | null> {
  const { data } = await supabase
    .from('funnel_config')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  return data as FunnelConfig | null;
}

export async function saveFunnelConfig(config: Partial<FunnelConfig>): Promise<{ data: FunnelConfig | null; error: string | null }> {
  if (config.id) {
    const { data, error } = await supabase
      .from('funnel_config')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('id', config.id)
      .select()
      .single();
    return { data: data as FunnelConfig | null, error: error?.message || null };
  }

  const { data, error } = await supabase
    .from('funnel_config')
    .insert(config)
    .select()
    .single();
  return { data: data as FunnelConfig | null, error: error?.message || null };
}

export function generateTrackingScript(gatewayUrl: string, funnelId: string): string {
  return `<!-- Ads Optimizer Pro — Signal Gateway v2 -->
<script>
(function(){
"use strict";
var GW="${gatewayUrl}";
var FID="${funnelId}";

// ── Session ID ──
var sid=sessionStorage.getItem("_ao_sid");
if(!sid){sid=crypto.randomUUID?crypto.randomUUID():"s_"+Date.now()+"_"+Math.random().toString(36).substr(2,8);sessionStorage.setItem("_ao_sid",sid)}

// ── Helpers ──
function gc(n){var m=document.cookie.match(new RegExp("(^| )"+n+"=([^;]+)"));return m?m[2]:null}
function sc(n,v,days){document.cookie=n+"="+v+";max-age="+(days*86400)+";path=/;SameSite=Lax;Secure"}
var ps=new URLSearchParams(location.search);

// ── _fbp: read or create fallback (Safari ITP: refresh on every visit) ──
var fbp=gc("_fbp");
if(fbp){sc("_fbp",fbp,90)}
else{fbp="fb.1."+Date.now()+"."+Math.floor(1e10+Math.random()*9e10);sc("_fbp",fbp,90)}

// ── _fbc: from cookie or fbclid (timestamp in ms per Meta spec) ──
var fbc=gc("_fbc");
var _fc=ps.get("fbclid");
if(!fbc&&_fc){fbc="fb.1."+Date.now()+"."+_fc;sc("_fbc",fbc,90)}
else if(fbc){sc("_fbc",fbc,90)}

// ── UTMs: persist in first-party cookie (30d) ──
var _utms={s:ps.get("utm_source"),m:ps.get("utm_medium"),c:ps.get("utm_campaign"),cn:ps.get("utm_content"),t:ps.get("utm_term")};
if(_utms.s){document.cookie="_ao_utm="+encodeURIComponent(JSON.stringify(_utms))+";max-age=2592000;path=/;SameSite=Lax;Secure"}
function _gc_utm(){var m=document.cookie.match(new RegExp("(^| )_ao_utm=([^;]+)"));if(m)try{return JSON.parse(decodeURIComponent(m[2]))}catch(e){}return null}
function getUTM(key){var v=ps.get("utm_"+key);if(v)return v;var c=_gc_utm();if(!c)return null;var map={source:"s",medium:"m",campaign:"c",content:"cn",term:"t"};return c[map[key]]||null}

// ── Cross-domain linker: decorate outbound links with _fbp/_fbc ──
function decorateUrl(url){try{var u=new URL(url,location.origin);if(fbp)u.searchParams.set("_fbp",fbp);if(fbc)u.searchParams.set("_fbc",fbc);var utm=_gc_utm();if(utm){if(utm.s)u.searchParams.set("utm_source",utm.s);if(utm.m)u.searchParams.set("utm_medium",utm.m);if(utm.c)u.searchParams.set("utm_campaign",utm.c);if(utm.cn)u.searchParams.set("utm_content",utm.cn);if(utm.t)u.searchParams.set("utm_term",utm.t)}return u.toString()}catch(e){return url}}
// Recover _fbp/_fbc from URL params (cross-domain inbound)
var _fbp_param=ps.get("_fbp"),_fbc_param=ps.get("_fbc");
if(_fbp_param&&!gc("_fbp")){fbp=_fbp_param;sc("_fbp",fbp,90)}
if(_fbc_param&&!gc("_fbc")){fbc=_fbc_param;sc("_fbc",fbc,90)}

// ── Engagement tracking ──
var st=Date.now(),mx=0,vw=0;
var pv=parseInt(sessionStorage.getItem("_ao_pv")||"0")+1;
sessionStorage.setItem("_ao_pv",pv.toString());

// Session count (localStorage + sessionStorage guard)
var _sc=1;
try{if(!sessionStorage.getItem("_ao_sa")){_sc=parseInt(localStorage.getItem("_ao_sc")||"0")+1;localStorage.setItem("_ao_sc",String(_sc));sessionStorage.setItem("_ao_sa","1")}else{_sc=parseInt(localStorage.getItem("_ao_sc")||"1")}}catch(e){}

window.addEventListener("scroll",function(){var d=document.body.scrollHeight-window.innerHeight;if(d>0){var s=Math.round((window.scrollY/d)*100);if(s>mx)mx=s}},{passive:true});
setTimeout(function(){document.querySelectorAll("video").forEach(function(v){v.addEventListener("timeupdate",function(){if(v.duration>0)vw=Math.max(vw,Math.round((v.currentTime/v.duration)*100))})})},2e3);

// ── Event ID generator ──
function eid(){return"evt_"+Math.floor(Date.now()/1e3)+"_"+Math.random().toString(36).substr(2,8)}

// ── Send event (BrowserEvent format for Supabase collect endpoint) ──
function send(en,cd,id,opts){
var ev={event_name:en,event_source_url:location.href,event_time:Math.floor(Date.now()/1e3),timestamp:Date.now(),event_id:eid(),pixel_fired:typeof fbq!=="undefined",funnel_id:FID,
is_synthetic:!!(opts&&opts.synthetic),
test_event_code:sessionStorage.getItem("_ao_tec")||undefined,
visitor:{fbp:fbp,fbc:fbc,session_id:sid,ip:null,user_agent:navigator.userAgent},
behavior:{scroll_depth:mx,time_on_page:Math.round((Date.now()-st)/1e3),video_watched_pct:vw,pages_viewed:pv,referrer:document.referrer,
utm_source:getUTM("source"),utm_medium:getUTM("medium"),
utm_campaign:getUTM("campaign"),utm_content:getUTM("content"),utm_term:getUTM("term"),
device_type:/Mobi|Android/i.test(navigator.userAgent)?"mobile":/Tablet|iPad/i.test(navigator.userAgent)?"tablet":"desktop",
landing_page:sessionStorage.getItem("_ao_lp")||location.pathname},
conversion:cd||null,identity:id||null};
if(!sessionStorage.getItem("_ao_lp"))sessionStorage.setItem("_ao_lp",location.pathname);

// Send to gateway (Supabase Edge Function)
navigator.sendBeacon?navigator.sendBeacon(GW,new Blob([JSON.stringify(ev)],{type:"application/json"})):fetch(GW,{method:"POST",body:JSON.stringify(ev),headers:{"Content-Type":"application/json"},keepalive:true});

// Fire pixel with same event_id for dedup (skip synthetic)
if(typeof fbq!=="undefined"&&!(opts&&opts.synthetic)){fbq("track",en,cd?{value:cd.value,currency:cd.currency||"BRL",content_name:cd.content_name,content_ids:cd.content_ids}:{},{eventID:ev.event_id})}
return ev.event_id}

// ── Send final engagement on page exit ──
document.addEventListener("visibilitychange",function(){
if(document.visibilityState==="hidden"){send("PageLeave",null,null,{synthetic:true})}
});

// ── Public API ──
window.AdsEdge={
pageView:function(){return send("PageView")},
viewContent:function(n,ids){return send("ViewContent",{content_name:n||document.title,content_ids:ids||null,value:null,currency:"BRL",num_items:null,order_id:null})},
lead:function(e,p,n){var pt=(n||"").split(" ");return send("Lead",null,{email:e||null,phone:p||null,first_name:pt[0]||null,last_name:pt.slice(1).join(" ")||null,external_id:null})},
initiateCheckout:function(v,n,ids){return send("InitiateCheckout",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:1,order_id:null})},
purchase:function(v,oid,n,ids,ni,id){return send("Purchase",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:ni||1,order_id:oid||null},id||null)},
custom:function(en,cd,id){return send(en,cd||null,id||null)},
// Cross-domain: decorate a URL with _fbp/_fbc/UTMs for multi-domain funnels
decorateUrl:decorateUrl,
// Decorate all links to a specific domain
decorateLinks:function(domain){document.querySelectorAll('a[href*="'+domain+'"]').forEach(function(a){a.href=decorateUrl(a.href)})},
// Get current state for debugging
getState:function(){return{fbp:fbp,fbc:fbc,sid:sid,scroll:mx,time:Math.round((Date.now()-st)/1e3),video:vw,pages:pv,sessions:_sc,utms:_gc_utm()}},
// Enable Meta Test Events mode (copy code from Events Manager → Test Events)
enableTestMode:function(code){sessionStorage.setItem("_ao_tec",code);console.log("[AdsEdge] Test mode ON: "+code)},
disableTestMode:function(){sessionStorage.removeItem("_ao_tec");console.log("[AdsEdge] Test mode OFF")}
};

// ── Auto PageView ──
window.AdsEdge.pageView();
})();
<${'/'}script>`;
}
