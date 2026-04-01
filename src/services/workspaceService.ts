import { supabase } from '../lib/supabase';
import type { Workspace, WorkspaceInsert } from '../types/database';

export async function createWorkspace(data: WorkspaceInsert): Promise<Workspace> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar workspace: ${error.message}`);
  return workspace as Workspace;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar workspaces: ${error.message}`);
  return (data ?? []) as Workspace[];
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Erro ao buscar workspace: ${error.message}`);
  }
  return data as Workspace;
}

export async function updateWorkspace(
  id: string,
  data: Partial<WorkspaceInsert>
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update(data)
    .eq('id', id);

  if (error) throw new Error(`Erro ao atualizar workspace: ${error.message}`);
}

/**
 * Generates a self-contained JS tracking snippet for a workspace.
 * The snippet:
 * 1. Captures UTM params from the current URL
 * 2. Stores them in a first-party cookie (_aop_utm)
 * 3. Sends events to configured destinations (Meta CAPI, Google Ads, TikTok, webhook)
 */
export function generateTrackingScript(workspace: Workspace): string {
  const pixelIds: string[] = [];
  if (workspace.pixel_meta_id) pixelIds.push(`meta: "${workspace.pixel_meta_id}"`);
  if (workspace.pixel_google_id) pixelIds.push(`google: "${workspace.pixel_google_id}"`);
  if (workspace.pixel_tiktok_id) pixelIds.push(`tiktok: "${workspace.pixel_tiktok_id}"`);
  if (workspace.pixel_kwai_id) pixelIds.push(`kwai: "${workspace.pixel_kwai_id}"`);

  const enabledEvents = Object.entries(workspace.events_config)
    .filter(([key, val]) => key !== 'custom_events' && val === true)
    .map(([key]) => `"${key}"`)
    .join(', ');

  const customEvents = (workspace.events_config.custom_events ?? [])
    .map((e) => `"${e}"`)
    .join(', ');

  const webhookLine = workspace.destinations.webhook_url
    ? `webhookUrl: "${workspace.destinations.webhook_url}",`
    : '';

  return `<!-- Ads Optimizer Pro Tracking - ${workspace.name} -->
<script>
(function(){
  "use strict";
  var W="${workspace.id}";
  var CFG={
    pixels:{${pixelIds.join(', ')}},
    events:[${enabledEvents}${customEvents ? ', ' + customEvents : ''}],
    destinations:{
      meta_capi:${workspace.destinations.meta_capi},
      google_ads:${workspace.destinations.google_ads},
      tiktok_events:${workspace.destinations.tiktok_events},
      ${webhookLine}
    },
    utmDefaults:{source:"${workspace.utm_source_default}",medium:"${workspace.utm_medium_default}"}
  };

  // --- UTM capture ---
  function getUtms(){
    var p=new URLSearchParams(window.location.search);
    var keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","src","sck"];
    var u={};
    keys.forEach(function(k){if(p.get(k))u[k]=p.get(k);});
    if(!u.utm_source&&CFG.utmDefaults.source)u.utm_source=CFG.utmDefaults.source;
    if(!u.utm_medium&&CFG.utmDefaults.medium)u.utm_medium=CFG.utmDefaults.medium;
    return u;
  }

  // --- Cookie helpers ---
  function setCookie(n,v,d){
    var e=new Date();e.setTime(e.getTime()+d*864e5);
    document.cookie=n+"="+encodeURIComponent(JSON.stringify(v))+";expires="+e.toUTCString()+";path=/;SameSite=Lax";
  }
  function getCookie(n){
    var m=document.cookie.match(new RegExp("(^| )"+n+"=([^;]+)"));
    if(m)try{return JSON.parse(decodeURIComponent(m[2]))}catch(e){return null}
    return null;
  }

  // --- Store UTMs ---
  var utms=getUtms();
  if(Object.keys(utms).length>0)setCookie("_aop_utm",utms,30);

  // --- Event sender ---
  function eid(){return"evt_"+Math.floor(Date.now()/1e3)+"_"+Math.random().toString(36).substr(2,8)}
  function sendEvent(name,params){
    var evId=eid();
    var stored=getCookie("_aop_utm")||{};
    var payload={
      workspace_id:W,
      event:name,
      event_id:evId,
      utms:stored,
      params:params||{},
      url:window.location.href,
      referrer:document.referrer,
      timestamp:new Date().toISOString()
    };

    // Meta Pixel (3-arg form: custom_data, options with eventID)
    if(CFG.destinations.meta_capi&&CFG.pixels.meta&&typeof fbq==="function"){
      fbq("track",name,params||{},{eventID:evId});
    }

    // Google Ads
    if(CFG.destinations.google_ads&&CFG.pixels.google&&typeof gtag==="function"){
      gtag("event",name,params);
    }

    // TikTok
    if(CFG.destinations.tiktok_events&&CFG.pixels.tiktok&&typeof ttq!=="undefined"){
      ttq.track(name,params);
    }

    // Webhook
    if(CFG.destinations.webhookUrl){
      var x=new XMLHttpRequest();
      x.open("POST",CFG.destinations.webhookUrl,true);
      x.setRequestHeader("Content-Type","application/json");
      x.send(JSON.stringify(payload));
    }
  }

  // --- Expose global ---
  window._aop={send:sendEvent,getUtms:function(){return getCookie("_aop_utm")||{};}};

  // --- Auto PageView ---
  sendEvent("page_view",{title:document.title});
})();
</script>`;
}
