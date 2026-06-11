# Coding Conventions

> Conventions discovered from the codebase and approved by the project owner. There is **no ESLint, Prettier, or EditorConfig** in this repo — these rules are enforced by convention and by TypeScript strict mode.

---

## 1. Project Structure (atomic design)

```
src/
├── index.ts                    # Public barrel — re-exports FaceRegister + public types
├── App.tsx / main.tsx          # Local dev harness, not bundled into the library
├── atoms/                      # Smallest UI primitives (currently empty — reserved)
├── molecules/                  # Composed UI built from atoms (LoadingOverlay, SvgOverlay)
├── organisms/                  # Domain-coupled compositions (IntroScreen, CaptureScreen, ResultScreen)
├── templates/                  # State-machine / layout shells (FaceRegister)
└── shared/                     # Cross-layer building blocks
    ├── constants/              # Tokens, STEPS, geometry, internal types
    ├── hooks/                  # useCamera, useFaceModels, useFaceDetection
    ├── i18n/                   # ensureI18n() + locale bundles
    ├── styles/                 # CSS-in-JS object + injectStyles()
    ├── types/                  # Public types (Capture, FaceRegisterProps, etc.)
    └── utils/                  # Pure functions (faceCalculations, curveOffsets)
```

Rules:

- Each atomic-layer folder (`molecules/`, `organisms/`, `templates/`) contains one PascalCase subfolder per component, with the component itself at `index.tsx`. Consumers import via `../<layer>/<Component>` — the folder name resolves to its `index.tsx`.
- Layer placement reflects coupling: atoms are pure primitives, molecules compose atoms with no domain logic, organisms know about FaceRegister-specific state, templates orchestrate organisms.
- `pages/` is intentionally omitted — the library has no page; the consuming app owns the page layer.
- Cross-layer reuse lives in `shared/` (hooks, utils, constants, types, styles, i18n). No barrel `index.ts` re-exports inside `shared/` subfolders — files are imported by their direct path.
- Only `src/index.ts` is a public re-export barrel.

---

## 2. Naming

| Item                            | Convention              | Example                                                   |
| ------------------------------- | ----------------------- | --------------------------------------------------------- |
| Component files                 | PascalCase `.tsx`       | `CaptureScreen.tsx`                                       |
| Hook files                      | camelCase, `use` prefix | `useFaceDetection.ts`                                     |
| Util files                      | camelCase               | `faceCalculations.ts`                                     |
| Component folder                | PascalCase              | `FaceRegister/`, `LoadingOverlay/`                        |
| Atomic-layer folders            | lowercase               | `molecules/`, `organisms/`, `templates/`, `shared/hooks/` |
| Components / types / interfaces | PascalCase              | `FaceRegister`, `Capture`, `StepDef`                      |
| Hooks / vars / functions        | camelCase               | `useCamera`, `calcYaw`                                    |
| Constants                       | `SCREAMING_SNAKE_CASE`  | `STEPS`, `COUNTDOWN_MS`, `ACCENT`                         |
| i18n keys                       | dotted `feature.key`    | `faceRegister.labelCenter`                                |

---

## 3. Imports

- Use **relative paths only** — no path aliases.
- Use `import type { ... }` for type-only imports (required by `verbatimModuleSyntax: true` in `tsconfig.app.json`).
- Order: external packages first (`react`, `@vladmandic/face-api`), then internal modules.
- Barrel exports only at the public boundary (`src/index.ts`). Don't add `index.ts` re-export barrels inside `shared/hooks/`, `shared/utils/`, etc.
- Inside an atomic-layer component folder (e.g. `molecules/LoadingOverlay/`), the component lives at `index.tsx` so callers can `import LoadingOverlay from "../../molecules/LoadingOverlay"`. The `index.tsx` here IS the component (default export), not a re-export barrel — this is the only place where `index.tsx` is used as a folder entry.

---

## 4. Formatting

- 2-space indentation.
- Double quotes for strings.
- Semicolons required.
- Trailing commas in multi-line literals.
- TypeScript `strict: true`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`.

---

## 5. React Patterns

- **Default-exported components**: `export default function ComponentName(...)`.
- **Props are a named `interface`** declared directly above the component, named `<Component>Props`.
- **Hooks return objects, not tuples** — `{ videoRef, startCamera, stopCamera }` rather than `[videoRef, startCamera, stopCamera]`.
- **State machine via discriminated unions** (e.g. `type Screen = "intro" | "capture" | "result"`) over multiple booleans.
- **`useCallback` / `useMemo`** for any value/function passed into other hooks or memoized children.
- **CSS-in-JS objects** live in `styles/index.ts` exported as `S`. Keyframes are injected once via `injectStyles()` on mount.
- **JSX comments** only for non-obvious geometry/layout markers (`{/* HUD top */}`). Don't narrate what JSX clearly says.

---

## 6. Comments & Documentation

- Default: **no comments**.
- JSDoc only on **exported functions where behavior isn't obvious from the name** (examples: `getSvgDims`, `ensureI18n`).
- Section markers inside large functions/objects use `/* ── label ── */` (block) or `// ── label ──` (line) to separate logical phases.
- Never explain what a well-named identifier already says.
- Never reference tickets, PRs, or "added for X" — that belongs in commit messages.

---

## 7. Error Handling

- **No defensive try/catch.** Failures propagate to the host application (e.g. `getUserMedia` rejection bubbles up).
- Use optional chaining + nullish coalescing for nullable refs and indexed lookups:
  - `streamRef.current?.getTracks()`
  - `STEPS[idx] ?? STEPS[0]`
- This is a library — the **host app owns user-facing error UX**.

---

## 8. Internationalization

- Every user-visible string must go through `react-i18next`'s `t()`. **No hardcoded UI strings.**
- Built-in `en` + `ja` resource bundles in `src/shared/i18n/locales/`.
- Consumer overrides via the `translations` prop are deep-merged in `ensureI18n()`.
- Call `ensureI18n()` **synchronously before first render** so `t()` is ready immediately (the FaceRegister component does this).
- Detect `i18n.isInitialized` before initializing — don't break a host app that already uses i18next.
- All keys live under the `faceRegister.` namespace.

---

## 9. Geometry & Numeric Constants

- Magic numbers belong in `src/shared/constants/faceRegister.ts` (`SVG_WIDTH`, `SVG_HEIGHT`, `OVAL_CX`, `OVAL_RX`, `COUNTDOWN_MS`, `MASK_THRESHOLD`, `MISS_GRACE`, etc.).
- Per-step yaw/pitch/roll thresholds are **inlined inside `STEPS[]`** because they're tightly coupled to each step's intent — extracting them would obscure the relationship.

---

## 10. Logging

- Dev-only logs guarded by `import.meta.env.DEV`.
- No `console.log` in production builds. No log libraries.

---

## 11. Public API Surface

- `src/index.ts` is the **only** entry consumers import from. It re-exports:
  - `FaceRegister` (default)
  - Types: `Capture`, `FaceRegisterProps`, `FaceRegisterTranslations`, `StepName`
- Anything **not** re-exported from `src/index.ts` is private and may change without a major version bump.
- `tsconfig.build.json` controls the published `.d.ts` surface — keep its `include` list aligned with what's actually public.

---

## 12. Testing

This project follows the **Skip-Testing** workflow — no automated tests are currently in place. Verification is done manually via the Vite dev server (`yarn dev`) on HTTPS. If tests are added later, update this section.
