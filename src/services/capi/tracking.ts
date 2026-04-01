import type { FunnelConfig, SyntheticEventRule } from '../../types/capi';

/**
 * Gera o tracking script JS que o usuário cola na LP.
 * Script minificado que coleta dados client-side e envia para o backend.
 */
export function generateTrackingScript(config: FunnelConfig, rules: SyntheticEventRule[]): string {
  const enabledRules = rules.filter(r => r.enabled);

  return `<!-- Signal Engine v5 — Tracking Script -->
<script>
(function(){
  "use strict";
  var C={
    pixel:"${config.pixel_id}",
    api:"${config.access_token ? '/api/capi/event' : '{{API_ENDPOINT}}'}",
    funnel:"${config.type}",
    rules:${JSON.stringify(enabledRules.map(r => ({
      n: r.event_name,
      c: r.conditions,
      cd: r.cooldown_hours,
    })), null, 0)}
  };

  // State
  var S={scroll:0,time:0,pages:1,sessions:1,videoP:0,clicks:0};
  var sent={};

  // Helpers
  function uid(){return"evt_"+Math.floor(Date.now()/1e3)+"_"+Math.random().toString(36).substr(2,8)}
  function getCk(n){var m=document.cookie.match(new RegExp("(^| )"+n+"=([^;]+)"));return m?m[2]:null}
  function getParam(n){return new URLSearchParams(location.search).get(n)||""}

  // Persist _fbc cookie from fbclid (timestamp in MILLISECONDS per Meta spec)
  var _fbclid=getParam("fbclid");
  if(_fbclid&&!getCk("_fbc")){var _fbc="fb.1."+Date.now()+"."+_fbclid;document.cookie="_fbc="+_fbc+";max-age=7776000;path=/;SameSite=Lax;Secure"}

  // Persist UTMs in first-party cookie (30 day expiry)
  var _utms={s:getParam("utm_source"),m:getParam("utm_medium"),c:getParam("utm_campaign"),cn:getParam("utm_content"),t:getParam("utm_term")};
  if(_utms.s){document.cookie="_ao_utm="+encodeURIComponent(JSON.stringify(_utms))+";max-age=2592000;path=/;SameSite=Lax;Secure"}
  function getUTM(key){var v=getParam("utm_"+key);if(v)return v;try{var c=JSON.parse(decodeURIComponent(getCk("_ao_utm")||"{}"));var map={source:"s",medium:"m",campaign:"c",content:"cn",term:"t"};return c[map[key]]||""}catch(e){return""}}

  // Scroll tracking (guard against division by zero)
  var maxScroll=0;
  window.addEventListener("scroll",function(){
    var h=document.documentElement;
    var d=h.scrollHeight-h.clientHeight;
    if(d>0){var p=Math.round((window.scrollY/d)*100);if(p>maxScroll){maxScroll=p;S.scroll=p}}
  },{passive:true});

  // Time tracking
  var startTime=Date.now();
  setInterval(function(){S.time=Math.round((Date.now()-startTime)/1000)},1000);

  // Click tracking
  document.addEventListener("click",function(){S.clicks++});

  // Video tracking
  function trackVideo(){
    var videos=document.querySelectorAll("video,iframe[src*=youtube],iframe[src*=vimeo]");
    videos.forEach(function(v){
      if(v.tagName==="VIDEO"){
        v.addEventListener("timeupdate",function(){
          if(v.duration>0){S.videoP=Math.round((v.currentTime/v.duration)*100)}
        });
      }
    });
  }
  if(document.readyState==="complete")trackVideo();
  else window.addEventListener("load",trackVideo);

  // Session count (localStorage with sessionStorage guard to avoid inflation)
  try{
    var sk="se_sessions";
    if(!sessionStorage.getItem("_se_active")){
      S.sessions=parseInt(localStorage.getItem(sk)||"0")+1;
      localStorage.setItem(sk,String(S.sessions));
      sessionStorage.setItem("_se_active","1");
    }else{
      S.sessions=parseInt(localStorage.getItem(sk)||"1");
    }
  }catch(e){}

  // Collect context
  function ctx(){
    return{
      scroll_depth:S.scroll,
      time_on_page:S.time,
      pages_viewed_session:S.pages,
      session_count:S.sessions,
      video_watched_pct:S.videoP,
      clicks_on_page:S.clicks,
      device_type:/Mobi|Android/i.test(navigator.userAgent)?"mobile":/Tablet|iPad/i.test(navigator.userAgent)?"tablet":"desktop",
      browser:navigator.userAgent,
      utm_source:getUTM("source"),
      utm_medium:getUTM("medium"),
      utm_campaign:getUTM("campaign"),
      utm_content:getUTM("content"),
      utm_term:getUTM("term"),
      referrer_url:document.referrer,
      landing_page:location.href,
      fbp:getCk("_fbp")||(function(){var f="fb.1."+Date.now()+"."+Math.floor(1e10+Math.random()*9e10);document.cookie="_fbp="+f+";max-age=7776000;path=/;SameSite=Lax;Secure";return f})(),
      fbc:getCk("_fbc")||(getParam("fbclid")?"fb.1."+Date.now()+"."+getParam("fbclid"):null),
      fbclid:getParam("fbclid")||null
    };
  }

  // Send event — builds CAPI-compliant payload for the Vercel API
  function send(name,extra){
    var eid=uid();
    var c=ctx();
    var isSynthetic=!!(extra&&extra.is_synthetic);

    // Build user_data (identity parameters — NOT hashed client-side, server does it)
    var ud={client_user_agent:navigator.userAgent,fbp:c.fbp||null,fbc:c.fbc||null};
    if(extra&&extra.email)ud.em=extra.email;
    if(extra&&extra.phone)ud.ph=extra.phone;
    if(extra&&extra.external_id)ud.external_id=extra.external_id;
    if(extra&&extra.first_name)ud.fn=extra.first_name;
    if(extra&&extra.last_name)ud.ln=extra.last_name;

    // Build custom_data (engagement + conversion)
    var cd={scroll_depth:c.scroll_depth,time_on_page:c.time_on_page,video_watched:c.video_watched_pct,session_count:c.session_count,device_type:c.device_type,utm_source:c.utm_source||null,utm_medium:c.utm_medium||null,utm_campaign:c.utm_campaign||null,utm_content:c.utm_content||null,utm_term:c.utm_term||null};
    if(extra&&extra.value!=null){cd.value=extra.value;cd.currency=extra.currency||"BRL"}
    if(extra&&extra.content_name)cd.content_name=extra.content_name;
    if(extra&&extra.content_ids)cd.content_ids=extra.content_ids;
    if(extra&&extra.order_id)cd.order_id=extra.order_id;
    if(extra&&extra.num_items)cd.num_items=extra.num_items;

    // CAPI-compliant event
    var evt={event_name:name,event_time:Math.floor(Date.now()/1e3),event_id:eid,event_source_url:location.href,action_source:"website",user_data:ud,custom_data:cd};

    // Full payload matching what api/capi/event.ts expects
    var payload={pixel_id:C.pixel,is_synthetic:isSynthetic,events:[evt]};

    // Fire pixel with same event_id for deduplication (skip synthetic)
    if(window.fbq&&!isSynthetic){
      try{window.fbq("track",name,extra&&extra.value!=null?{value:extra.value,currency:extra.currency||"BRL"}:{},{eventID:eid})}catch(e){}
    }

    // Send to backend via sendBeacon (Vercel serverless function)
    try{
      navigator.sendBeacon(C.api,new Blob([JSON.stringify(payload)],{type:"application/json"}));
    }catch(e){
      var x=new XMLHttpRequest();
      x.open("POST",C.api);
      x.setRequestHeader("Content-Type","application/json");
      x.send(JSON.stringify(payload));
    }

    return eid;
  }

  // Evaluate synthetic rules
  function evalOp(v,op,t){
    switch(op){
      case">=":return Number(v)>=Number(t);
      case"<=":return Number(v)<=Number(t);
      case">":return Number(v)>Number(t);
      case"<":return Number(v)<Number(t);
      case"==":return v===t||String(v)===String(t);
      case"!=":return v!==t;
      default:return false;
    }
  }

  function checkRules(){
    var d=ctx();
    C.rules.forEach(function(r){
      if(sent[r.n])return;
      var pass=r.c.every(function(c){return evalOp(d[c.field],c.operator,c.value)});
      if(pass){
        sent[r.n]=true;
        send(r.n,{is_synthetic:true});
      }
    });
  }

  // Check synthetic rules every 5s
  setInterval(checkRules,5000);

  // Expose global API
  window.SignalEngine={
    send:send,
    getState:function(){return S},
    getContext:ctx,
    // Convenience methods matching gateway AdsEdge API
    pageView:function(){return send("PageView")},
    viewContent:function(n,ids){return send("ViewContent",{content_name:n||document.title,content_ids:ids||null})},
    lead:function(e,p,n){var pt=(n||"").split(" ");return send("Lead",{email:e||null,phone:p||null,first_name:pt[0]||null,last_name:pt.slice(1).join(" ")||null})},
    initiateCheckout:function(v,n,ids){return send("InitiateCheckout",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:1})},
    purchase:function(v,oid,n,ids,ni,id){return send("Purchase",{value:v,currency:"BRL",content_name:n||null,content_ids:ids||null,num_items:ni||1,order_id:oid||null,external_id:id||null})},
    custom:function(en,extra){return send(en,extra||{})}
  };

  // Send final engagement data on page exit
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="hidden"){
      send("PageLeave",{is_synthetic:true});
    }
  });

  // Auto PageView
  send("PageView");
})();
</script>`;
}

/**
 * Gera snippet de instalação simplificado (para copiar).
 */
export function generateInstallSnippet(config: FunnelConfig): string {
  return `<!-- Cole antes do </body> da sua LP -->
<script src="https://app.adsoptimizer.pro/se/${config.pixel_id}/tracker.js" async></script>`;
}
