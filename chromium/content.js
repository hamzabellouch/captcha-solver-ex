// Runs inside the reCAPTCHA iframes (anchor checkbox & challenge bframe).
// 100% on-device AI accessibility helper. Zero external APIs, zero tracking.
(() => {
  const browserAPI = typeof chrome !== "undefined" && chrome.runtime ? chrome : (typeof browser !== "undefined" ? browser : null);
  if (!browserAPI) return;

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fnOrSelector, timeout = 10000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const res = typeof fnOrSelector === "function" ? fnOrSelector() : $(fnOrSelector);
      if (res) return res;
      await sleep(200);
    }
    return null;
  }

  function triggerClick(el) {
    if (!el) return;
    el.focus();
    const opts = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new PointerEvent("pointerup", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.dispatchEvent(new MouseEvent("click", opts));
    el.click();
  }

  // ---- Settings Cache ----
  let config = {
    autoSolve: false,
    humanCadence: true,
    showStatusBadge: true
  };

  async function loadConfig() {
    try {
      const res = await browserAPI.storage.local.get(["autoSolve", "humanCadence", "showStatusBadge"]);
      config.autoSolve = !!res.autoSolve;
      config.humanCadence = res.humanCadence !== false;
      config.showStatusBadge = res.showStatusBadge !== false;
    } catch {}
  }
  loadConfig();

  // Listen for settings changes live
  browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.autoSolve !== undefined) config.autoSolve = !!changes.autoSolve.newValue;
      if (changes.humanCadence !== undefined) config.humanCadence = changes.humanCadence.newValue !== false;
      if (changes.showStatusBadge !== undefined) {
        config.showStatusBadge = changes.showStatusBadge.newValue !== false;
        const statusBadge = document.getElementById("captcha-solver-status-badge");
        if (!config.showStatusBadge && statusBadge) {
          statusBadge.className = "";
        }
      }
    }
  });

  // Open Extension Settings Page
  function openOptionsPage() {
    try {
      browserAPI.runtime.sendMessage({ type: "open-options" });
    } catch {}
  }

  // Detect which reCAPTCHA iframe context we are running inside
  const isAnchor = window.location.pathname.includes("/anchor") || !!$("#recaptcha-anchor");
  const isBFrame = window.location.pathname.includes("/bframe") || !!$("#recaptcha-audio-button") || !!$(".rc-imageselect") || !!$(".rc-buttons");

  // =========================================================================
  // 1. ANCHOR IFRAME: Checkbox & reCAPTCHA Logo
  // =========================================================================
  function initAnchor() {
    // Inject hover styles for the reCAPTCHA logo
    const style = document.createElement("style");
    style.textContent = `
      .rc-anchor-logo-portrait, .rc-anchor-logo-img, .rc-anchor-logo-text, .rc-anchor-normal-footer, .rc-anchor-compact-footer {
        cursor: pointer !important;
      }
      .rc-anchor-logo-portrait:hover, .rc-anchor-logo-img:hover {
        transform: scale(1.08) !important;
        transition: transform 0.2s ease !important;
        filter: drop-shadow(0 2px 5px rgba(66, 133, 244, 0.4)) !important;
      }
    `;
    document.head.appendChild(style);

    // Make reCAPTCHA logo/footer clickable to open Extension Options
    function attachLogoClick() {
      const targets = document.querySelectorAll(
        ".rc-anchor-logo-portrait, .rc-anchor-logo-img, .rc-anchor-logo-text, .rc-anchor-normal-footer, .rc-anchor-compact-footer"
      );
      targets.forEach((el) => {
        if (el.dataset.solverOptionsBound) return;
        el.dataset.solverOptionsBound = "true";
        el.title = "Captcha Solver: Click to open Settings (إعدادات الكابتشا)";
        el.addEventListener("click", (e) => {
          if (e.target.tagName === "A" && (e.target.href.includes("policies/privacy") || e.target.href.includes("policies/terms"))) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          openOptionsPage();
        }, true);
      });
    }

    let hasAutoClicked = false;
    let isClicking = false;

    // Auto-click "I'm not a robot" ONLY when Auto-Solve is enabled
    async function tryAutoClick() {
      if (!config.autoSolve || hasAutoClicked || isClicking) return;

      const anchor = $("#recaptcha-anchor");
      if (!anchor) return;

      const isChecked = anchor.getAttribute("aria-checked") === "true" || anchor.classList.contains("recaptcha-checkbox-checked");
      if (isChecked) {
        hasAutoClicked = true;
        return;
      }

      if (anchor.getAttribute("aria-disabled") === "true") return;

      isClicking = true;
      hasAutoClicked = true;

      // Natural human hesitation before clicking checkbox
      const delay = config.humanCadence ? (500 + Math.floor(Math.random() * 500)) : 250;
      await sleep(delay);

      const stillUnchecked = anchor.getAttribute("aria-checked") !== "true" && !anchor.classList.contains("recaptcha-checkbox-checked");
      if (stillUnchecked && config.autoSolve) {
        triggerClick(anchor);
      }
      isClicking = false;
    }

    // Observe changes in anchor checkbox status & DOM appearance
    const observer = new MutationObserver(() => {
      attachLogoClick();
      const anchor = $("#recaptcha-anchor");
      if (anchor) {
        const isChecked = anchor.getAttribute("aria-checked") === "true";
        if (isChecked) {
          // Solved without challenge
        } else if (config.autoSolve && !hasAutoClicked) {
          tryAutoClick();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-checked", "class"] });

    attachLogoClick();
    setTimeout(tryAutoClick, 400);

    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.autoSolve && changes.autoSolve.newValue) {
        hasAutoClicked = false;
        tryAutoClick();
      }
    });

    // Message listener for shortcut triggers forwarded from background script
    browserAPI.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "trigger-solve") {
        const anchor = $("#recaptcha-anchor");
        if (anchor) {
          const isChecked = anchor.getAttribute("aria-checked") === "true" || anchor.classList.contains("recaptcha-checkbox-checked");
          if (!isChecked && anchor.getAttribute("aria-disabled") !== "true") {
            triggerClick(anchor);
          }
        }
      }
    });

    // Keyboard shortcut within anchor frame (Alt+Shift+S or Alt+S)
    window.addEventListener("keydown", (e) => {
      if ((e.altKey && e.shiftKey && (e.key === "S" || e.key === "s")) ||
          (e.altKey && (e.key === "s" || e.key === "S"))) {
        e.preventDefault();
        const anchor = $("#recaptcha-anchor");
        if (anchor) {
          const isChecked = anchor.getAttribute("aria-checked") === "true" || anchor.classList.contains("recaptcha-checkbox-checked");
          if (!isChecked && anchor.getAttribute("aria-disabled") !== "true") {
            triggerClick(anchor);
          }
        }
      }
    });
  }

  // =========================================================================
  // 2. BFRAME IFRAME: Audio Challenge Solver Toolbar & AI Engine
  // =========================================================================
  function initBFrame() {
    // ---- Inject Styles & Animations ----
    const animStyle = document.createElement("style");
    animStyle.textContent = `
      @keyframes captcha-solver-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      #captcha-solver-button-holder {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 38px !important;
        height: 48px !important;
        margin: 0 !important;
        padding: 0 !important;
        vertical-align: middle !important;
      }
      #captcha-solver-checkmark-btn {
        width: 34px !important;
        height: 34px !important;
        min-width: 34px !important;
        max-width: 34px !important;
        min-height: 34px !important;
        max-height: 34px !important;
        aspect-ratio: 1 / 1 !important;
        border-radius: 50% !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        background: transparent !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        outline: none !important;
        transition: background 0.2s ease, transform 0.15s ease !important;
        vertical-align: middle !important;
      }
      #captcha-solver-checkmark-btn:hover {
        background: rgba(30, 142, 62, 0.12) !important;
        border-radius: 50% !important;
        transform: scale(1.08);
      }
      #captcha-solver-checkmark-btn:hover svg {
        fill: #137333 !important;
      }
      #captcha-solver-checkmark-btn:focus-visible {
        outline: 2px solid #1e8e3e !important;
        outline-offset: 2px;
        border-radius: 50% !important;
      }
      #captcha-solver-status-badge {
        position: absolute;
        bottom: 56px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(32, 33, 36, 0.94);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11.5px;
        font-weight: 500;
        padding: 5px 12px;
        border-radius: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        pointer-events: none;
        z-index: 999999;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      #captcha-solver-status-badge.show {
        opacity: 1;
        transform: translateX(-50%) translateY(-2px);
      }
      #captcha-solver-status-badge.error {
        background: rgba(217, 48, 37, 0.95);
      }
      #captcha-solver-status-badge.success {
        background: rgba(30, 142, 62, 0.95);
      }
    `;
    document.head.appendChild(animStyle);

    // ---- SVG Icons ----
    // Idle icon: circular green checkmark (#1e8e3e)
    const SOLVER_IDLE_ICON = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#1e8e3e" style="display:block;margin:auto;pointer-events:none;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`;

    const SPINNER_ICON = `
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="#1a73e8" fill="none" stroke-width="2.5" style="display:block;margin:auto;animation:captcha-solver-spin 1s linear infinite;pointer-events:none;">
        <circle cx="12" cy="12" r="9" stroke-dasharray="28" stroke-linecap="round"/>
      </svg>`;

    // Success icon: ONLY shown when verification is verified
    const SUCCESS_ICON = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#1e8e3e" style="display:block;margin:auto;pointer-events:none;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`;

    const ALERT_ICON = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#d93025" style="display:block;margin:auto;pointer-events:none;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>`;

    // ---- Solver Button Element ----
    const solverHolder = document.createElement("div");
    solverHolder.className = "button-holder";
    solverHolder.id = "captcha-solver-button-holder";

    const solverBtn = document.createElement("button");
    solverBtn.id = "captcha-solver-checkmark-btn";
    solverBtn.type = "button";
    solverBtn.setAttribute("role", "button");
    solverBtn.setAttribute("tabindex", "0");
    solverBtn.setAttribute("title", "Solve with Local AI (Alt+Shift+S) – Right-click for Settings");
    solverBtn.setAttribute("aria-label", "Solve audio CAPTCHA using local on-device AI (Shortcut: Alt+Shift+S)");
    solverBtn.innerHTML = SOLVER_IDLE_ICON;
    solverHolder.appendChild(solverBtn);

    // Right-click opens options
    solverBtn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openOptionsPage();
    });

    // ---- Screen Reader Live Region ----
    const a11yStatus = document.createElement("div");
    a11yStatus.id = "captcha-solver-a11y-status";
    a11yStatus.setAttribute("role", "status");
    a11yStatus.setAttribute("aria-live", "polite");
    Object.assign(a11yStatus.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
      pointerEvents: "none"
    });
    document.body.appendChild(a11yStatus);

    // ---- Visible Floating Status Badge ----
    const statusBadge = document.createElement("div");
    statusBadge.id = "captcha-solver-status-badge";
    document.body.appendChild(statusBadge);

    let badgeTimer = null;
    function updateStatus(text, type = "normal") {
      if (a11yStatus) a11yStatus.textContent = text || "";

      if (!statusBadge) return;
      clearTimeout(badgeTimer);

      if (!text || !config.showStatusBadge) {
        statusBadge.className = "";
        return;
      }

      statusBadge.textContent = text;
      statusBadge.className = "show" + (type === "error" ? " error" : type === "success" ? " success" : "");

      if (type === "error" || type === "success") {
        badgeTimer = setTimeout(() => {
          statusBadge.className = "";
        }, 4500);
      }
    }

    // Listen for model download progress updates from background/offscreen
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.progress && changes.progress.newValue) {
        if (isSolving) {
          updateStatus(changes.progress.newValue, "normal");
        }
      }
    });

    // ---- Inject Button Beside Audio Button in Toolbar ----
    function injectCheckmark() {
      if ($("#captcha-solver-checkmark-btn")) return;

      const audioBtn = $("#recaptcha-audio-button") || $("#recaptcha-image-button");
      if (audioBtn) {
        const parentHolder = audioBtn.closest(".button-holder");
        if (parentHolder) {
          parentHolder.insertAdjacentElement("afterend", solverHolder);
          return;
        }
      }

      const reloadBtn = $("#recaptcha-reload-button");
      if (reloadBtn) {
        const parentHolder = reloadBtn.closest(".button-holder");
        if (parentHolder) {
          parentHolder.insertAdjacentElement("afterend", solverHolder);
          return;
        }
      }

      const buttonsRow = $(".rc-buttons");
      if (buttonsRow) {
        buttonsRow.appendChild(solverHolder);
      }
    }

    const bframeObserver = new MutationObserver(() => {
      injectCheckmark();
    });
    bframeObserver.observe(document.body, { childList: true, subtree: true });
    injectCheckmark();

    // Check if Google has rate-limited or blocked audio on this IP
    function isGoogleBlocked() {
      const docText = (document.body && document.body.innerText) ? document.body.innerText.toLowerCase() : "";
      return !!(
        $(".rc-doscaptcha-header") ||
        $(".rc-doscaptcha-body") ||
        $(".rc-doscaptcha-body-text") ||
        docText.includes("automated queries") ||
        docText.includes("can't process your request") ||
        docText.includes("cannot contact recaptcha") ||
        docText.includes("try again later")
      );
    }

    // Detect if the challenge popup is currently showing the audio challenge UI
    function isAudioActive() {
      const resp = $("#audio-response, .rc-audiochallenge-response-field");
      if (resp && (resp.offsetParent !== null || getComputedStyle(resp).display !== "none")) {
        return true;
      }
      const audioContainer = $("#rc-audio, .rc-audiochallenge");
      if (audioContainer && (audioContainer.offsetParent !== null || getComputedStyle(audioContainer).display !== "none")) {
        return true;
      }
      return false;
    }

    // Strict validator to ensure we ONLY match actual reCAPTCHA audio payloads
    function isValidAudioPayloadUrl(url) {
      if (!url || typeof url !== "string") return false;
      const lower = url.toLowerCase().trim();
      // Must NEVER point to the iframe itself, anchor, or generic Google pages
      if (lower.includes("/bframe") || lower.includes("/anchor") || lower.includes("/recaptcha/api.js")) {
        return false;
      }
      // Must contain payload or audio.mp3
      const hasPayload = lower.includes("/payload?") || lower.includes("/payload") || lower.includes("audio.mp3");
      const isHttp = lower.startsWith("https://") || lower.startsWith("http://");
      return hasPayload && isHttp;
    }

    // Locate the MP3 payload URL across all possible reCAPTCHA DOM variations
    function findAudioPayloadUrl() {
      // 1. Download link - reCAPTCHA always puts download URL in .rc-audiochallenge-tdownload-link
      const links = document.querySelectorAll(
        ".rc-audiochallenge-tdownload-link, a.rc-audiochallenge-download-link, a[href*='payload'], a[href*='audio.mp3']"
      );
      for (const link of links) {
        const href = link.href || link.getAttribute("href");
        if (isValidAudioPayloadUrl(href)) {
          return href;
        }
      }

      // 2. Audio or source element - only if it has a real /payload src
      const audioSources = document.querySelectorAll("#audio-source, audio source, audio");
      for (const el of audioSources) {
        const src = el.src || el.currentSrc || el.getAttribute("src");
        if (isValidAudioPayloadUrl(src)) {
          return src;
        }
      }

      return null;
    }

    function arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    }

    // Fetch raw MP3 stream with multi-strategy fallback (Direct no-store -> Default -> Background Service Worker)
    async function fetchAudioRawBase64(url) {
      // 1. Direct fetch with no-store (bypasses any incomplete Range cache created by <audio>)
      try {
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (res.ok) {
          const contentType = (res.headers.get("content-type") || "").toLowerCase();
          if (!contentType.includes("text/html")) {
            const raw = await res.arrayBuffer();
            if (raw.byteLength >= 6000) {
              const bytes = new Uint8Array(raw);
              if (bytes[0] !== 0x3C) {
                return arrayBufferToBase64(raw);
              }
            }
          }
        }
      } catch (err) {
        console.debug("[Captcha solver] Direct no-store fetch failed:", err);
      }

      // 2. Direct fetch with default cache
      try {
        const res = await fetch(url, { cache: "default", credentials: "same-origin" });
        if (res.ok) {
          const contentType = (res.headers.get("content-type") || "").toLowerCase();
          if (!contentType.includes("text/html")) {
            const raw = await res.arrayBuffer();
            if (raw.byteLength >= 6000) {
              const bytes = new Uint8Array(raw);
              if (bytes[0] !== 0x3C) {
                return arrayBufferToBase64(raw);
              }
            }
          }
        }
      } catch (err) {
        console.debug("[Captcha solver] Default fetch failed:", err);
      }

      // 3. Fallback to background service worker (has host_permissions for google.com/recaptcha/* and clean cache)
      try {
        if (browserAPI.runtime && browserAPI.runtime.id) {
          const bgRes = await new Promise((resolve) => {
            browserAPI.runtime.sendMessage({ type: "fetch-audio", url: url }, (resp) => {
              if (browserAPI.runtime.lastError || !resp) {
                resolve(null);
              } else {
                resolve(resp);
              }
            });
          });
          if (bgRes && bgRes.base64) {
            return bgRes.base64;
          }
        }
      } catch (err) {
        console.debug("[Captcha solver] Background fetch failed:", err);
      }

      throw new Error("Downloaded audio payload is too small or truncated.");
    }

    // Transcribe Request via Local Extension Engine
    function transcribeLocally(audioBase64) {
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transcription timed out. Verify model status in extension options.")),
          180000
        )
      );
      const send = new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({ type: "transcribe", audio: audioBase64, isPcm: false }, (resp) => {
          if (browserAPI.runtime.lastError) {
            return reject(new Error(browserAPI.runtime.lastError.message));
          }
          if (!resp || resp.error) {
            return reject(new Error(resp ? resp.error : "No response from local AI."));
          }
          resolve(resp.text);
        });
      });
      return Promise.race([timeout, send]);
    }

    function setNativeValue(el, val) {
      if (!el) return;
      const valueSetter = Object.getOwnPropertyDescriptor(el, "value")?.set ||
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set ||
                          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (valueSetter) {
        valueSetter.call(el, val);
      } else {
        el.value = val;
      }
    }

    // Direct Text Entry
    function enterTextDirectly(inputEl, text) {
      if (!inputEl) return;
      if (inputEl.tagName !== "INPUT") {
        inputEl = inputEl.querySelector("input") || inputEl;
      }
      inputEl.focus();
      triggerClick(inputEl);
      setNativeValue(inputEl, text);
      inputEl.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }

    // Simulated Human Typing
    async function enterTextWithHumanCadence(inputEl, text) {
      if (!inputEl) return;
      if (inputEl.tagName !== "INPUT") {
        inputEl = inputEl.querySelector("input") || inputEl;
      }
      inputEl.focus();
      triggerClick(inputEl);
      setNativeValue(inputEl, "");
      inputEl.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

      let currentVal = "";
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const keyCode = char.charCodeAt(0);
        const keyOpts = { key: char, code: `Digit${char}`, keyCode, which: keyCode, bubbles: true, composed: true };

        inputEl.dispatchEvent(new KeyboardEvent("keydown", keyOpts));
        inputEl.dispatchEvent(new KeyboardEvent("keypress", keyOpts));

        currentVal += char;
        setNativeValue(inputEl, currentVal);

        inputEl.dispatchEvent(new InputEvent("input", { data: char, inputType: "insertText", bubbles: true, composed: true }));
        inputEl.dispatchEvent(new KeyboardEvent("keyup", keyOpts));

        const delay = 40 + Math.floor(Math.random() * 50);
        await sleep(delay);
      }

      setNativeValue(inputEl, text);
      inputEl.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }

    // ---- Solve Orchestration ----
    let isSolving = false;
    let hasAutoSolvedCurrentChallenge = false;

    async function solve(roundArg = 1) {
      const round = typeof roundArg === "number" ? roundArg : 1;
      if (isSolving && round === 1) return;
      isSolving = true;
      solverBtn.disabled = true;
      solverBtn.innerHTML = SPINNER_ICON;
      solverBtn.title = round > 1 ? `Solving round ${round} locally with AI…` : "Solving CAPTCHA locally with AI…";
      updateStatus(round > 1 ? `Solving audio round ${round}…` : "Starting local AI solver…", "normal");

      try {
        if (isGoogleBlocked()) {
          throw new Error("Google blocked audio challenges for your network. Please wait a few minutes.");
        }

        // If not in audio challenge mode, switch to audio challenge
        if (!isAudioActive()) {
          const audioBtn = $("#recaptcha-audio-button") || (await waitFor("#recaptcha-audio-button", 3000));
          if (audioBtn) {
            updateStatus("Switching to audio challenge…", "normal", true);
            await sleep(250 + Math.floor(Math.random() * 200));
            triggerClick(audioBtn);
            await sleep(600);

            // Wait up to 2.5s for audio challenge to appear; retry click once if still not switched
            const switchDeadline = Date.now() + 2500;
            while (!isAudioActive() && Date.now() < switchDeadline) {
              if (isGoogleBlocked()) break;
              await sleep(200);
            }
            if (!isAudioActive() && !isGoogleBlocked()) {
              triggerClick(audioBtn);
              await sleep(500);
            }
          }
        }

        updateStatus("Waiting for audio stream…", "normal", false);

        // Wait for audio challenge stream to become ready (must be valid payload URL!)
        let audioUrl = findAudioPayloadUrl();
        const deadline = Date.now() + 14000;
        while (!audioUrl && Date.now() < deadline) {
          await sleep(250);
          if (isGoogleBlocked()) {
            throw new Error("Google blocked audio challenges for your network. Please wait a few minutes.");
          }
          audioUrl = findAudioPayloadUrl();
        }

        if (!audioUrl) {
          if (isGoogleBlocked()) {
            throw new Error("Google blocked audio challenges for your network. Please wait a few minutes.");
          }
          throw new Error("Audio challenge stream not available. Please click Reload (🔄) and try again.");
        }

        let b64 = null;
        let lastFetchErr = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            updateStatus("Downloading audio…", "normal", false);
            await sleep(200 + Math.floor(Math.random() * 200));
            b64 = await fetchAudioRawBase64(audioUrl);
            if (b64) break;
          } catch (e) {
            lastFetchErr = e;
            if (attempt === 0) {
              // Token may be stale; refresh challenge once
              const reloadBtn = $("#recaptcha-reload-button") || $(".rc-button-reload");
              if (reloadBtn) {
                updateStatus("Refreshing audio challenge…", "normal", false);
                triggerClick(reloadBtn);
                await sleep(1200);
                audioUrl = findAudioPayloadUrl();
                const freshDeadline = Date.now() + 6000;
                while (!audioUrl && Date.now() < freshDeadline) {
                  await sleep(250);
                  audioUrl = findAudioPayloadUrl();
                }
                if (!audioUrl) break;
              }
            }
          }
        }

        if (!b64) {
          throw lastFetchErr || new Error("Downloaded audio payload is too small or truncated.");
        }

        updateStatus("Transcribing locally…", "normal", true);
        const text = await transcribeLocally(b64);
        if (!text || !text.trim()) {
          throw new Error("No speech recognized. Please click Reload (🔄) to retry.");
        }

        const input = await waitFor(() => {
          let el = $("#audio-response") ||
                   $(".rc-response-input-field") ||
                   $(".rc-audiochallenge-response-field input") ||
                   $("#rc-audio input") ||
                   $("input[id*='audio']") ||
                   $("input[type='text']") ||
                   $("input:not([type='hidden'])");
          if (el && el.tagName !== "INPUT") {
            el = el.querySelector("input");
          }
          if (el && el.tagName === "INPUT") {
            return el;
          }
          return null;
        }, 8000);
        if (!input) {
          throw new Error("Audio response input field not found.");
        }

        updateStatus(`Entering code: ${text}`, "normal", false);
        if (config.humanCadence) {
          await enterTextWithHumanCadence(input, text);
        } else {
          enterTextDirectly(input, text);
        }
        await sleep(300 + Math.floor(Math.random() * 200));

        const verifyBtn = $("#recaptcha-verify-button") || $(".rc-button-default");
        if (verifyBtn) {
          updateStatus("Verifying solution…", "normal", false);
          triggerClick(verifyBtn);

          // Monitor verification outcome for up to 6 seconds
          const verifyStart = Date.now();
          let roundSolved = false;

          let nextRoundNeeded = false;

          while (Date.now() - verifyStart < 6000) {
            await sleep(400);

            if (isGoogleBlocked()) {
              throw new Error("Google blocked audio challenges for your network. Please wait a few minutes.");
            }

            // Check if error message appeared
            const errEl = $(".rc-audiochallenge-error-message");
            if (errEl && errEl.innerText && errEl.innerText.trim()) {
              const errText = errEl.innerText.trim();
              if (round < 3 && isAudioActive()) {
                nextRoundNeeded = true;
                break;
              } else {
                throw new Error(errText);
              }
            }

            // Check if challenge dialog closed or completed
            if (!isAudioActive() && !$(".rc-imageselect") && !$("#recaptcha-audio-button")) {
              roundSolved = true;
              break;
            }
          }

          if (roundSolved) {
            updateStatus("✓ Solved successfully!", "success", true);
            solverBtn.innerHTML = SUCCESS_ICON;
            hasAutoSolvedCurrentChallenge = false;
            await sleep(2200);
          } else if (nextRoundNeeded || (isAudioActive() && round < 3)) {
            updateStatus(`Solving audio round ${round + 1}…`, "normal", true);
            await sleep(1000);
            isSolving = false;
            return solve(round + 1);
          } else {
            const errEl = $(".rc-audiochallenge-error-message");
            const errText = errEl && errEl.innerText ? errEl.innerText.trim() : "";
            if (errText) {
              throw new Error(errText);
            }
            if (isAudioActive()) {
              throw new Error("Google requested another round or rejected digits. Click 🔄 to retry.");
            }
            throw new Error("Verification timed out.");
          }
        }
      } catch (e) {
        updateStatus("⚠ " + e.message, "error", true);
        console.debug("[Captcha solver]", e.message);
        solverBtn.innerHTML = ALERT_ICON;
        solverBtn.title = "⚠ " + e.message;
        await sleep(3500);
      } finally {
        solverBtn.disabled = false;
        solverBtn.innerHTML = SOLVER_IDLE_ICON;
        solverBtn.title = "Solve with Local AI (Alt+Shift+S) – Right-click for Settings";
        isSolving = false;
      }
    }

    // Click Trigger on solver button
    solverBtn.addEventListener("click", solve);

    // Keyboard Shortcuts (Alt+Shift+S or Alt+S)
    window.addEventListener("keydown", (e) => {
      if ((e.altKey && e.shiftKey && (e.key === "S" || e.key === "s")) ||
          (e.altKey && (e.key === "s" || e.key === "S"))) {
        e.preventDefault();
        solve();
      }
    });

    // Message listener for shortcut triggers forwarded from background script
    browserAPI.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "trigger-solve") {
        solve();
      }
    });

    // Active watcher for challenge appearance (Auto-Solve)
    function checkAndAutoSolve() {
      const challengeVisible = isAudioActive() ||
        !!($("#recaptcha-audio-button") && ($("#recaptcha-audio-button").offsetParent !== null)) ||
        !!($(".rc-imageselect") && ($(".rc-imageselect").offsetParent !== null));

      if (!challengeVisible) {
        hasAutoSolvedCurrentChallenge = false;
        return;
      }

      if (!config.autoSolve || isSolving || hasAutoSolvedCurrentChallenge) return;

      hasAutoSolvedCurrentChallenge = true;
      setTimeout(() => {
        if (config.autoSolve && !isSolving) {
          solve();
        }
      }, 500 + Math.floor(Math.random() * 400));
    }

    // Reset auto-solve lock when reload is clicked
    document.addEventListener("click", (e) => {
      if (e.target && (e.target.id === "recaptcha-reload-button" || e.target.closest("#recaptcha-reload-button") || e.target.closest(".rc-button-reload"))) {
        hasAutoSolvedCurrentChallenge = false;
      }
    }, true);

    const autoObserver = new MutationObserver(() => {
      checkAndAutoSolve();
    });
    autoObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "aria-hidden"] });

    setInterval(checkAndAutoSolve, 400);
  }

  // =========================================================================
  // Bootstrap Content Script Based on Frame Context
  // =========================================================================
  if (isAnchor) {
    initAnchor();
  }
  if (isBFrame) {
    initBFrame();
  }
  if (!isAnchor && !isBFrame) {
    const timer = setInterval(() => {
      if ($("#recaptcha-anchor")) {
        clearInterval(timer);
        initAnchor();
      } else if ($("#recaptcha-audio-button") || $(".rc-buttons") || $("#recaptcha-image-button")) {
        clearInterval(timer);
        initBFrame();
      }
    }, 200);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
