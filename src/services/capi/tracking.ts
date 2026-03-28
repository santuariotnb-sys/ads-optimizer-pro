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
  function getCk(n){var m=document.cookie.match(new RegExp("(^| )"+n+"=([^;]+)"));return m?m[2]:""}
  function getParam(n){return new URLSearchParams(location.search).get(n)||""}

  // Scroll tracking
  var maxScroll=0;
  window.addEventListener("scroll",function(){
    var h=document.documentElement;
    var p=Math.round((window.scrollY/(h.scrollHeight-h.clientHeight))*100);
    if(p>maxScroll){maxScroll=p;S.scroll=p}
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

  // Session count (localStorage)
  try{
    var sk="se_sessions";
    S.sessions=parseInt(localStorage.getItem(sk)||"0")+1;
    localStorage.setItem(sk,String(S.sessions));
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
      utm_source:getParam("utm_source"),
      utm_medium:getParam("utm_medium"),
      utm_campaign:getParam("utm_campaign"),
      utm_content:getParam("utm_content"),
      utm_term:getParam("utm_term"),
      referrer_url:document.referrer,
      landing_page:location.href,
      fbp:getCk("_fbp"),
      fbc:getCk("_fbc")||getParam("fbclid"),
      fbclid:getParam("fbclid")
    };
  }

  // Send event
  function send(name,extra){
    var eid=uid();
    var data=Object.assign({event_name:name,event_id:eid,event_source_url:location.href},ctx(),extra||{});

    // Also fire pixel event with same event_id for deduplication
    if(window.fbq){
      try{window.fbq("track",name,{eventID:eid})}catch(e){}
    }

    // Send to backend
    try{
      navigator.sendBeacon(C.api,JSON.stringify(data));
    }catch(e){
      var x=new XMLHttpRequest();
      x.open("POST",C.api);
      x.setRequestHeader("Content-Type","application/json");
      x.send(JSON.stringify(data));
    }
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
  window.SignalEngine={send:send,getState:function(){return S},getContext:ctx};

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
