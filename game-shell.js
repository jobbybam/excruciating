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