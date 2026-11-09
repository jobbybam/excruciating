(() => {
  const button = document.getElementById("fullscreen-button");
  const frame = document.getElementById("game-frame");
  const wrap = document.getElementById("game-frame-wrap");
  if (!button || !frame || !wrap) return;
  const activeFullscreen = () => document.fullscreenElement || document.webkitFullscreenElement;
  const update = () => {
    const active = !!activeFullscreen();
    button.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
    button.title = active ? "Exit fullscreen" : "Enter fullscreen";
    const label = button.querySelector("span");
    if (label) label.textContent = active ? "Exit fullscreen" : "Fullscreen";
  };
  button.addEventListener("click", async () => {
    try {
      if (activeFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        if (wrap.requestFullscreen) await wrap.requestFullscreen({navigationUI:"hide"});
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock("landscape"); } catch (_) {}
        }
      }
    } catch (error) { console.warn("Fullscreen is unavailable in this browser.", error); }
    update();
  });
  document.addEventListener("fullscreenchange", update);
  document.addEventListener("webkitfullscreenchange", update);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  });
  update();
})();
