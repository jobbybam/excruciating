(() => {
  "use strict";

  const styles = document.createElement("style");
  styles.textContent = `
    #excruciating-games-back {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      left: max(14px, env(safe-area-inset-left));
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      min-height: 42px;
      padding: 0 15px 0 12px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 12px;
      background: rgba(12,12,14,.88);
      color: #fff;
      font: 600 14px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: .01em;
      text-decoration: none;
      box-shadow: 0 5px 22px rgba(0,0,0,.28);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      cursor: pointer;
      transition: background .16s ease, border-color .16s ease, transform .16s ease;
    }
    #excruciating-games-back:hover {
      background: rgba(32,32,36,.96);
      border-color: rgba(255,255,255,.3);
      transform: translateY(-1px);
    }
    #excruciating-games-back:active { transform: translateY(0); }
    #excruciating-games-back svg { width: 17px; height: 17px; flex: none; }
    @media (max-width: 520px) {
      #excruciating-games-back { top: max(9px, env(safe-area-inset-top)); left: max(9px, env(safe-area-inset-left)); min-height: 38px; }
    }
  `;
  document.head.append(styles);
  const loaderStyle=document.createElement("style");
  loaderStyle.textContent='#excruciating-loader{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:#080808;color:#f5f5f5;font-family:system-ui,sans-serif;transition:opacity .35s ease,visibility .35s ease}#excruciating-loader.is-done{opacity:0;visibility:hidden;pointer-events:none}#excruciating-loader .inner{width:min(300px,calc(100vw - 52px));text-align:center}#excruciating-loader .brand{font-size:23px;font-weight:850;letter-spacing:-1px;margin-bottom:23px}#excruciating-loader .brand b{margin-right:7px}#excruciating-loader .track{height:3px;border-radius:9px;background:#242424;overflow:hidden}#excruciating-loader .fill{height:100%;width:4%;background:#fff;transition:width .2s ease}#excruciating-loader .status{margin-top:11px;color:#777;font-size:10px;letter-spacing:.5px}';
  document.head.append(loaderStyle);
  function showLoadingScreen(){
    if(document.getElementById("excruciating-loader"))return;
    const overlay=document.createElement("div");overlay.id="excruciating-loader";
    overlay.innerHTML='<div class="inner"><div class="brand"><b>&gt;</b>excruciating</div><div class="track" role="progressbar" aria-label="Loading game" aria-valuemin="0" aria-valuemax="100" aria-valuenow="4"><div class="fill"></div></div><div class="status">LOADING GAME</div></div>';
    (document.body||document.documentElement).append(overlay);
    const fill=overlay.querySelector(".fill"),track=overlay.querySelector(".track");let progress=4;
    const timer=setInterval(()=>{progress=Math.min(92,progress+(progress<65?3:1));fill.style.width=progress+"%";track.setAttribute("aria-valuenow",String(progress));},180);
    const finish=()=>{clearInterval(timer);fill.style.width="100%";track.setAttribute("aria-valuenow","100");overlay.classList.add("is-done");setTimeout(()=>overlay.remove(),420);};
    window.addEventListener("load",finish,{once:true});if(document.readyState==="complete")finish();
    setTimeout(()=>{if(document.readyState==="complete")finish();},12000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showLoadingScreen,{once:true});else showLoadingScreen();

  const back = document.createElement("a");
  back.id = "excruciating-games-back";
  back.href = "/";
  back.setAttribute("aria-label", "Back to Games");
  back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18 9 12l6-6M9 12h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Games</span>';
  document.body.append(back);

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