(() => {
  "use strict";
  // Standalone multiplayer experience: never inject shell UI or its loader here.
  if (location.pathname === "/games/excruciating-phone" || location.pathname.startsWith("/games/excruciating-phone/")) return;
  if (window.__excruciatingGameShellLoaded) return;
  window.__excruciatingGameShellLoaded = true;

  const styles = document.createElement("style");
  styles.textContent = `
    #c2canvasdiv { transform: scale(1.08); transform-origin: center center; }
    #excruciating-game-controls {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      left: max(14px, env(safe-area-inset-left));
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 7px;
      pointer-events: none;
    }
    .excruciating-game-control {
      position: relative;
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 13px 0 11px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 12px;
      background: rgba(12,12,14,.88);
      color: #fff;
      font: 600 14px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: .01em;
      box-shadow: 0 5px 22px rgba(0,0,0,.28);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      cursor: pointer;
      touch-action: manipulation;
      transition: background .16s ease, border-color .16s ease, transform .16s ease;
    }
    #excruciating-games-back { text-decoration: none; width:40px; height:40px; padding:0; justify-content:center; }
    #excruciating-game-chat-toggle { width:40px; height:40px; padding:0; justify-content:center; }
    .excruciating-game-control:hover {
      background: rgba(32,32,36,.96);
      border-color: rgba(255,255,255,.3);
      transform: translateY(-1px);
    }
    .excruciating-game-control:active { transform: translateY(0); }
    .excruciating-game-control svg { width: 17px; height: 17px; flex: none; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    #excruciating-game-chat {
      position: fixed;
      z-index: 2147483647;
      right: max(14px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      width: min(420px, calc(100vw - 28px));
      height: min(680px, calc(100dvh - 86px));
      min-height: 300px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 16px;
      background: #101010;
      box-shadow: 0 18px 70px #000c;
    }
    #excruciating-game-chat[hidden], #excruciating-touch-controls[hidden] { display: none; }
    #excruciating-game-chat-heading { height: 44px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:0 13px; color:#fff; font:600 13px/1 system-ui,sans-serif; border-bottom:1px solid #282828; }
    #excruciating-game-chat-close { border:0; background:none; color:#aaa; font:400 24px/1 system-ui,sans-serif; cursor:pointer; }
    #excruciating-game-chat-frame { width:100%; flex:1; min-height:0; border:0; background:#101010; }
    #excruciating-controls-toggle, #excruciating-controls-move { display:none; }
    #excruciating-touch-controls {
      position:fixed; z-index:2147483646; inset:auto 0 max(12px,env(safe-area-inset-bottom));
      display:flex; align-items:flex-end; justify-content:space-between; gap:12px;
      width:100%; box-sizing:border-box; padding:10px max(16px,env(safe-area-inset-right)) 10px max(16px,env(safe-area-inset-left));
      border:0; border-radius:0; background:transparent; box-shadow:none;
      pointer-events:none; touch-action:none; user-select:none; -webkit-user-select:none;
    }
    .excruciating-control-left,.excruciating-control-right { display:flex; align-items:flex-end; gap:10px; pointer-events:none; }
    .excruciating-control-right { margin-left:auto; justify-content:flex-end; }
    .excruciating-stick { position:relative; width:clamp(112px,18vw,154px); aspect-ratio:1; flex:none; border:2px solid rgba(255,255,255,.25); border-radius:50%; background:rgba(10,12,16,.48); box-shadow:0 5px 24px #0005; pointer-events:auto; touch-action:none; }
    .excruciating-stick:before { content:""; position:absolute; inset:24%; border:1px solid #ffffff25; border-radius:50%; }
    .excruciating-stick-knob { position:absolute; left:50%; top:50%; width:42%; aspect-ratio:1; border:1px solid #ffffff66; border-radius:50%; background:#ffffff30; transform:translate(-50%,-50%); pointer-events:none; }
    .excruciating-control-left .excruciating-dpad { pointer-events:auto; }
    .excruciating-control-right .excruciating-actions { pointer-events:auto; }
    #excruciating-touch-controls .excruciating-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; max-width:min(42vw,260px); }
    #excruciating-touch-controls .excruciating-actions button { min-width:52px; min-height:52px; padding:6px; }
    #excruciating-touch-controls .excruciating-dpad { grid-template-columns:repeat(3,42px); grid-template-rows:repeat(3,42px); }
    #excruciating-touch-controls button { pointer-events:auto; }
    #excruciating-touch-controls[hidden] { display:none!important; }
    .excruciating-dpad { display:grid; grid-template-columns:repeat(3,48px); grid-template-rows:repeat(3,48px); gap:4px; }
    .excruciating-dpad button,.excruciating-actions button { border:1px solid rgba(255,255,255,.25); border-radius:13px; background:rgba(35,35,39,.8); color:#fff; font:700 15px/1 system-ui,sans-serif; touch-action:none; user-select:none; -webkit-user-select:none; }
    .excruciating-dpad button[data-direction="up"] { grid-column:2; grid-row:1; }
    .excruciating-dpad button[data-direction="left"] { grid-column:1; grid-row:2; }
    .excruciating-dpad button[data-direction="right"] { grid-column:3; grid-row:2; }
    .excruciating-dpad button[data-direction="down"] { grid-column:2; grid-row:3; }
    .excruciating-dpad button:active,.excruciating-actions button:active { background:rgba(255,255,255,.28); }
    .excruciating-actions { display:grid; grid-template-columns:repeat(2,58px); gap:7px; }
    .excruciating-actions button { min-height:54px; font-size:11px; letter-spacing:.04em; }
    #excruciating-eagler-look-surface { position:fixed; z-index:2147483644; top:max(58px,env(safe-area-inset-top)); right:0; bottom:0; width:54vw; touch-action:none; user-select:none; -webkit-user-select:none; }
    #excruciating-eagler-look-surface[hidden] { display:none; }
    #excruciating-eagler-look-surface::after { content:"Drag here to look"; position:absolute; top:12px; right:14px; padding:5px 9px; border-radius:9px; background:rgba(0,0,0,.25); color:rgba(255,255,255,.68); font:11px/1.2 system-ui,sans-serif; pointer-events:none; }
    #excruciating-touch-controls.eagler-controls { left:0; right:0; bottom:max(12px,env(safe-area-inset-bottom)); width:100%; justify-content:space-between; align-items:flex-end; gap:12px; padding:10px max(14px,env(safe-area-inset-right)) 10px max(14px,env(safe-area-inset-left)); border:0; border-radius:0; background:transparent; box-shadow:none; pointer-events:none; }
    .eagler-stick { position:relative; width:clamp(132px,18vw,174px); aspect-ratio:1; flex:none; border:2px solid rgba(255,255,255,.22); border-radius:50%; background:rgba(9,10,12,.48); box-shadow:0 4px 22px rgba(0,0,0,.24); touch-action:none; pointer-events:auto; }
    .eagler-stick::before { content:""; position:absolute; inset:25%; border:1px solid rgba(255,255,255,.14); border-radius:50%; }
    .eagler-stick-knob { position:absolute; left:50%; top:50%; width:42%; aspect-ratio:1; border:1px solid rgba(255,255,255,.4); border-radius:50%; background:rgba(255,255,255,.19); transform:translate(-50%,-50%); pointer-events:none; }
    .eagler-touch-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; pointer-events:none; }
    .eagler-action-grid { display:grid; grid-template-columns:repeat(4,clamp(48px,6.5vw,68px)); gap:7px; pointer-events:auto; }
    .eagler-hotbar { display:grid; grid-template-columns:repeat(9,minmax(28px,1fr)); width:min(54vw,540px); gap:4px; pointer-events:auto; }
    .eagler-action-grid button,.eagler-hotbar button { min-width:0; min-height:clamp(44px,6.5vw,60px); padding:4px; border:1px solid rgba(255,255,255,.3); border-radius:12px; background:rgba(22,23,27,.78); color:#fff; font:700 clamp(9px,1.25vw,12px)/1.1 system-ui,sans-serif; touch-action:none; user-select:none; -webkit-user-select:none; box-shadow:0 4px 18px rgba(0,0,0,.2); }
    .eagler-hotbar button { min-height:36px; border-radius:8px; font-size:12px; }
    .eagler-action-grid button:active,.eagler-hotbar button:active { background:rgba(255,255,255,.3); }
    @media (max-width: 520px) {
      #excruciating-game-controls { top: max(9px, env(safe-area-inset-top)); left: max(9px, env(safe-area-inset-left)); gap:5px; }
      .excruciating-game-control { min-height:38px; padding:0 10px; font-size:12px; }
      #excruciating-game-chat { top:0;right:0;bottom:0;left:0;width:100vw;height:100dvh;min-height:0;border:0;border-radius:0; }
      #excruciating-game-chat-heading { padding-top:env(safe-area-inset-top); height:calc(48px + env(safe-area-inset-top)); }
      #excruciating-game-chat-close { padding-right:max(0px, env(safe-area-inset-right)); }
      #excruciating-controls-toggle, #excruciating-controls-move { display:inline-flex; }
      #excruciating-touch-controls { left:0;right:0;bottom:max(7px,env(safe-area-inset-bottom));width:100%;padding:6px max(8px,env(safe-area-inset-right)) 6px max(8px,env(safe-area-inset-left)); }
      .excruciating-dpad { grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);gap:3px; }
      .excruciating-actions { grid-template-columns:repeat(2,48px);gap:5px; }
      .excruciating-actions button { min-height:48px;font-size:10px; }
      #excruciating-touch-controls.eagler-controls { left:0;right:0;bottom:max(7px,env(safe-area-inset-bottom));gap:8px;padding:6px max(7px,env(safe-area-inset-right)) 6px max(7px,env(safe-area-inset-left)); }
      .eagler-stick { width:clamp(112px,20vw,150px); }
      .eagler-action-grid { grid-template-columns:repeat(4,clamp(42px,7vw,56px));gap:5px; }
      .eagler-action-grid button { min-height:48px;font-size:9px; }
      .eagler-hotbar { width:min(58vw,460px);gap:3px; }
      .eagler-hotbar button { min-height:32px;font-size:11px; }
      #excruciating-eagler-look-surface { width:58vw; }
    }
    @media (max-width: 680px) { .eagler-action-grid { grid-template-columns:repeat(3,clamp(40px,13vw,52px)); } .eagler-hotbar { width:min(62vw,360px); } }
    @media (hover:none) and (pointer:coarse) { #excruciating-controls-toggle, #excruciating-controls-move { display:inline-flex; } }
    #excruciating-touch-controls.is-moving { cursor:move; outline:1px dashed rgba(255,255,255,.72); outline-offset:5px; }
    #excruciating-touch-controls.is-moving button { pointer-events:none; }
    @media (prefers-reduced-motion:reduce) { .excruciating-game-control { transition:none; } }
  `;
  document.head.append(styles);
  const loaderStyle=document.createElement("style");
  loaderStyle.textContent='#excruciating-loader{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:#080808;color:#f5f5f5;font-family:system-ui,sans-serif;transition:opacity .35s ease,visibility .35s ease}#excruciating-loader.is-done{opacity:0;visibility:hidden;pointer-events:none}#excruciating-loader .inner{width:min(320px,calc(100vw - 52px));text-align:center}#excruciating-loader .brand{font-size:23px;font-weight:850;letter-spacing:-1px;margin-bottom:12px}#excruciating-loader .brand b{margin-right:7px}#excruciating-loader .game-title{margin:0 0 24px;color:#aaa;font-size:12px;font-weight:600;letter-spacing:.04em}#excruciating-loader .track{height:3px;border-radius:9px;background:#242424;overflow:hidden}#excruciating-loader .fill{height:100%;width:4%;background:#fff;transition:width .2s ease}#excruciating-loader .status{margin-top:11px;color:#777;font-size:10px;letter-spacing:.5px}';
  document.head.append(loaderStyle);
const gameShellUiStyle=document.createElement("style");
  gameShellUiStyle.textContent="#excruciating-chat-unread{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;display:grid;place-items:center;border:2px solid #080808;border-radius:99px;background:#eee;color:#111;font:700 9px/1 system-ui,sans-serif}#excruciating-chat-unread[hidden]{display:none!important}.excruciating-loader-retry{margin-top:18px;padding:10px 16px;border:1px solid #444;border-radius:8px;background:#222;color:#fff;font:600 12px system-ui,sans-serif;cursor:pointer}.excruciating-loader-retry:hover{background:#333}";
  document.head.append(gameShellUiStyle);  function showLoadingScreen(){
    if(document.getElementById("excruciating-loader"))return;
    const overlay=document.createElement("div");
    overlay.id="excruciating-loader";
    overlay.setAttribute("role","status");
    overlay.setAttribute("aria-live","polite");
    overlay.innerHTML='<div class="inner"><div class="brand"><b>&gt;</b>excruciating</div><div class="game-title"></div><div class="track" role="progressbar" aria-label="Loading game" aria-valuemin="0" aria-valuemax="100" aria-valuenow="4"><div class="fill"></div></div><div class="status">LOADING GAME</div></div>';
    const gameTitle=String(document.querySelector("#game[aria-label],#game_frame[aria-label]")?.getAttribute("aria-label")||document.title||"Game").trim().slice(0,90)||"Game";
    overlay.querySelector(".game-title").textContent=gameTitle;
    overlay.querySelector(".status").textContent="LOADING "+gameTitle.toLocaleUpperCase();
    overlay.querySelector(".track").setAttribute("aria-label","Loading "+gameTitle);
    (document.body||document.documentElement).append(overlay);
    const fill=overlay.querySelector(".fill"),track=overlay.querySelector(".track");
    const undertale=/(?:^|\/)undertale(?:\/|$)/i.test(location.pathname);
    if(undertale){
      let progress=4;
      const timer=setInterval(()=>{progress=Math.min(92,progress+(progress<65?3:1));fill.style.width=progress+"%";track.setAttribute("aria-valuenow",String(progress));},180);
      const finish=()=>{clearInterval(timer);fill.style.width="100%";track.setAttribute("aria-valuenow","100");overlay.classList.add("is-done");setTimeout(()=>overlay.remove(),420);};
      window.addEventListener("load",finish,{once:true});
      if(document.readyState==="complete")finish();
      setTimeout(()=>{if(document.readyState==="complete")finish();},12000);
      return;
    }
    const status=overlay.querySelector(".status"),startedAt=Date.now();
    const requiresExplicitLoad = /^\/games\/henry-(?:breaking-the-bank|escaping-the-prison|stealing-the-diamond|infiltrating-the-airship|fleeing-the-complex)(?:\/|$)/.test(location.pathname) || document.body?.dataset.excruciatingLoader === "explicit";
    let progress=4,loaded=document.readyState==="complete",stableSince=0,finished=false,errorShown=false;
    const isVisible=element=>{
      if(!element)return false;
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();
      return style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity||1)>0.05&&rect.width>24&&rect.height>24;
    };
    const hasVisibleGame=()=>{
      if(window.ExcruciatingGameReady===true)return true;
      const surfaces=[...document.querySelectorAll("canvas,ruffle-player,video,iframe,object,embed,#ruffle,#unity-container,#game-container,[data-game-ready='true'],[data-game-status='ready']")];
      if(surfaces.some(isVisible))return true;
      const roots=[...document.querySelectorAll("#game,#game_frame,.game-root,[data-game-root]")];
      return roots.some(root=>isVisible(root)&&(root.querySelector("canvas,video,iframe,button,[role='button'],[data-game-ready='true']")||String(root.textContent||"").trim().length>24));
    };
    const explicitLoaderActive=()=>{
      const candidates=[...document.querySelectorAll("#loading,.loading,.loading-screen,.loading-overlay,[aria-busy='true']")];
      return candidates.some(element=>element.id!=="excruciating-loader"&&isVisible(element)&&/loading|downloading|starting|initializing|cached/i.test(element.textContent||""));
    };
    const ready=()=>{
      if(requiresExplicitLoad) return window.ExcruciatingGameReady === true;
      if(!loaded)return false;
      if(explicitLoaderActive())return false;
      return hasVisibleGame();
    };
    const stop=()=>{
      if(finished)return;
      finished=true;
      clearInterval(progressTimer);
      observer?.disconnect();
    };
    const finish=()=>{
      if(finished)return;
      stop();
      fill.style.width="100%";
      track.setAttribute("aria-valuenow","100");
      status.textContent="READY";
      overlay.classList.add("is-done");
      setTimeout(()=>overlay.remove(),420);
    };
    const showLoadError=()=>{
      if(errorShown||finished)return;
      errorShown=true;
      status.textContent="The game is taking longer than expected. Check your connection, then reload.";
      const retry=document.createElement("button");
      retry.type="button";
      retry.className="excruciating-loader-retry";
      retry.textContent="Reload game";
      retry.addEventListener("click",()=>location.reload());
      overlay.querySelector(".inner").append(retry);
      clearInterval(progressTimer);
    };
    const check=()=>{
      if(finished)return;
      if(requiresExplicitLoad && window.ExcruciatingGameLoadFailed){
        showLoadError();
        return;
      }
      if(ready()){
        if(!stableSince)stableSince=Date.now();
        if(Date.now()-stableSince>=750)finish();
      }else stableSince=0;
      const elapsed=Date.now()-startedAt;
      if(elapsed>15000&&!errorShown)status.textContent="Loading game…";
      if(elapsed>90000)showLoadError();
    };
    const progressTimer=setInterval(()=>{
      if(!finished){
        progress=Math.min(94,progress+(progress<65?2:0.7));
        fill.style.width=progress+"%";
        track.setAttribute("aria-valuenow",String(Math.round(progress)));
      }
    },180);
    const observer=new MutationObserver(check);
    observer.observe(document.body||document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","style","hidden"]});
    window.addEventListener("load",()=>{loaded=true;check();},{once:true});
    window.addEventListener("excruciating:game-ready",check);
    window.addEventListener("excruciating:game-failed",check);
    if(loaded)check();
    const poll=setInterval(()=>{check();if(finished)clearInterval(poll);},200);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showLoadingScreen,{once:true});else showLoadingScreen();
  const back = document.createElement("a");
  back.id = "excruciating-games-back";
  back.href = "/";
  back.setAttribute("aria-label", "Back to Games");
  back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18 9 12l6-6M9 12h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  back.className = "excruciating-game-control";
  back.addEventListener("click", event => {
    if (window.parent === window) return;
    event.preventDefault();
    try { window.parent.postMessage({ type: "excruciating:exit-game" }, location.origin); } catch (_) {}
    setTimeout(() => { if (window.parent !== window && !document.hidden) location.assign("/"); }, 900);
  });

  let unreadDirectMessages=0,unreadPublicMessages=0;
  const chatToggle = document.createElement("button");
  chatToggle.id = "excruciating-game-chat-toggle";
  chatToggle.type = "button";
  chatToggle.className = "excruciating-game-control";
  setChatToggleLabel(false);
  chatToggle.setAttribute("aria-expanded", "false");
  chatToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.8-3A7.5 7.5 0 1 1 20 11.5Z"/></svg>';

  const controlsToggle = document.createElement("button");
  controlsToggle.id = "excruciating-controls-toggle";
  controlsToggle.type = "button";
  controlsToggle.className = "excruciating-game-control";
  controlsToggle.setAttribute("aria-expanded", "false");
  controlsToggle.setAttribute("aria-controls", "excruciating-touch-controls");
  controlsToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5H5v3M16 5h3v3M5 16v3h3M19 16v3h-3"/><path d="M9 9h6v6H9z"/></svg>';
  controlsToggle.setAttribute("aria-label", "Show controls");
  controlsToggle.title = "Show controls";

  const moveToggle = document.createElement("button");
  moveToggle.id = "excruciating-controls-move";
  moveToggle.type = "button";
  moveToggle.className = "excruciating-game-control";
  moveToggle.setAttribute("aria-pressed", "false");
  moveToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M8 8l4-5 4 5M8 16l4 5 4-5"/></svg>';
  moveToggle.setAttribute("aria-label", "Move controls");
  moveToggle.title = "Move controls";

  const isNativeTouchGame = /(?:^|\/)(?:mahjong-link|water-sort|mini-golf|sudoku|aquapark-slides|crossyroad|fruitninja|tiny-fishing|papas-pizzeria|bitlife|draw-the-hill|fnaf-[1-4]|ctr|paperio2|google-feud|henry-breaking-the-bank|henry-escaping-the-prison|henry-stealing-the-diamond|henry-infiltrating-the-airship|henry-fleeing-the-complex)(?:\/|$)/i.test(location.pathname);
  const toolbar = document.createElement("div");
  toolbar.id = "excruciating-game-controls";
  toolbar.append(back, chatToggle);
  if (!isNativeTouchGame && matchMedia("(hover:none) and (pointer:coarse)").matches) toolbar.append(controlsToggle, moveToggle);
  document.body.append(toolbar);

  const chatPanel = document.createElement("section");
  chatPanel.id = "excruciating-game-chat";
  chatPanel.hidden = true;
  chatPanel.setAttribute("aria-label", "Chat");
  chatPanel.innerHTML = '<div id="excruciating-game-chat-heading"><strong>Chat</strong><button id="excruciating-game-chat-close" type="button" aria-label="Close chat">×</button></div><iframe id="excruciating-game-chat-frame" title="Chat" loading="eager" referrerpolicy="same-origin"></iframe>';
  document.body.append(chatPanel);
  const chatFrame = chatPanel.querySelector("iframe");
  chatFrame.src = new URL("/?chat=embedded", location.origin).href;
  const chatUnreadBadge=document.createElement("span");
  chatUnreadBadge.id="excruciating-chat-unread";
  chatUnreadBadge.hidden=true;
  chatUnreadBadge.setAttribute("aria-hidden","true");
  chatToggle.append(chatUnreadBadge);
  function setChatToggleLabel(open){
    chatToggle.setAttribute("aria-label",(open?"Close chat":"Open chat")+(unreadDirectMessages?", "+unreadDirectMessages+" unread direct messages":""));
  }
  function updateChatBadge(){const count=unreadDirectMessages+unreadPublicMessages;chatUnreadBadge.hidden=count===0;chatUnreadBadge.textContent=count>99?"99+":String(count);setChatToggleLabel(!chatPanel.hidden);}
  function updateChatUnread(count){unreadDirectMessages=Math.max(0,Number(count)||0);updateChatBadge();}
  function closeGameChat() {
    chatPanel.hidden = true;
    chatToggle.setAttribute("aria-expanded", "false");
    setChatToggleLabel(false);
  }
  chatToggle.addEventListener("click", () => {
    const opening = chatPanel.hidden;
    chatPanel.hidden = !opening;
    chatToggle.setAttribute("aria-expanded", String(opening));
    setChatToggleLabel(opening);
    if (opening && !chatFrame.src) chatFrame.src = new URL("/?chat=embedded", location.origin).href;
    if (opening) setTimeout(() => chatFrame.focus(), 50);
  });
  chatPanel.querySelector("#excruciating-game-chat-close").addEventListener("click", closeGameChat);
  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== chatFrame.contentWindow) return;
    if (event.data?.type === "excruciating:close-game-chat") closeGameChat();
    if (event.data?.type === "excruciating:dm-unread") updateChatUnread(event.data.count);
    if (event.data?.type === "excruciating:chat-unread") { unreadPublicMessages=Math.max(0,Number(event.data.count)||0);updateChatBadge(); }
    if (event.data?.type === "excruciating:open-account") {
      const next = location.pathname + location.search + location.hash;
      location.assign("/account/?next=" + encodeURIComponent(next));
    }
  });

  const touchControls = document.createElement("div");
  touchControls.id = "excruciating-touch-controls";
  const isEaglerGame = /(?:^|\/)eaglerfaithful(?:\/|$)/.test(location.pathname);
  const isFunkinGame = /(?:^|\/)fridaynightfunkin(?:\/|$)/.test(location.pathname);
  const isUndertaleGame = /(?:^|\/)undertale(?:\/|$)/i.test(location.pathname);
  const isBadTimeGame = /(?:^|\/)bad-time-simulator(?:\/|$)/i.test(location.pathname);
  const isSlopeGame = /(?:^|\/)slope(?:\/|$)/i.test(location.pathname);
  const isUndertaleControls = isUndertaleGame || isBadTimeGame;
  const touchDevice = matchMedia("(hover:none) and (pointer:coarse)").matches;
  // These games provide their own touch controls; do not overlay a competing control scheme.
  touchControls.hidden = !isEaglerGame || !touchDevice;
  touchControls.classList.toggle("eagler-controls", isEaglerGame);
  touchControls.classList.toggle("fnf-controls", isFunkinGame);
  touchControls.setAttribute("aria-label", isEaglerGame ? "Eaglercraft touch controls" : isFunkinGame ? "Friday Night Funkin touch controls" : "Optional touch game controls");
  touchControls.innerHTML = isEaglerGame
    ? '<div id="excruciating-eagler-stick" class="eagler-stick" role="application" aria-label="Move with the left stick"><span class="eagler-stick-knob"></span></div><div class="eagler-touch-right"><div class="eagler-action-grid" aria-label="Minecraft actions"><button type="button" data-keys="Space" aria-label="Jump">Jump</button><button type="button" data-keys="Control" aria-label="Sprint">Sprint</button><button type="button" data-keys="Shift" aria-label="Sneak">Sneak</button><button type="button" data-keys="e,KeyE" aria-label="Open inventory">Bag</button><button type="button" data-mouse="0" aria-label="Mine or attack">Mine</button><button type="button" data-mouse="2" aria-label="Place or use">Use</button><button type="button" data-keys="t" aria-label="Open chat">Chat</button><button type="button" data-keys="Escape" aria-label="Pause or close menu">Menu</button></div><div class="eagler-hotbar" aria-label="Choose hotbar slot">' + Array.from({length:9},(_,i)=>'<button type="button" data-keys="'+(i+1)+'" aria-label="Select hotbar slot '+(i+1)+'">'+(i+1)+'</button>').join("") + '</div></div>'
    : isUndertaleControls
      ? '<div class="excruciating-dpad" aria-label="Movement"><button type="button" data-keys="ArrowUp" data-direction="up" aria-label="Move up">↑</button><button type="button" data-keys="ArrowLeft" data-direction="left" aria-label="Move left">←</button><button type="button" data-keys="ArrowRight" data-direction="right" aria-label="Move right">→</button><button type="button" data-keys="ArrowDown" data-direction="down" aria-label="Move down">↓</button></div><div class="excruciating-actions" aria-label="Undertale actions"><button type="button" data-keys="z,KeyZ" aria-label="Confirm">Z</button><button type="button" data-keys="x,KeyX" aria-label="Cancel">X</button><button type="button" data-keys="Shift" aria-label="Focus or slow">Shift</button></div>'
      : isFunkinGame
        ? '<div class="excruciating-dpad" aria-label="Rhythm notes"><button type="button" data-keys="ArrowUp" data-direction="up" aria-label="Up note">↑</button><button type="button" data-keys="ArrowLeft" data-direction="left" aria-label="Left note">←</button><button type="button" data-keys="ArrowRight" data-direction="right" aria-label="Right note">→</button><button type="button" data-keys="ArrowDown" data-direction="down" aria-label="Down note">↓</button></div><div class="excruciating-actions" aria-label="Menu controls"><button type="button" data-keys="Enter">Accept<br>Enter</button><button type="button" data-keys="Escape">Back<br>Esc</button></div>'
        : isSlopeGame
          ? '<div class="excruciating-actions" aria-label="Steering"><button type="button" data-keys="ArrowLeft,a" aria-label="Steer left">LEFT</button><button type="button" data-keys="ArrowRight,d" aria-label="Steer right">RIGHT</button></div>'
          : '<div class="excruciating-dpad" aria-label="Movement"><button type="button" data-keys="ArrowUp,w" data-direction="up" aria-label="Move up">↑</button><button type="button" data-keys="ArrowLeft,a" data-direction="left" aria-label="Move left">←</button><button type="button" data-keys="ArrowRight,d" data-direction="right" aria-label="Move right">→</button><button type="button" data-keys="ArrowDown,s" data-direction="down" aria-label="Move down">↓</button></div><div class="excruciating-actions" aria-label="Action keys"><button type="button" data-keys="Space">Jump<br>Space</button><button type="button" data-keys="e,KeyE">E</button><button type="button" data-keys="z,KeyZ">Z</button><button type="button" data-keys="x,KeyX">X</button></div>';
  // Per-game touch layouts: movement is only shown when it makes sense for that game's controls.
  const gameSlug = location.pathname.match(/^\/games\/([^/]+)/)?.[1] || "";
  const touchProfiles = {
    "deltarune": {move:"stick",keys:["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],actions:[["Confirm","z,KeyZ"],["Cancel","x,KeyX"],["Menu","Escape"]]},
    "jetpack-joyride": {move:"none",actions:[["Fly","Space"]]},
    "motox3m": {move:"none",actions:[["Gas","ArrowUp,w"],["Brake","ArrowDown,s"],["Flip","ArrowLeft,a"],["Flip","ArrowRight,d"]]},
    "rooftop-snipers": {move:"buttons",actions:[["Jump","w,ArrowUp"],["Shoot","Space"]]},
    "ovo": {move:"stick",keys:["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],actions:[["Jump","Space"]]},
    "polytrack": {move:"none",actions:[["Steer left","ArrowLeft,a"],["Steer right","ArrowRight,d"],["Accelerate","ArrowUp,w"],["Brake","ArrowDown,s"]]},
    "draw-the-hill": {move:"none",actions:[]},
    "bad-time-simulator": {move:"buttons",actions:[["Up","ArrowUp"],["Down","ArrowDown"],["Left","ArrowLeft"],["Right","ArrowRight"],["Confirm","z,KeyZ"],["Cancel","x,KeyX"],["Focus","Shift"]]},
    "fnaf-1": {move:"none",actions:[]}, "fnaf-2": {move:"none",actions:[]}, "fnaf-3": {move:"none",actions:[]}, "fnaf-4": {move:"none",actions:[]},
    "drift-boss": {move:"none",actions:[["Turn","Space"]]},
    "drive-mad": {move:"none",actions:[["Gas","ArrowUp,w"],["Brake","ArrowDown,s"]]},
    "stickman-hook": {move:"none",actions:[["Hook / release","Space"]]},
    "subway-surfers": {move:"stick",keys:["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],actions:[["Jump","ArrowUp,w"],["Roll","ArrowDown,s"]]},
    "fridaynightfunkin": {move:"buttons",actions:[["Left","ArrowLeft"],["Down","ArrowDown"],["Up","ArrowUp"],["Right","ArrowRight"],["Accept","Enter"],["Back","Escape"]]},
    "backflip-dive-3d": {move:"none",actions:[["Left","ArrowLeft,a"],["Right","ArrowRight,d"],["Jump","Space"]]},
    "monkey-mart": {move:"stick",keys:["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],actions:[["Interact","e,KeyE"]]},
    "paperio2": {move:"none",actions:[]},
    "google-feud": {move:"none",actions:[]},
    "papas-pizzeria": {move:"none",actions:[]},
    "bitlife": {move:"none",actions:[]},
    "henry-breaking-the-bank": {move:"none",actions:[]},
    "henry-escaping-the-prison": {move:"none",actions:[]},
    "henry-stealing-the-diamond": {move:"none",actions:[]},
    "henry-infiltrating-the-airship": {move:"none",actions:[]},
    "henry-fleeing-the-complex": {move:"none",actions:[]}
  };
  const profile = touchProfiles[gameSlug] || {move:"none",actions:[]};
  if (!isEaglerGame && !isFunkinGame && !isUndertaleControls) {
    const left = document.createElement("div"); left.className = "excruciating-control-left";
    const right = document.createElement("div"); right.className = "excruciating-control-right";
    const actionMarkup = (profile.actions || []).map(([label,keys]) => '<button type="button" data-keys="'+keys+'" aria-label="'+label+'">'+label+'</button>').join("");
    if (profile.move === "stick") left.innerHTML = '<div class="excruciating-stick" role="application" aria-label="Movement joystick"><span class="excruciating-stick-knob"></span></div>';
    if (profile.move === "buttons") left.innerHTML = '<div class="excruciating-dpad" aria-label="Movement"><button type="button" data-keys="ArrowUp,w" data-direction="up" aria-label="Up">↑</button><button type="button" data-keys="ArrowLeft,a" data-direction="left" aria-label="Left">←</button><button type="button" data-keys="ArrowRight,d" data-direction="right" aria-label="Right">→</button><button type="button" data-keys="ArrowDown,s" data-direction="down" aria-label="Down">↓</button></div>';
    right.innerHTML = actionMarkup ? '<div class="excruciating-actions" aria-label="Game actions">'+actionMarkup+'</div>' : "";
    touchControls.replaceChildren(left,right);
    touchControls.classList.toggle("controls-no-movement", profile.move === "none");
  }
  // Undertale already ships its own joystick + Z/X touch interface in its game page.
  // Do not mount the generic shell controls over it.
  if (!isUndertaleGame && !isNativeTouchGame) document.body.append(touchControls);
  if (isSlopeGame) {
    const nativeSlopeControls = document.getElementById("slope-mobile-controls");
    if (nativeSlopeControls) { nativeSlopeControls.hidden = true; nativeSlopeControls.style.display = "none"; }
  }
  if (isUndertaleGame) {
    const nativeTools = document.getElementById("ut-control-tools");
    if (nativeTools) { nativeTools.hidden = true; nativeTools.style.display = "none"; }
    const nativeRoot = document.getElementById("undertale-mobile-controls");
    if (nativeRoot && !nativeRoot.hidden) {
      controlsToggle.setAttribute("aria-label", "Hide controls");
      controlsToggle.title = "Hide controls";
      controlsToggle.setAttribute("aria-expanded", "true");
    }
  }
  let controlsMoveMode = false;
  controlsToggle.addEventListener("click", () => {
    if (isUndertaleGame) {
      const root = document.getElementById("undertale-mobile-controls");
      if (root) root.hidden = !root.hidden;
      const visible = Boolean(root && !root.hidden);
      controlsToggle.setAttribute("aria-expanded", String(visible));
      controlsToggle.setAttribute("aria-label", visible ? "Hide controls" : "Show controls");
      controlsToggle.title = visible ? "Hide controls" : "Show controls";
    } else {
      touchControls.hidden = !touchControls.hidden;
      if (isEaglerGame) lookSurface.hidden = touchControls.hidden;
      controlsToggle.setAttribute("aria-expanded", String(!touchControls.hidden));
      controlsToggle.setAttribute("aria-label", touchControls.hidden ? "Show controls" : "Hide controls");
      controlsToggle.title = touchControls.hidden ? "Show controls" : "Hide controls";
    }
  });
  moveToggle.addEventListener("click", () => {
    if (isUndertaleGame) {
      document.getElementById("ut-controls-move")?.click();
      const nativeMove = document.getElementById("ut-controls-move");
      controlsMoveMode = nativeMove?.getAttribute("aria-pressed") === "true";
    } else {
      controlsMoveMode = !controlsMoveMode;
      touchControls.classList.toggle("is-moving", controlsMoveMode);
    }
    moveToggle.setAttribute("aria-pressed", String(controlsMoveMode));
    moveToggle.setAttribute("aria-label", controlsMoveMode ? "Finish moving controls" : "Move controls");
    moveToggle.title = controlsMoveMode ? "Finish moving controls" : "Move controls";
  });
  if (!isUndertaleGame && !isNativeTouchGame && matchMedia("(hover:none) and (pointer:coarse)").matches) {
    let drag = null;
    const saved = (() => { try { return JSON.parse(localStorage.getItem("excruciating-controls:" + location.pathname) || "null"); } catch (_) { return null; } })();
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      touchControls.dataset.x = String(saved.x);
      touchControls.dataset.y = String(saved.y);
      touchControls.style.transform = "translate(" + saved.x + "px," + saved.y + "px)";
    }
    touchControls.addEventListener("pointerdown", event => {
      if (!controlsMoveMode) return;
      event.preventDefault();
      drag = { id:event.pointerId, x:event.clientX, y:event.clientY, ox:Number(touchControls.dataset.x||0), oy:Number(touchControls.dataset.y||0) };
      touchControls.setPointerCapture?.(event.pointerId);
    });
    touchControls.addEventListener("pointermove", event => {
      if (!drag || drag.id !== event.pointerId) return;
      const x=drag.ox+event.clientX-drag.x, y=drag.oy+event.clientY-drag.y;
      touchControls.dataset.x=String(x); touchControls.dataset.y=String(y);
      touchControls.style.transform="translate(" + x + "px," + y + "px)";
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      try { localStorage.setItem("excruciating-controls:" + location.pathname, JSON.stringify({x:Number(touchControls.dataset.x||0),y:Number(touchControls.dataset.y||0)})); } catch (_) {}
      drag=null;
    };
    touchControls.addEventListener("pointerup",endDrag);
    touchControls.addEventListener("pointercancel",endDrag);
  }
  const lookSurface = document.createElement("div");
  lookSurface.id = "excruciating-eagler-look-surface";
  lookSurface.hidden = true;
  lookSurface.setAttribute("aria-label", "Drag to look around in Eaglercraft");
  if (isEaglerGame) {
    document.body.append(lookSurface);
    lookSurface.hidden = !touchDevice;
    if (touchDevice) {
      controlsToggle.setAttribute("aria-expanded", "true");
      controlsToggle.setAttribute("aria-label", "Hide controls");
      controlsToggle.title = "Hide controls";
    }
  }

  const keyInfo = {
    ArrowUp: ["ArrowUp", "ArrowUp", 38], ArrowDown: ["ArrowDown", "ArrowDown", 40],
    ArrowLeft: ["ArrowLeft", "ArrowLeft", 37], ArrowRight: ["ArrowRight", "ArrowRight", 39],
    w: ["w", "KeyW", 87], a: ["a", "KeyA", 65], s: ["s", "KeyS", 83], d: ["d", "KeyD", 68],
    Space: [" ", "Space", 32], e: ["e", "KeyE", 69], KeyE: ["e", "KeyE", 69],
    z: ["z", "KeyZ", 90], KeyZ: ["z", "KeyZ", 90], x: ["x", "KeyX", 88], KeyX: ["x", "KeyX", 88],
    Control: ["Control", "ControlLeft", 17], Shift: ["Shift", "ShiftLeft", 16],
    r: ["r", "KeyR", 82], t: ["t", "KeyT", 84], Escape: ["Escape", "Escape", 27], Enter: ["Enter", "Enter", 13],
    "1": ["1", "Digit1", 49], "2": ["2", "Digit2", 50], "3": ["3", "Digit3", 51],
    "4": ["4", "Digit4", 52], "5": ["5", "Digit5", 53], "6": ["6", "Digit6", 54],
    "7": ["7", "Digit7", 55], "8": ["8", "Digit8", 56], "9": ["9", "Digit9", 57]
  };
  function dispatchGameKey(keyName, type) {
    const info = keyInfo[keyName];
    if (!info) return;
    document.dispatchEvent(new KeyboardEvent(type, { key: info[0], code: info[1], keyCode: info[2], which: info[2], bubbles: true, cancelable: true }));
  }
  const heldGameKeys = new Map();
  function holdGameKey(keyName) {
    const count = heldGameKeys.get(keyName) || 0;
    heldGameKeys.set(keyName, count + 1);
    if (count === 0) dispatchGameKey(keyName, "keydown");
  }
  function releaseGameKey(keyName) {
    const count = heldGameKeys.get(keyName) || 0;
    if (count <= 1) { heldGameKeys.delete(keyName); if (count) dispatchGameKey(keyName, "keyup"); }
    else heldGameKeys.set(keyName, count - 1);
  }
  function dispatchGameMouse(type, button, x, y, dx = 0, dy = 0) {
    const buttons = type === "mouseup" ? 0 : button === 0 ? 1 : button === 2 ? 2 : 0;
    const event = new MouseEvent(type, { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y, button, buttons });
    try { Object.defineProperties(event, { movementX: { value: dx }, movementY: { value: dy } }); } catch (_) {}
    const target = document.querySelector("canvas") || document.body || document;
    target.dispatchEvent(event);
  }
  const heldMouseButtons = new Set();
  function releaseAllVirtualInputs() {
    for (const keyName of [...heldGameKeys.keys()]) { heldGameKeys.set(keyName, 1); releaseGameKey(keyName); }
    for (const button of touchControls.querySelectorAll("button[data-keys],button[data-mouse]")) button.dataset.pressed = "false";
    heldMouseButtons.forEach(button => dispatchGameMouse("mouseup", button, innerWidth / 2, innerHeight / 2));
    heldMouseButtons.clear();
    if (eaglerStick) updateEaglerStick([], 0, 0);
  }
  for (const button of touchControls.querySelectorAll("button[data-keys]")) {
    const keys = button.dataset.keys.split(",");
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.pressed === "true") return;
      button.dataset.pressed = "true";
      button.setPointerCapture?.(event.pointerId);
      keys.forEach(holdGameKey);
    });
    const release = event => {
      if (button.dataset.pressed !== "true") return;
      button.dataset.pressed = "false";
      keys.forEach(releaseGameKey);
      if (event?.pointerId !== undefined && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", event => event.preventDefault());
  }
  for (const button of touchControls.querySelectorAll("button[data-mouse]")) {
    const mouseButton = Number(button.dataset.mouse);
    button.addEventListener("pointerdown", event => {
      event.preventDefault(); event.stopPropagation();
      if (button.dataset.pressed === "true") return;
      button.dataset.pressed = "true"; heldMouseButtons.add(mouseButton);
      button.setPointerCapture?.(event.pointerId);
      dispatchGameMouse("mousedown", mouseButton, innerWidth / 2, innerHeight / 2);
    });
    const release = event => {
      if (button.dataset.pressed !== "true") return;
      button.dataset.pressed = "false"; heldMouseButtons.delete(mouseButton);
      dispatchGameMouse("mouseup", mouseButton, innerWidth / 2, innerHeight / 2);
      if (event?.pointerId !== undefined && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release); button.addEventListener("contextmenu", event => event.preventDefault());
  }
  const genericStick = touchControls.querySelector(".excruciating-stick");
  let genericStickPointer = null, genericStickKeys = new Set();
  function updateGenericStick(nextKeys,x,y) {
    const next = new Set(nextKeys);
    for (const key of genericStickKeys) if (!next.has(key)) releaseGameKey(key);
    for (const key of next) if (!genericStickKeys.has(key)) holdGameKey(key);
    genericStickKeys = next;
    const knob = genericStick?.querySelector(".excruciating-stick-knob");
    if (knob) knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  }
  if (genericStick) {
    const move = event => {
      const rect=genericStick.getBoundingClientRect(), radius=rect.width*.34;
      const dx=event.clientX-rect.left-rect.width/2,dy=event.clientY-rect.top-rect.height/2;
      const distance=Math.hypot(dx,dy)||1,scale=Math.min(1,radius/distance),x=dx*scale,y=dy*scale;
      const keys=[];
      if(y < -radius*.22) keys.push("ArrowUp"); if(y > radius*.22) keys.push("ArrowDown");
      if(x < -radius*.22) keys.push("ArrowLeft"); if(x > radius*.22) keys.push("ArrowRight");
      updateGenericStick(keys,x,y);
    };
    genericStick.addEventListener("pointerdown",event=>{event.preventDefault();genericStickPointer=event.pointerId;genericStick.setPointerCapture?.(event.pointerId);move(event);});
    genericStick.addEventListener("pointermove",event=>{if(event.pointerId===genericStickPointer){event.preventDefault();move(event);}});
    const release=event=>{if(event.pointerId!==genericStickPointer)return;genericStickPointer=null;updateGenericStick([],0,0);};
    genericStick.addEventListener("pointerup",release);genericStick.addEventListener("pointercancel",release);genericStick.addEventListener("lostpointercapture",release);
  }
  const eaglerStick = isEaglerGame ? touchControls.querySelector("#excruciating-eagler-stick") : null;
  let stickPointer = null;
  let stickKeys = new Set();
  function updateEaglerStick(nextKeys, x, y) {
    const next = new Set(nextKeys);
    for (const keyName of stickKeys) if (!next.has(keyName)) releaseGameKey(keyName);
    for (const keyName of next) if (!stickKeys.has(keyName)) holdGameKey(keyName);
    stickKeys = next;
    const knob = eaglerStick?.querySelector(".eagler-stick-knob");
    if (knob) knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  }
  if (eaglerStick) {
    const moveStick = event => {
      const rect = eaglerStick.getBoundingClientRect(), radius = rect.width * .34;
      const dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2;
      const distance = Math.hypot(dx, dy) || 1, scale = Math.min(1, radius / distance), x = dx * scale, y = dy * scale;
      const keys = [];
      if (y < -radius * .22) keys.push("w"); if (y > radius * .22) keys.push("s");
      if (x < -radius * .22) keys.push("a"); if (x > radius * .22) keys.push("d");
      updateEaglerStick(keys, x, y);
    };
    eaglerStick.addEventListener("pointerdown", event => { event.preventDefault(); event.stopPropagation(); stickPointer = event.pointerId; eaglerStick.setPointerCapture?.(event.pointerId); moveStick(event); });
    eaglerStick.addEventListener("pointermove", event => { if (event.pointerId === stickPointer) { event.preventDefault(); moveStick(event); } });
    const releaseStick = event => { if (event.pointerId !== stickPointer) return; stickPointer = null; updateEaglerStick([], 0, 0); if (eaglerStick.hasPointerCapture?.(event.pointerId)) eaglerStick.releasePointerCapture(event.pointerId); };
    eaglerStick.addEventListener("pointerup", releaseStick); eaglerStick.addEventListener("pointercancel", releaseStick); eaglerStick.addEventListener("lostpointercapture", releaseStick);
  }
  if (isEaglerGame) {
    let lookPointer = null, lookStartX = 0, lookStartY = 0, lastLookX = 0, lastLookY = 0, lookMoved = false;
    lookSurface.addEventListener("pointerdown", event => {
      event.preventDefault(); event.stopPropagation(); lookPointer = event.pointerId;
      lookStartX = lastLookX = event.clientX; lookStartY = lastLookY = event.clientY; lookMoved = false;
      lookSurface.setPointerCapture?.(event.pointerId);
    });
    lookSurface.addEventListener("pointermove", event => {
      if (event.pointerId !== lookPointer) return;
      event.preventDefault(); event.stopPropagation();
      const dx = event.clientX - lastLookX, dy = event.clientY - lastLookY;
      if (Math.abs(event.clientX - lookStartX) + Math.abs(event.clientY - lookStartY) > 3) lookMoved = true;
      if (lookMoved && (dx || dy)) dispatchGameMouse("mousemove", 0, event.clientX, event.clientY, dx, dy);
      lastLookX = event.clientX; lastLookY = event.clientY;
    });
    const endLook = event => {
      if (event.pointerId !== lookPointer) return;
      event.preventDefault(); event.stopPropagation();
      if (!lookMoved) {
        dispatchGameMouse("mousemove", 0, event.clientX, event.clientY);
        dispatchGameMouse("mousedown", 0, event.clientX, event.clientY);
        dispatchGameMouse("mouseup", 0, event.clientX, event.clientY);
        dispatchGameMouse("click", 0, event.clientX, event.clientY);
      }
      lookPointer = null;
      if (lookSurface.hasPointerCapture?.(event.pointerId)) lookSurface.releasePointerCapture(event.pointerId);
    };
    lookSurface.addEventListener("pointerup", endLook); lookSurface.addEventListener("pointercancel", endLook);
    lookSurface.addEventListener("contextmenu", event => event.preventDefault());
  }
  window.addEventListener("blur", releaseAllVirtualInputs);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAllVirtualInputs(); });

  const pathParts = location.pathname.split("/").filter(Boolean);
  const slug = pathParts[0] === "games" ? pathParts[1] : null;
  if (slug) {
    fetch("/catalog/games.json", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const game = data?.games?.find(item => item.slug === decodeURIComponent(slug));
        if (game?.title) document.title = game.title;
      })
      .catch(() => {});
  }
})();
