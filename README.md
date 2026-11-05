# Captcha solver

A modern, lightweight, privacy-first, on-device AI browser extension that empowers users—especially individuals with visual impairments and accessibility needs—to solve audio CAPTCHAs (reCAPTCHA v2 / Enterprise) 100% locally on their own computer using the Whisper speech recognition model via WebGPU and WebAssembly.

Compatible with all major browsers: **Chrome, Brave, Edge, Opera, Vivaldi (Chromium-based)** and **Mozilla Firefox**.



### <a name="Features"></a> ⭐ Features

- **100% On-Device AI Speech Recognition:** Runs OpenAI's Whisper English model (`whisper-tiny.en`, ~42 MB) entirely within your browser's local memory using ONNX Runtime Web. Dedicated English specialization maximizes digit recognition accuracy and eliminates multilingual language hallucinations. Audio is never sent to OpenAI, Google Cloud, Wit.ai, or any remote server.
- **Sub-Second WebGPU Acceleration:** Harnesses modern WebGPU hardware acceleration on Windows, macOS, and Linux for lightning-fast transcription (under 1 second), with seamless, universal WebAssembly (WASM SIMD) multi-threading fallback.
- **Native Toolbar Checkmark Button:** Injects a sleek, circular green checkmark (`✓`) button directly into the reCAPTCHA control toolbar right beside the audio challenge icon—perfectly sized and styled without obscuring native buttons.
- **Comprehensive Screen Reader (a11y) Integration:** Fully accessible to NVDA, JAWS, VoiceOver, and ChromeVox via standard `role="status"` and `aria-live="polite"` live region announcements.
- **Global Keyboard Shortcut:** Trigger instant solving at any time with a single keystroke: `Alt + Shift + S`.
- **Full Hands-Free Automation (Auto-Solve on Detection):** Automatically detects the widget, clicks "I'm not a robot", seamlessly switches to the audio challenge, and transcribes locally with AI without requiring any manual clicks.
- **Direct Settings Access via CAPTCHA Logo:** Clicking the reCAPTCHA logo or badge inside any CAPTCHA box instantly opens the extension's settings dashboard.
- **Smart Spoken-Digit Normalization:** Automatically converts spoken number words and homophones ("one two three", "to", "for", "ate") into clean digit strings ("123248") for maximum verification accuracy.
- **Anti-Bot & Rate-Limiting Mitigation:** Enforces browser `force-cache` to eliminate suspicious secondary audio HTTP requests, avoiding Google's automated query rate-limiter (`rc-doscaptcha`).
- **Zero External APIs & Zero Tracking:** Zero tracking telemetry, zero analytics SDKs, zero API keys, and zero advertisements. Operates strictly offline once model weights are cached.



### <a name="RepositoryStructure"></a> 📁 Repository Structure

```text

├── chromium/          # Extension build directory for Chrome, Brave, Edge, Opera, Vivaldi
│   ├── icons/         # Extension logo & action icons (ReCAPTCHA SVG, 16px to 512px PNGs)
│   ├── models/        # Pre-packaged Whisper AI model files (100% offline out-of-the-box)
│   ├── ort/           # Local ONNX Runtime WebAssembly & SIMD threaded binaries
│   ├── background.js  # Service worker managing offscreen worker lifecycle & keyboard shortcuts
│   ├── content.js     # Toolbar injection, reCAPTCHA solver button, audio extraction, DOM orchestration
│   ├── manifest.json  # Chromium Manifest V3 configuration (Offscreen API & storage)
│   ├── offscreen.html # Isolated offscreen document hosting local AI runtime
│   ├── offscreen.js   # Bundled Transformers.js runtime & WebGPU/WASM Whisper pipeline
│   ├── options.html   # Accessible settings dashboard for automation & hardware acceleration
│   └── options.js     # Settings controller for automation preferences
│
├── firefox/           # Extension build directory for Mozilla Firefox
│   ├── icons/         # Extension logo & action icons (ReCAPTCHA SVG, 16px to 512px PNGs)
│   ├── models/        # Pre-packaged Whisper AI model files (100% offline out-of-the-box)
│   ├── ort/           # Local ONNX Runtime WebAssembly & SIMD threaded binaries
│   ├── background.js  # Modular background script running local Transformers.js pipeline
│   ├── content.js     # Toolbar injection, reCAPTCHA solver button, audio extraction, DOM orchestration
│   ├── manifest.json  # Firefox Manifest V3 configuration (with Gecko ID)
│   ├── options.html   # Accessible settings dashboard for automation & hardware acceleration
│   └── options.js     # Settings controller for automation preferences
│
├── .gitignore         # Prevents tracking of temporary files and OS metadata
├── PRIVACY_POLICY.md  # Comprehensive dual-language privacy policy and data governance
├── README.md          # Project documentation, feature overview, and installation guide
└── SECURITY.md        # Security policy, memory safety guidelines, and vulnerability reporting

```



### <a name="InstallationUsage"></a> ⚙️ Installation & Usage

### <a name="ForChromiumBasedBrowsers"></a> 🌐 For Chromium-Based Browsers (Chrome, Brave, Edge, Opera)

1. Open your Chromium-based browser and navigate to:
   - **Google Chrome / Brave / Opera:** `chrome://extensions/`
   - **Microsoft Edge:** `edge://extensions/`

2. Enable **Developer mode** (toggle located in the top-right corner).

3. Click **Load unpacked**.

4. Select the `chromium` directory:

```text
chromium/
├── icons/
├── ort/
├── background.js
├── content.js
├── manifest.json
├── offscreen.html
├── offscreen.js
├── options.html
└── options.js
```

5. The extension will be loaded and ready immediately. The high-accuracy Whisper AI model (`whisper-tiny.en`, ~42 MB) is pre-configured and automatically cached in the background, working completely offline with zero manual setup.

### <a name="ForMozillaFirefox"></a> 🦊 For Mozilla Firefox

1. Open **Mozilla Firefox** and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside the `firefox` directory:

```text
firefox/
└── manifest.json
```

4. The extension is now loaded and ready immediately with automatic background AI caching.

> [!NOTE]
> For permanent installation in Firefox, the extension can be packaged and signed through [addons.mozilla.org](https://addons.mozilla.org) as an unlisted self-distributed add-on to generate a signed `.xpi` package.



### <a name="HowToUse"></a> 🖱️ How to Use

1. Navigate to any webpage containing a Google reCAPTCHA challenge.
2. In the bottom toolbar of the reCAPTCHA box, you will find a circular green checkmark icon (`✓`) located right beside the headphone/audio challenge icon.
3. Click the **Checkmark (`✓`)** icon (or press `Alt + Shift + S` on your keyboard).
4. The extension will:
   - Switch to the audio challenge automatically if currently on visual mode.
   - Extract the audio stream in memory and process it with local Web Audio API (16 kHz Mono).
   - Display a blue rotating spinner inside the button while transcribing.
   - Run local Whisper inference in sub-second time via WebGPU/WASM.
   - Directly enter the transcribed digits and click Verify.
5. The challenge is resolved instantly with zero manual typing required.



### <a name="Privacy & Safety"></a> 🛡️ Privacy & Safety

- **100% Local Inference:** Audio challenges are recorded and transcribed strictly inside your local browser memory using client-side WebAssembly and WebGPU shaders. No audio bytes, transcripts, or session metadata ever leave your computer.
- **Zero Cloud APIs:** Unlike conventional solver extensions that route your voice data to remote third-party speech APIs (Wit.ai, Google Speech, OpenAI Cloud, or 2Captcha farms), this extension operates independently with zero external server dependencies.
- **Bundled Offline Model:** The AI model weights are completely packaged inside the extension directory. Users never have to download anything from the internet—it operates 100% offline immediately upon installation.
- **DOM Containment:** The extension injects its controls directly into the native challenge toolbar without blocking controls, creating unannounced elements, or modifying unrelated website scripts.



> [!WARNING]
> While this extension utilizes state-of-the-art AI speech models, extreme audio distortion or temporary IP-level rate-limiting by reCAPTCHA (`rc-doscaptcha`) may occasionally prevent challenges from solving. In such cases, allow a brief pause or reload the challenge.



### <a name="Copyright©2026"></a> Copyright © 2026

Thank you for engaging with us. For inquiries or collaboration, please contact:  
hamzabellouchcontact@gmail.com

Stay connected and follow us on:  
[WhatsApp](https://whatsapp.com/channel/0029Vb7MArw0LKZMpjjqOk2P) | [Facebook](https://facebook.com/hamzabellouch1) | [Instagram](https://instagram.com/hamzabellouch0) | [Twitter](https://twitter.com/hamzabellouch0) | [Telegram](https://t.me/hammzabellouch) | [LinkedIn](https://www.linkedin.com/in/hamzabellouch)
