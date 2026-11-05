# Security Policy

## Supported Versions

The following versions of **Captcha solver** are currently supported with security and stability updates.

| Version | Supported |
| -------- | --------- |
| 1.0.x (latest release) | ✅ |
| < 1.0.0 | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability, privacy leak, or behavior that could negatively impact users or the host browser environment, please report it responsibly.

### Before Reporting

Please ensure that:

- The issue is reproducible.
- You are using the latest supported release of **Captcha solver** (v1.0.0+).
- The issue is not caused by modified builds, unsupported browser forks, or conflicting third-party extensions.

### How to Report

You can report vulnerabilities through:

- **GitHub Issues:** [hamzabellouch/captcha-solver-ex/issues](https://github.com/hamzabellouch/captcha-solver-ex/issues) (for general non-sensitive bugs or security queries)
- **Email Contact:** `hamzabellouchcontact@gmail.com` (for sensitive vulnerabilities, security disclosures, or exploit details)

When submitting a report, please include:

- Browser name and version (e.g., Chrome 130+, Firefox 132+, Edge 130+)
- Operating system and version (e.g., Windows 11, macOS Sequoia, Ubuntu 24.04)
- **Captcha solver** version (e.g., v1.0.0)
- Steps to reproduce the vulnerability
- Target webpage URL where the issue occurred (if applicable)
- Console error logs or debug screenshots (if available)
- A clear assessment of the potential security or privacy impact

### Response Policy

Security reports are reviewed as quickly as possible.

If a report is confirmed:

- The vulnerability will be investigated and patched promptly.
- A fix will be included in the next update release.
- Credit will be given to the reporter upon request.

If a report cannot be reproduced, lacks actionable information, or is determined not to be a security issue, it will be closed with a clear explanation.

---

## Security & Architecture Notes

**Captcha solver** executes entirely within your browser and is architected under strict security principles:

- **Strict Local Client-Side Execution:** All extension logic runs locally using Manifest V3 service workers and offscreen documents (Chromium) and background modules (Firefox). Remote code execution (`eval`, dynamic remote script tags, or external CDN script loading) is strictly forbidden under our Content Security Policy:
  ```text
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  ```
- **Local WebAssembly Engine Bundling:** All ONNX Runtime WebAssembly and SIMD binaries are pre-packaged locally within the extension directory (`ort/`), ensuring complete code integrity and compliance with Chrome Web Store and Mozilla Add-ons security policies.
- **In-Memory Audio Processing & Immediate Buffer Purging:** Audio challenges fetched from the reCAPTCHA frame are downsampled into 16 kHz Mono PCM strictly within temporary browser RAM via Web Audio API (`OfflineAudioContext`). No audio data is written to persistent disk storage or forwarded to cloud speech APIs.
- **Scoped Frame Injection:** Content scripts are strictly restricted to match verified reCAPTCHA endpoints (`google.com/recaptcha/*` and `recaptcha.net/*`). The extension does not inject content scripts into arbitrary webpages.
- **Native Toolbar DOM Mounting:** The assistive checkmark button is injected natively inside the reCAPTCHA control bar, preventing UI redress or clickjacking attacks and preserving the visibility of all native challenge controls.
- **Zero Background Telemetry:** The extension contains zero tracking SDKs, analytics beacons, telemetry collectors, or background telemetry calls.

Users are encouraged to:

- Keep **Captcha solver** updated to the latest release.
- Install the extension only from the official repository ([hamzabellouch/captcha-solver-ex](https://github.com/hamzabellouch/captcha-solver-ex)) or verified store listings.
- Avoid installing modified, repackaged, or unofficial third-party builds.
- Report any unexpected behavior that could affect security or accessibility.

Security, user privacy, and digital accessibility are foundational priorities for this project.
