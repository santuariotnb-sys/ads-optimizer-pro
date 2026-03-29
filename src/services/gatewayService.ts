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

  if (!data || data.length === 0) {
    return {
      eventsTotal: 0, eventsWithEmail: 0, eventsWithPhone: 0,
      eventsWithExternalId: 0, eventsWithFbp: 0, eventsWithFbc: 0,
      avgEmq: 0, deliverySuccess: 0, deliveryFailed: 0,
      recoveryCount: 0, totalValue: 0,
    };
  }

  return {
    eventsTotal: data.length,
    eventsWithEmail: data.filter(e => e.has_email).length,
    eventsWithPhone: data.filter(e => e.has_phone).length,
    eventsWithExternalId: data.filter(e => e.has_external_id).length,
    eventsWithFbp: data.filter(e => e.has_fbp).length,
    eventsWithFbc: data.filter(e => e.has_fbc).length,
    avgEmq: Math.round((data.reduce((s, e) => s + Number(e.emq_estimate || 0), 0) / data.length) * 10) / 10,
    deliverySuccess: data.filter(e => e.meta_response_status === 200).length,
    deliveryFailed: data.filter(e => e.meta_response_status !== 200).length,
    recoveryCount: data.filter(e => !e.pixel_also_fired).length,
    totalValue: data.reduce((s, e) => s + Number(e.value || 0), 0),
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
  return `<!-- Ads Optimizer Pro — Signal Gateway -->
<script>
(function(){
"use strict";
var GW="${gatewayUrl}";
var FID="${funnelId}";
var sid=sessionStorage.getItem("_ao_sid");
if(!sid){sid=crypto.randomUUID?crypto.randomUUID():"s_"+Date.now()+"_"+Math.random().toString(36).substr(2,8);sessionStorage.setItem("_ao_sid",sid)}
function gc(n){var m=document.cookie.match(new RegExp("(^| )"+n+"=([^;]+)"));return m?m[2]:null}
var fbp=gc("_fbp"),fbc=gc("_fbc");
if(!fbc){var p=new URLSearchParams(location.search),fc=p.get("fbclid");if(fc){fbc="fb.1."+Date.now()+"."+fc;document.cookie="_fbc="+fbc+";max-age=7776000;path=/"}}
var st=Date.now(),mx=0,pv=parseInt(sessionStorage.getItem("_ao_pv")||"0")+1;
sessionStorage.setItem("_ao_pv",pv.toString());
window.addEventListener("scroll",function(){var s=Math.round((window.scrollY/(document.body.scrollHeight-window.innerHeight))*100);if(s>mx)mx=s});
var vw=0;
setTimeout(function(){document.querySelectorAll("video").forEach(function(v){v.addEventListener("timeupdate",function(){if(v.duration>0)vw=Math.max(vw,Math.round((v.currentTime/v.duration)*100))})})},2e3);
function eid(){return"evt_"+Date.now()+"_"+Math.random().toString(36).substr(2,8)}
function send(en,cd,id){
var ev={event_name:en,event_source_url:location.href,timestamp:Date.now(),event_id:eid(),pixel_fired:typeof fbq!=="undefined",funnel_id:FID,
visitor:{fbp:fbp,fbc:fbc,session_id:sid,ip:null,user_agent:navigator.userAgent},
behavior:{scroll_depth:mx,time_on_page:Math.round((Date.now()-st)/1e3),video_watched_pct:vw,pages_viewed:pv,referrer:document.referrer,
utm_source:new URLSearchParams(location.search).get("utm_source"),utm_medium:new URLSearchParams(location.search).get("utm_medium"),
utm_campaign:new URLSearchParams(location.search).get("utm_campaign"),utm_content:new URLSearchParams(location.search).get("utm_content"),
device_type:/Mobi|Android/i.test(navigator.userAgent)?"mobile":/Tablet|iPad/i.test(navigator.userAgent)?"tablet":"desktop",
landing_page:sessionStorage.getItem("_ao_lp")||location.pathname},
conversion:cd||null,identity:id||null};
if(!sessionStorage.getItem("_ao_lp"))sessionStorage.setItem("_ao_lp",location.pathname);
navigator.sendBeacon?navigator.sendBeacon(GW,JSON.stringify(ev)):fetch(GW,{method:"POST",body:JSON.stringify(ev),keepalive:true});
if(typeof fbq!=="undefined"){fbq("track",en,cd?{value:cd.value,currency:cd.currency||"BRL",content_name:cd.content_name,content_ids:cd.content_ids}:{},{eventID:ev.event_id})}
return ev.event_id}
window.AdsEdge={
pageView:function(){send("PageView")},
viewContent:function(n,ids){send("ViewContent",{content_name:n||document.title,content_ids:ids||null,value:null,currency:"BRL",num_items:null,order_id:null})},
lead:function(e,p,n){var pt=(n||"").split(" ");send("Lead",null,{email:e||null,phone:p||null,first_name:pt[0]||null,last_name:pt.slice(1).join(" ")||null,external_id:null})},
initiateCheckout:function(v,n,ids){send("InitiateCheckout",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:1,order_id:null})},
purchase:function(v,oid,n,ids,ni,id){send("Purchase",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:ni||1,order_id:oid||null},id||null)},
custom:function(en,cd,id){send(en,cd||null,id||null)}
};
window.AdsEdge.pageView();
})();
<${'/'}script>`;
}
