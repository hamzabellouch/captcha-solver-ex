const browserAPI = typeof chrome !== "undefined" && chrome.runtime ? chrome : (typeof browser !== "undefined" ? browser : null);
const $ = (id) => document.getElementById(id);

// Load stored settings
browserAPI.storage.local.get([
  "devicePref",
  "autoSolve",
  "humanCadence",
  "showStatusBadge"
]).then((v) => {
  if (v.devicePref) $("devicePref").value = v.devicePref;
  $("autoSolve").checked = !!v.autoSolve;
  $("humanCadence").checked = v.humanCadence !== false; // true by default
  $("showStatusBadge").checked = v.showStatusBadge !== false; // true by default
});

// Modern Checkmark SVG
const CHECKMARK_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const saveBtn = $("save");
let saveTimer = null;

// Save settings
saveBtn.addEventListener("click", async () => {
  await browserAPI.storage.local.set({
    devicePref: $("devicePref").value,
    autoSolve: $("autoSolve").checked,
    humanCadence: $("humanCadence").checked,
    showStatusBadge: $("showStatusBadge").checked,
  });

  clearTimeout(saveTimer);
  saveBtn.classList.add("saved");
  saveBtn.innerHTML = `${CHECKMARK_ICON}<span>Settings saved successfully</span>`;

  saveTimer = setTimeout(() => {
    saveBtn.classList.remove("saved");
    saveBtn.innerHTML = "Save Settings";
  }, 2500);
});
