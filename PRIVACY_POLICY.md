# Privacy Policy - Captcha solver

Last Updated: October 25, 2026


### 0. Rule 0: Disclaimer on Modified Builds, External Packages & Unofficial Forks:

- **Original Source Integrity:** This privacy policy, safety guarantees, and security features apply strictly and exclusively to the official, unmodified extension binaries and source code distributed directly through this official repository ([hamzabellouch/captcha-solver-ex](https://github.com/hamzabellouch/captcha-solver-ex)) and its verified official releases.
- **Zero Liability for Modified / External Builds:** We (the publisher and maintainer) assume **no responsibility or liability whatsoever** for any modified extensions, third-party forks, repackaged `.crx` / `.xpi` / `.zip` archives, unofficial distribution channels, or altered projects not originating directly from this official repository. Any installation or use of modified, tampered, or third-party builds is entirely at your own risk, and the publisher assumes no responsibility for any consequences, damages, security compromises, or data breaches that may occur.


### 1. Executive Summary & Overview:

Captcha solver is an accessibility-oriented browser extension engineered to assist users—specifically individuals with visual impairments or motor disabilities—in completing reCAPTCHA audio challenges automatically and seamlessly. The extension operates with an uncompromising focus on digital privacy and data sovereignty.

#### Core Privacy Commitment:
Captcha solver operates **100% locally on your device**. Audio challenges are processed, decoded, and transcribed strictly inside your local browser memory using on-device machine learning (OpenAI Whisper via ONNX Runtime Web). We do **not** collect, store, transmit, log, share, or sell any voice data, audio recordings, transcripts, browsing history, IP addresses, or device fingerprints to external servers, cloud AI providers, or third parties.


### 2. Information Processed On-Device:

To deliver its local transcription and assistive solving capabilities, Captcha solver processes operations **strictly locally within your browser**:

- **Local Audio Stream Ingestion:** When a challenge is triggered, the extension captures the challenge audio link from the reCAPTCHA frame and decodes the audio stream into 16 kHz mono PCM in memory via the standard HTML5 `AudioContext` and `OfflineAudioContext`.
- **On-Device Machine Learning Inference:** The audio data is transcribed locally in your browser's offscreen environment (Chromium) or background context (Firefox) using local WebGPU shaders and WebAssembly SIMD binaries (`ort/`). At no point is the audio dispatched to remote speech APIs (such as OpenAI Cloud, Google Speech-to-Text, Wit.ai, or external bypass solving farms).
- **Immediate In-Memory Buffer Cleanup:** Raw audio arrays, decoded PCM buffers, and intermediate spectrogram representations exist solely in volatile browser RAM and are purged immediately following transcription.
- **Local Settings Persistence:** User configuration preferences (selected Whisper model, hardware acceleration preference, auto-solve toggle, and speech synthesis options) are stored strictly locally via `chrome.storage.local`. These settings never leave your browser.
- **Pre-Packaged Offline Model:** The public ONNX model weights (~42 MB for `whisper-tiny.en`) are bundled directly within the extension package (`models/`). Zero network requests are made to fetch model files, and inference executes strictly offline.
- **No Browsing Activity Monitoring:** The extension scripts only execute within matching reCAPTCHA frames (`bframe`) and never inspect, record, or track your general browsing history or host page contents.


### 3. Permissions Used & Their Purposes:

Captcha solver adheres strictly to the principle of least privilege, requesting only the minimal permissions necessary to perform local audio transcription and automation:

**A. Storage (`storage`)**
- **Purpose:** Saves user preferences (model choice, hardware acceleration backend, auto-solve toggle, and voice feedback) locally on your device so settings persist across sessions.

**B. Offscreen Documents (`offscreen`) [Chromium only]**
- **Purpose:** Creates an isolated, invisible offscreen document to host the WebAssembly and WebGPU neural network runtime without blocking browser UI responsiveness or main thread interactions.

**C. Host Permissions (`host_permissions`)**
- **Purpose:** Restricted exclusively to:
  - `https://huggingface.co/*` / `https://*.hf.co/*`: To download public open-source ONNX model files once into local browser cache.
  - `https://www.google.com/recaptcha/*` / `https://*.recaptcha.net/*`: To inject the native checkmark button into the challenge frame and simulate assistive input.

**D. Browser Specific Settings (Firefox Gecko ID: `captcha-solver@tkno`)**
- **Purpose:** Required by Mozilla Firefox for extension identification, sandboxing, and Manifest V3 add-on compliance.


### 4. Safety & Content Handling Policy:

Captcha solver strictly complies with modern web extension security and sandbox standards:

- **Strict Local Execution:** All core runtime code—including ONNX Runtime WebAssembly modules (`ort/`)—is bundled locally within the extension archive. Remote code execution (`eval`, dynamic script injection, or remote CDN script loading) is strictly forbidden under our Content Security Policy (`script-src 'self' 'wasm-unsafe-eval'`).
- **Zero Data Exfiltration:** The extension possesses no analytics backends, telemetry servers, or telemetry tracking beacons.
- **Native Toolbar Integration:** Controls are cleanly mounted into the native reCAPTCHA button group without obscuring native buttons, injecting arbitrary third-party iframes, or intercepting host page interactions.


### 5. Data Sharing, Analytics & Advertising:

- **No Data Sharing:** Zero user data, audio recordings, or transcripts leave your computer.
- **No Third-Party Analytics / Telemetry:** Captcha solver contains no telemetry SDKs, Google Analytics, Firebase, or tracking beacons.
- **No Advertisements:** Captcha solver is entirely ad-free, non-commercial, and contains no affiliate trackers.


### 6. Data Retention & Lifecycle:

- **Zero Data Retention:** Because Captcha solver does not operate external servers, no user data or audio history is ever stored or logged externally.
- **Complete Local Removal:** Uninstalling or removing the extension from your browser immediately ceases all script execution, removes the extension from memory, and clears all stored preferences and cached model files.


### 7. Managing Permissions & User Rights:

You maintain total control over Captcha solver. You may review, disable, or remove the extension at any time:

- **Chromium Browsers (Chrome, Edge, Brave, Opera, Vivaldi):** Navigate to `chrome://extensions/` (or `edge://extensions/`), locate **Captcha solver**, and toggle it off or click **Remove**.
- **Mozilla Firefox:** Navigate to `about:addons` > **Extensions**, locate **Captcha solver**, and choose **Disable** or **Remove**.


### 8. Contact & Support:

If you have any questions, feedback, or concerns regarding this Privacy Policy or the security of Captcha solver, please contact:  
**Email:** hamzabellouchcontact@gmail.com  
**GitHub:** [https://github.com/hamzabellouch/captcha-solver-ex](https://github.com/hamzabellouch/captcha-solver-ex)


-------------------------------------------



# سياسة الخصوصية - Captcha solver

آخر تحديث: ٢٥ أكتوبر ٢٠٢٦


### ٠. القاعدة رقم ٠: إخلاء المسؤولية عن الإضافات المعدلة والحزم الخارجية والمشاريع المشتقة:

* **سلامة المصدر الأصلي:** تنطبق سياسة الخصوصية، وضمانات الأمان، والميزات المذكورة في هذه الوثيقة حصرياً وصراحةً على الإصدارات الرسمية غير المعدلة من الإضافة والشفرة المصدرية المنشورة مباشرة عبر هذا المستودع الأصلي المعتمد ([hamzabellouch/captcha-solver-ex](https://github.com/hamzabellouch/captcha-solver-ex)) وصفحة إصداراته الرسمية فقط.
* **إخلاء المسؤولية التام عن الحزم المشتقة أو المعدلة:** نحن (الناشر والمطور) **لا نتحمل أي مسؤولية أو التزام قانوني من أي نوع** عن أي نسخ معدلة، أو حزم خارجية غير رسمية بصيغ (`.crx` / `.xpi` / `.zip`)، أو مشاريع مشتقة تم التلاعب بها ولم تصدر مباشرة من هذا المستودع. استخدامك لأي نسخ خارجية يكون بالكامل على مسؤوليتك الشخصية.


### ١. الملخص التنفيذي ونطاق العمل:

إضافة Captcha solver هي أداة مساعدة رقمية موجهة لتمكين ذوي الاحتياجات الخاصة (كفاقدي البصر وذوي الإعاقات الحركية) من تجاوز تحديات reCAPTCHA الصوتية تلقائياً وبسهولة تامة، مع الالتزام الصارم والكامل بمبادئ الخصوصية وحماية البيانات.

#### التزام الخصوصية الجوهري:
تعمل إضافة Captcha solver **محلياً بنسبة ١٠٠٪ على جهاز المستخدم**. يتم فك تشفير الصوت وتحليله وتفريغه صوتياً بالكامل داخل ذاكرة المتصفح عبر الذكاء الاصطناعي المحلي (OpenAI Whisper عبر محرك ONNX Runtime Web). نحن **لا نجمع**، ولا نخزن، ولا ننقل، ولا نشارك، ولا نبيع أي تسجيلات صوتية، أو نصوص مفرغة، أو سجلات تصفح، أو عناوين IP لأي خوادم خارجية أو أطراف ثالثة.


### ٢. البيانات والمعالجة المحلية داخل الجهاز:

لتقديم خدمة المساعدة الصوتية محلياً، تقوم الإضافة بالعمليات التالية **حصرياً داخل متصفحك**:

* **معالجة دفق الصوت محلياً:** عند بدء الحل، تلتقط الإضافة رابط التحدي الصوتي وتقوم بتحويل الإشارة الصوتية إلى صيغة (16 kHz Mono PCM) مباشرة داخل ذاكرة الـ RAM عبر واجهات `AudioContext` القياسية في المتصفح.
* **استنتاج الذكاء الاصطناعي على الجهاز (On-Device AI):** تتم معالجة الصوت ونموذج Whisper بالكامل عبر تقنيات WebGPU و WebAssembly المدمجة في المتصفح (`ort/`). لا يتم إرسال أي مقطع صوتي إلى واجهات سحابية مثل OpenAI Cloud أو Google Cloud أو Wit.ai أو خوادم التخطي المدفوعة.
* **التخلص الفوري من الذاكرة المؤقتة:** يتم تفريغ ومسح مصفوفات الصوت والبيانات المؤقتة من الذاكرة بمجرد اكتمال عملية التفريغ الصوتي وإدخال الأرقام.
* **حفظ الإعدادات محلياً:** يتم تخزين تفضيلات المستخدم (مثل اختيار النموذج وتسريع العتاد والحل التلقائي) محلياً فقط عبر `chrome.storage.local` ولا تغادر جهازك أبداً.
* **النموذج مدمج محلياً بالكامل:** يتم تضمين ملفات النموذج المفتوح (~42 ميجابايت لـ `whisper-tiny.en`) مسبقاً وبشكل كامل ضمن ملفات الإضافة في مجلد `models/`، وبالتالي لا يتم إجراء أي طلب تحميل عبر الإنترنت إطلاقاً، وتعمل الإضافة محلياً (Offline) بنسبة 100% فور تثبيتها.
* **عدم مراقبة التصفح:** تعمل الإضافة حصرياً داخل إطارات كابتشا جوجل (`bframe`) ولا تطلع نهائياً على محتويات المواقع الأخرى أو سجل تصفحك.


### ٣. الأذونات المستخدمة وأسبابها:

تلتزم الإضافة بمبدأ الحد الأدنى من الأذونات (Principle of Least Privilege):

**أ. التخزين (`storage`)**
* **الغرض:** حفظ تفضيلات المستخدم وخيارات الإتاحة محلياً على الجهاز لضمان بقائها بين جلسات التصفح.

**ب. المستندات غير المرئية (`offscreen`) [لمتصفحات كروم]**
* **الغرض:** استضافة محرك الذكاء الاصطناعي (WASM/WebGPU) في بيئة معزولة خلف الكواليس دون التأثير على سلاسة واجهة المستخدم.

**ج. أذونات النطاقات (`host_permissions`)**
* **الغرض:** مقيدة حصرياً بنطاقين:
  * `https://huggingface.co/*`: لتنزيل أوزان نموذج Whisper وتخزينها محلياً لمرة واحدة.
  * `https://www.google.com/recaptcha/*`: لحقن علامة الصح وإدخال الحل في إطار الكابتشا.

**د. معرف فايرفوكس (`captcha-solver@tkno`)**
* **الغرض:** مطلوب من قبل موزيلا فايرفوكس لتعريف الإضافة وضمان توافقها مع نظام Manifest V3.


### ٤. سياسة الأمان ومحاصرة البيانات:

* **تنفيذ محلي صارم:** لا تحتوي الإضافة على أي كود برمجي بعيد أو استخدام لـ `eval`؛ جميع ملفات ONNX Runtime مدمجة محلياً في مجلد `ort/` طبقاً لسياسة أمان المحتوى الصارمة.
* **انعدام الاتصال الخارجي:** لا تملك الإضافة أي خوادم تتبع أو نقاط اتصال خلفية (Zero Telemetry).
* **تكامل أصلي مع الواجهة:** يتم حقن زر علامة الصح بسلاسة داخل شريط أزرار reCAPTCHA دون حجب الأزرار الأصلية.


### ٥. مشاركة البيانات والإعلانات:

* **انعدام المشاركة:** لا تخرج أي بيانات أو أصوات أو نصوص خارج حاسوبك على الإطلاق.
* **انعدام التتبع والتحليلات:** خالية تماماً من أدوات Google Analytics أو حزم التتبع السلوكي.
* **انعدام الإعلانات:** أداة مجانية ونظيفة لا تعرض أي محتوى إعلاني.


### ٦. دورة حياة البيانات والحذف:

* **انعدام الاحتفاظ بالبيانات:** لا توجد خوادم خارجية لتخزين البيانات من الأساس.
* **الحذف الكامل:** بمجرد إزالة الإضافة من المتصفح، يتم إيقاف تنفيذها ومسح جميع الإعدادات وملفات النماذج المخزنة في الذاكرة المؤقتة فوراً.


### ٧. إدارة الأذونات وحقوق المستخدم:

يمكنك تعطيل أو حذف الإضافة في أي وقت عبر إعدادات المتصفح:
* **متصفحات كروم وإيدج وبريف:** اذهب إلى `chrome://extensions/`، وابحث عن **Captcha solver** واختر إزالة (Remove).
* **متصفح فايرفوكس:** اذهب إلى `about:addons`، وابحث عن **Captcha solver** واختر إزالة (Remove).


### ٨. التواصل والدعم:

لأي استفسارات أو بلاغات تخص الخصوصية، يرجى التواصل عبر:  
**البريد الإلكتروني:** hamzabellouchcontact@gmail.com  
**GitHub:** [https://github.com/hamzabellouch/captcha-solver-ex](https://github.com/hamzabellouch/captcha-solver-ex)
