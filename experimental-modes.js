(() => {
  "use strict";
  const key = "excruciating-experimental-ui";
  const names = { p: "Preview P — reference-inspired layout", o: "Preview O — Excruciating redesign" };
  let indicator;
  function getIndicator() {
    if (indicator?.isConnected) return indicator;
    indicator = document.createElement("div");
    indicator.id = "experimental-mode-indicator";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-live", "polite");
    indicator.hidden = true;
    document.body.append(indicator);
    return indicator;
  }
  function apply(mode, announce = true) {
    if (!["p", "o"].includes(mode)) mode = "";
    if (mode) document.body.dataset.experimentalUi = mode;
    else delete document.body.dataset.experimentalUi;
    try {
      if (mode) sessionStorage.setItem(key, mode);
      else sessionStorage.removeItem(key);
    } catch (_) {}
    const note = getIndicator();
    note.hidden = !mode;
    note.innerHTML = mode
      ? "<strong>" + names[mode] + "</strong><br>Press P or O to compare · Esc to return to the original"
      : "";
    if (announce && mode) {
      note.animate?.([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "ease-out" });
    }
  }
  function isEditing(target) {
    return !!target?.closest?.("input, textarea, select, [contenteditable='true']");
  }
  try {
    const saved = sessionStorage.getItem(key);
    if (saved === "p" || saved === "o") apply(saved, false);
  } catch (_) {}
  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isEditing(event.target)) return;
    if (document.querySelector("#player:not([hidden]), #admin-view:not([hidden])") || document.querySelector("dialog[open]")) return;
    const keyName = event.key.toLowerCase();
    if (keyName === "p" || keyName === "o") {
      event.preventDefault();
      apply(keyName);
    } else if (event.key === "Escape" && document.body.dataset.experimentalUi) {
      event.preventDefault();
      apply("");
    }
  });
  window.ExcruciatingExperimentalUI = Object.freeze({ set: apply, current: () => document.body.dataset.experimentalUi || "default" });
})();
