# Onboarding Diagnostics — 2026-05-13

Generated during the `/onboarding` workflow. Contains the threat model, security findings, and clean-code findings for the `@ngmthaq20/react-face-id-capture` library at HEAD `fea85c7` (version 1.0.7).

---

## 1. Threat Model (one paragraph)

React **frontend library** (`@ngmthaq20/react-face-id-capture`). No backend, no DB, no command execution, no LLM. Trust boundaries:

1. Props supplied by the host app (`locale`, `translations`).
2. The user's camera stream via `getUserMedia`.
3. Face-detection ML models loaded at runtime from `cdn.jsdelivr.net/npm/@vladmandic/face-api/model`.

Captured face images stay in-browser and are handed back to the host via `onComplete` — the library performs no network transmission of user data. Attack surface is small: CDN supply-chain (model integrity), host-supplied translations, and the dev-time build/server.

---

## 2. Security Findings

```
CRITICAL: 0   HIGH: 1   MEDIUM: 2   LOW: 1   INFO: 1
```

All HIGH/MEDIUM findings are in build-time / dev-only dependencies.

### [SEC-001] Arbitrary File Read via Vite Dev Server WebSocket

- **Severity:** HIGH (CVE-2026-39363, CWE-200/306) — downgraded to MEDIUM in context (dev-only, but `package.json:46` runs `vite --host` which explicitly exposes the dev server to the LAN).
- **Location:** `package.json:80` — `vite: ^6.3.5` resolved to `6.4.1`.
- **Impact:** When `yarn dev` is run on an untrusted network, an attacker who can reach the dev port can use the HMR WebSocket without an `Origin` header to read arbitrary files (`/etc/passwd`, `.env`, ssh keys) from the developer's machine.
- **Fix:** Upgrade `vite` to `>= 6.4.2` (patch line) or `7.3.2+` / `8.0.5+`.
  ```bash
  yarn add -D vite@^6.4.2
  ```
- **Effort:** Low.

### [SEC-002] Vite Path Traversal in `.map` Handling

- **Severity:** MEDIUM (CVE-2026-39365, CWE-22/200).
- **Location:** Same `vite` version as SEC-001.
- **Impact:** With `vite --host`, `.map` files outside the project root can be retrieved by injecting `../` segments under the optimized-deps URL prefix.
- **Fix:** Same `vite` upgrade as SEC-001.
- **Effort:** Low.

### [SEC-003] PostCSS XSS via Unescaped `</style>` in Stringify Output

- **Severity:** MEDIUM (CVE-2026-41305, CWE-79) — downgraded to LOW in context (transitive build tool; this project doesn't accept user CSS at build time).
- **Location:** `vite > postcss@8.5.8`.
- **Impact:** Exploitable only if the build pipeline parses untrusted CSS and re-stringifies it into an HTML `<style>` block — not the case here.
- **Fix:** Resolved by bumping `vite` (transitive), or pin `postcss: ^8.5.10` via `resolutions` in `package.json`.
- **Effort:** Low.

### [SEC-004] Face Detection Model Loaded From CDN Without Subresource Integrity

- **Severity:** LOW (CWE-494 — Supply Chain).
- **Location:** `src/FaceRegister/constants/index.ts:119` — `https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model`.
- **Evidence:** Models are fetched at runtime by `@vladmandic/face-api`. No SRI hash, no version pin in the URL path. If jsDelivr were compromised, malicious model files would be served and consumed by users' browsers.
- **Impact:** Compromised models could degrade detection or be crafted to crash the detector. Direct RCE is unlikely (tensor files, not JS), but the library has no fallback or fail-safe.
- **Fix (in order of effort):**
  1. Pin the version in the URL: `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model`.
  2. Self-host the models in the consumer's public folder; add a `modelBaseUrl` prop.
  3. Document the CSP/origin trade-off so security-sensitive consumers can serve from their own origin.
- **Effort:** Low (option 1) → Medium (options 2–3).

### [SEC-005] i18n `escapeValue: false` — Safe Today, Fragile to Future Changes

- **Severity:** INFO (CWE-79 — pattern, not a live bug).
- **Location:** `src/i18n/index.ts:39`.
- **Evidence:** `interpolation: { escapeValue: false }` disables i18next's own HTML escaping. This is the recommended setting for react-i18next because React escapes children automatically — and the codebase currently has **no** `dangerouslySetInnerHTML`, no `innerHTML`, and no manual `.html()` rendering, so all `t(...)` output is safely escaped by React.
- **Risk:** A future change that pipes `t(key)` into `dangerouslySetInnerHTML` (e.g. for an HTML-rich error message) would become reflected XSS, because consumer-supplied `translations` can contain arbitrary HTML.
- **Fix:** Document the rule "translation output must never reach `dangerouslySetInnerHTML`" in `CODING_CONVENTIONS.md`. If rich text is ever required, sanitize first (DOMPurify).
- **Effort:** Documentation only.

### Items checked and clean

| Class                                                                                        | Result                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Hardcoded secrets                                                                            | None (secret-scanner clean across 20 source files)     |
| SQL Injection                                                                                | N/A (no DB)                                            |
| Command Injection                                                                            | None — no `exec`, `child_process`, `os.system`         |
| SSRF                                                                                         | None — only one outbound URL (CDN, hardcoded constant) |
| CSRF                                                                                         | N/A (no server)                                        |
| XSS sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`) | None                                                   |
| Insecure auth / IDOR                                                                         | N/A                                                    |
| LLM / prompt injection / tool abuse                                                          | N/A                                                    |

---

## 3. Clean-Code Findings

Evaluated against **Atomic Design → SoC → DRY → KISS** (UI/Component context).

```
SoC: 2   DRY: 2   KISS: 3   Atomic Design: 0
```

### Atomic Design — Pass

The codebase uses a flat `components/` directory rather than `atoms/molecules/organisms/`. For a single-feature library with ~5 sub-components, the spirit is preserved:

- No data fetching below the top-level `FaceRegister/index.tsx`.
- No hierarchy inversions.
- `LoadingOverlay`, `SvgOverlay` ≈ atoms/molecules; `IntroScreen`, `CaptureScreen`, `ResultScreen` ≈ organisms/templates; `FaceRegister/index.tsx` ≈ the page-equivalent.

No action needed.

### [CC-001] `useFaceDetection` mixes 5 concerns (SoC / SRP)

- **Location:** `src/FaceRegister/hooks/useFaceDetection.ts`.
- **Evidence:** A single ~200-line `runDetection` closure handles:
  1. Face-API detection loop & retry timing.
  2. Mask-detection frame counter state machine (`maskFrames`/`noMaskFrames`/thresholds).
  3. Pose validation (delegating to utils — OK).
  4. Countdown / "lose match grace" state machine (`isMatched`, `cdStart`, `missCount`).
  5. Step transition orchestration (capture frame, advance index, terminate on last step, screen transition).
- **Why it matters:** Five separate reasons to change converge here. Adding a new pose, changing mask logic, tuning countdown timing, or refactoring the parent's state shape all touch the same function. The 11-callback `DetectionCallbacks` interface (lines 23-36) is the symptom — clients have to know every internal state setter.
- **Refactor sketch:**

  ```ts
  function createMaskDetector(threshold: number) {
    let mask = 0, noMask = 0;
    return (frameHasMask: boolean) => { /* returns 'mask' | 'clear' | null */ };
  }

  function createMatchTracker(grace: number, countdownMs: number) { ... }

  type DetectionEvent =
    | { kind: 'mask-warning'; on: boolean }
    | { kind: 'pose'; svgPos: Point; isCentered: boolean; passes: boolean }
    | { kind: 'step-captured'; capture: Capture }
    | { kind: 'all-steps-done' };
  ```

  The hook returns events; the component owns reducer-driven state.

- **Effort:** Medium (1–2 days).

### [CC-002] `FaceRegister/index.tsx` owns 10 `useState`s + threads 11 setters down

- **Location:** `src/FaceRegister/index.tsx:40-51`, `60-76`.
- **Evidence:** The `detectionCallbacks` memoized object exists only because so many pieces of state are managed at this level. The hook then writes to them imperatively.
- **Fix:** Replace the 10 `useState`s with one `useReducer<DetectionState, DetectionAction>`. The hook (after CC-001) dispatches semantic actions instead of poking 11 setters.
- **Effort:** Medium — couples with CC-001.

### [CC-003] "Reset match/countdown" 7-line block duplicated (DRY)

- **Location:** `useFaceDetection.ts:202-210` and `:213-220`.
- **Fix:** Extract a local helper inside `runDetection`:
  ```ts
  const loseMatch = () => {
    if (isMatched && ++missCount >= MISS_GRACE) {
      isMatched = false;
      cdStart = 0;
      missCount = 0;
      callbacks.setMatched(false);
      callbacks.setCountdownActive(false);
    } else if (!isMatched) {
      missCount++;
    }
  };
  ```
- **Effort:** Low.

### [CC-004] Dev-log boilerplate repeated (DRY)

- **Location:** `useFaceDetection.ts:120-124` and `:155-159`.
- **Fix:** One `const devLog = isDev ? console.log.bind(console, '[FaceReg]') : () => {}` at module scope. Or strip these once the hook is broken up.
- **Effort:** Low.

### [CC-005] `runDetection` exceeds the 30-second readability test (KISS)

- **Location:** Same hook. Six mutable variables + four levels of nesting + scattered `setTimeout` calls.
- **Fix:** Resolved naturally by CC-001.
- **Severity:** Medium.

### [CC-006] Polling/transition delays are unnamed magic numbers (KISS)

- **Location:**
  - `useFaceDetection.ts:65` — `setTimeout(detect, 200)` (paused-video poll).
  - `:128, :227, :231` — `setTimeout(detect, 100)` (detection poll).
  - `:183` — `setTimeout(..., 350)` (flash duration).
  - `:197` — `setTimeout(..., 400)` (inter-step transition).
  - `index.tsx:102` — `setTimeout(r, 500)` (camera warm-up).
- **Fix:** Add to `constants/index.ts`:
  ```ts
  export const DETECTION_POLL_MS = 100;
  export const VIDEO_PAUSED_POLL_MS = 200;
  export const FLASH_DURATION_MS = 350;
  export const STEP_TRANSITION_MS = 400;
  export const CAMERA_WARMUP_MS = 500;
  ```
- **Effort:** Low (~15 minutes).

### [CC-007] `init()` async function with 4 `if (cancelled) return` guards (KISS)

- **Location:** `FaceRegister/index.tsx:97-113`.
- **Fix:** Optional. Replace with `AbortController` if more async steps are added. Acceptable as-is.
- **Effort:** Low.

### Patterns to preserve

| Pattern                                                                 | Why it's good                                                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `STEPS[]` data-driven step definitions with inline `check()` predicates | Adding a step = data-only, no new conditional. OCP-friendly.                           |
| `faceCalculations.ts` — small pure functions                            | Each function does one thing, testable in isolation. Trigonometry isolated from React. |
| `ensureI18n` lazy bootstrap with `isInitialized` check                  | Doesn't break host apps. SRP-clean.                                                    |
| `useCamera` returns a named object                                      | Self-documenting; renames don't break callers.                                         |
| Discriminated union `Screen` over multiple booleans                     | KISS state model.                                                                      |

---

## 4. Recommended Action Order

1. **Quick security fix (~5 min):**

   ```bash
   yarn add -D vite@^6.4.2 && yarn audit
   ```

   Resolves SEC-001, SEC-002, SEC-003.

2. **Quick clean-code wins (~1 hour):** CC-006 (named timing constants), CC-003 (`loseMatch` helper), CC-004 (`devLog` helper).

3. **Optional CDN hardening:** SEC-004 option 1 (pin `@1.7.14` in the model URL) — 1 line change.

4. **Larger refactor (1–2 days):** Tackle CC-001 + CC-002 together — extract the two state machines into pure helpers, replace the 10 `useState`s with a `useReducer`. Resolves CC-005 as a side effect.

5. **Housekeeping:** Delete `package-lock.json` so future agents don't get confused about the package manager.

6. **Documentation guard:** Add a sentence to `CODING_CONVENTIONS.md` § 8 (i18n): "Translation output must never reach `dangerouslySetInnerHTML`. If rich text is required, sanitize via DOMPurify first." Resolves SEC-005.
