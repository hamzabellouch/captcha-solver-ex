// Routes audio to the offscreen page where Whisper runs locally.
// Zero external APIs, zero analytics, zero server communication.
const DEFAULT_MODEL = "whisper-tiny.en";
let creating = null;

async function ensureOffscreen() {
  try {
    if (chrome.offscreen && chrome.offscreen.hasDocument) {
      const has = await chrome.offscreen.hasDocument();
      if (has) return;
    } else if (chrome.runtime && chrome.runtime.getContexts) {
      const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
      if (existing && existing.length) return;
    }
  } catch {}
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK", "WORKERS"],
        justification: "Run speech recognition model 100% locally on device",
      })
      .catch((err) => {
        if (!err.message || !err.message.includes("Only a single offscreen document may be created")) {
          throw err;
        }
      })
      .finally(() => (creating = null));
  }
  await creating;
}

// Handshake to ensure offscreen.js module has finished parsing and registered onMessage
async function waitForOffscreenReady(maxRetries = 35, delayMs = 120) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pingResp = await chrome.runtime.sendMessage({ target: "offscreen", type: "ping" });
      if (pingResp && pingResp.ready) {
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function getSettings() {
  const { devicePref } = await chrome.storage.local.get(["devicePref"]);
  return {
    model: DEFAULT_MODEL, // High-accuracy English Whisper Tiny (~42 MB)
    language: null, // English-only model
    devicePref: devicePref || "auto",
  };
}

// Convert spoken English/Arabic number words and homophones to digits for high captcha accuracy
const WORD_TO_DIGIT = {
  zero: "0", oh: "0", o: "0",
  one: "1", won: "1",
  two: "2", to: "2", too: "2",
  three: "3", tree: "3", free: "3",
  four: "4", for: "4", fore: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8", ate: "8",
  nine: "9", niner: "9",
  ten: "10",
  "صفر": "0", "واحد": "1", "اثنان": "2", "اثنين": "2", "ثلاثة": "3", "ثلاثه": "3",
  "اربعة": "4", "أربعة": "4", "خمسة": "5", "خمسه": "5", "ستة": "6", "سته": "6",
  "سبعة": "7", "سبعه": "7", "ثمانية": "8", "ثمانيه": "8", "تسعة": "9", "تسعه": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
};

function normalize(text) {
  if (!text) return "";
  let cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  // Replace eastern arabic numerals
  cleaned = cleaned.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const converted = tokens.map((t) => (WORD_TO_DIGIT[t] !== undefined ? WORD_TO_DIGIT[t] : t));
  const digitsOnly = converted.filter((t) => /^\d+$/.test(t));
  if (digitsOnly.length > 0) {
    return digitsOnly.join("");
  }
  const matchDigits = cleaned.match(/\d+/g);
  if (matchDigits && matchDigits.length > 0) {
    return matchDigits.join("");
  }
  return converted.join("");
}

async function askOffscreen(payload) {
  await ensureOffscreen();
  const ready = await waitForOffscreenReady();
  if (!ready) {
    throw new Error("Local AI runtime could not be started. Please reload the extension.");
  }
  const settings = await getSettings();
  const resp = await chrome.runtime.sendMessage({
    target: "offscreen",
    ...settings,
    ...payload,
  });
  if (!resp) throw new Error("No response from local AI.");
  if (resp.error) throw new Error(resp.error);
  return resp;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "progress") {
    chrome.storage.local.set({ progress: msg.text }).catch(() => {});
    return false;
  }
  if (msg && msg.type === "transcribe") {
    (async () => {
      try {
        const r = await askOffscreen({ type: "asr", audio: msg.audio, isPcm: msg.isPcm });
        sendResponse({ text: normalize(r.text) });
      } catch (e) {
        sendResponse({ error: e.message || String(e) });
      }
    })();
    return true; // Keep message channel open for async response
  }
  if (msg && msg.type === "preload") {
    (async () => {
      try {
        await askOffscreen({ type: "preload" });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ error: e.message || String(e) });
      }
    })();
    return true;
  }
  if (msg && msg.type === "fetch-audio") {
    (async () => {
      try {
        const resp = await fetch(msg.url);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (bytes.length < 6000) throw new Error("Audio payload too small or truncated (" + bytes.length + " bytes)");
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        sendResponse({ base64: btoa(bin) });
      } catch (err) {
        sendResponse({ error: err.message || String(err) });
      }
    })();
    return true; // Keep channel open for async response
  }
  if (msg && msg.type === "open-options") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
    sendResponse({ ok: true });
    return false; // Synchronous response, do not return true
  }
});

// Broadcast keyboard shortcut command to content scripts
chrome.commands?.onCommand?.addListener((command) => {
  if (command === "solve-captcha") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "trigger-solve" }).catch(() => {});
      }
    });
  }
});

// Open options page when extension icon in toolbar is clicked
chrome.action?.onClicked?.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Download/cache the model automatically on install & startup so solving is always immediate
chrome.runtime.onInstalled.addListener(() => {
  askOffscreen({ type: "preload" }).catch(() => {});
});
chrome.runtime.onStartup?.addListener(() => {
  askOffscreen({ type: "preload" }).catch(() => {});
});
