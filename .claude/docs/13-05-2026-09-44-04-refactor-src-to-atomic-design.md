# Refactor src/ to Atomic Design — Approved Plan

> Date approved: 2026-05-13
> Source: party-mode workflow, planner sub-agent response (verbatim below).
> Status at approval time: Blockers resolved by user — see "Resolved Blockers" addendum at the bottom.

---

## Planner Response (verbatim)

- From: planner (sub-agent loaded with the matching role skill)
- To: Root Agent
- Title: Plan Response — Refactor src/ to Atomic Design (no business-logic change)
- Description: Mechanically relocate every existing file from the current feature-folder layout into a 5-layer atomic taxonomy plus a `shared/` folder, preserving file contents byte-for-byte except for relative-import path updates, then realign `tsconfig.build.json` and `CODING_CONVENTIONS.md` so the published `.d.ts` surface and team docs match the new layout.

---

### Approach Summary

- The refactor is a pure structural move: each existing file lands in exactly one new folder based on its atomic role, and only its `import` statements change. No function body, no JSX, no state machine, no geometry constant, no i18n string, and no `useEffect` is touched.
- Public types (`Capture`, `FaceRegisterProps`, `FaceRegisterTranslations`, `StepName`) are extracted from `FaceRegister/constants/index.ts` into `src/shared/types/faceRegister.ts` so the `constants` split doesn't leak into the public API. The template `src/templates/FaceRegister/index.tsx` continues to re-export them, and `src/index.ts` keeps its existing import paths semantically (one path string changes — the exported symbols do not).
- Tasks are ordered so the tree is never broken between commits: each move is paired with import-update in all callers in the same task, and downstream layers move only after their upstream dependencies have already landed in `shared/`.
- `tsconfig.build.json` is updated last (after all source files are in place) so the published `.d.ts` surface is regenerated correctly. `vite.config.ts` references only `src/index.ts` (verified) and needs no change.

### Functional Requirements

- After the refactor, `yarn build` (`tsc -b && vite build`) succeeds with zero TypeScript errors.
- After the refactor, `yarn build:lib` produces `dist/react-face-id-capture.js`, `dist/react-face-id-capture.cjs`, and `dist/index.d.ts`.
- The published `dist/index.d.ts` exports the same four type symbols (`Capture`, `FaceRegisterProps`, `FaceRegisterTranslations`, `StepName`) and the same `FaceRegister` default-component value export.
- The 6-pose face capture flow (intro → capture 6 steps → result) still completes end-to-end against `yarn dev` over HTTPS.
- `src/index.ts` exports exactly the same symbol names as before — no additions, no removals, no renames.
- `injectStyles()` continues to inject the style tag exactly once per page (guard `document.getElementById("face-register-styles")` is preserved verbatim).
- `ensureI18n()` continues to be called synchronously before first render in the template component.
- `i18n` bundles for `en` and `ja` continue to load via the same code path with no timing change.

### Non-Functional Requirements

- **No business-logic changes.** Every function body, every numeric constant, every JSX literal, every CSS-in-JS object remains byte-identical. Only `import` paths and the file's own location may change.
- **No new dependencies.**
- **Relative imports only** — `verbatimModuleSyntax: true` requires every type-only import to use `import type`.
- **No barrel re-export `index.ts` files inside atomic folders** _(adjusted in Resolved Blockers — see below)_.
- **`secret-scanner` check** — verify no secrets, tokens, or credentials are introduced in the moved files.
- **`clean-code` SRP compliance.**
- **Dev harness preserved** — `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts` keep their current location.

### Files in Scope

See the original Files in Scope section. _Adjusted by Resolved Blockers: every `<Component>/<Component>.tsx` path becomes `<Component>/index.tsx`. An empty `src/atoms/` folder is created. `PROJECT_OVERVIEW.md` Repository Layout block is updated (added as Task 25)._

### Risks & Assumptions

- Public-type extraction split preserves the public API only if `src/index.ts` is updated atomically.
- `tsconfig.build.json` `include` list must be realigned or `.d.ts` emit breaks.
- `injectStyles()` single-injection guard must remain in one file.
- `verbatimModuleSyntax: true` requires `import type` to be preserved on every re-pointed type import.
- `noUnusedLocals` / `noUnusedParameters` will fail typecheck if any dead import is left after a move.

---

## Resolved Blockers (addendum from Root Agent based on user decisions at 2026-05-13)

| #   | Question                                                | Resolution                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | atoms/ folder when no atoms exist                       | **Create empty `src/atoms/`** folder. New Task 1.                                                                                                                                                                                                                        |
| Q2  | Folder-per-component file naming                        | **`<Layer>/<Component>/index.tsx`** (e.g. `src/molecules/LoadingOverlay/index.tsx`). `index.tsx` is the component itself, NOT a barrel re-export. CODING_CONVENTIONS.md §3 rule is amended in Task 24 to allow `index.tsx` as the component entry inside atomic folders. |
| Q3  | `.claude/PROJECT_OVERVIEW.md` Repository Layout section | **Update it in this refactor.** New Task 25.                                                                                                                                                                                                                             |
| Q4  | `pages/` folder containing `App.tsx`                    | **Keep `App.tsx` at `src/` root.** Do not create `src/pages/`. `App.tsx` is the Vite dev harness, not a library page.                                                                                                                                                    |

---

## Final Task List (25 tasks, all developer)

| #   | Task                                                                                                                             | Depends on     |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Create empty `src/atoms/` folder                                                                                                 | —              |
| 2   | Create `src/shared/types/faceRegister.ts` (public types: Capture, FaceRegisterProps, FaceRegisterTranslations, StepName)         | —              |
| 3   | Create `src/shared/constants/faceRegister.ts` (values + Screen/StepDef internal types)                                           | 2              |
| 4   | Create `src/shared/styles/faceRegister.ts`                                                                                       | 3              |
| 5   | Create `src/shared/utils/curveOffsets.ts`                                                                                        | 2              |
| 6   | Create `src/shared/utils/faceCalculations.ts`                                                                                    | 3              |
| 7   | Create `src/shared/hooks/useCamera.ts`                                                                                           | —              |
| 8   | Create `src/shared/hooks/useFaceModels.ts`                                                                                       | 3              |
| 9   | Create `src/shared/hooks/useFaceDetection.ts`                                                                                    | 3, 6           |
| 10  | Create `src/shared/i18n/locales/{en,ja}.ts`                                                                                      | —              |
| 11  | Create `src/shared/i18n/index.ts`                                                                                                | 2, 10          |
| 12  | Create `src/molecules/LoadingOverlay/index.tsx`                                                                                  | 4              |
| 13  | Create `src/molecules/SvgOverlay/index.tsx`                                                                                      | 3, 4, 5        |
| 14  | Create `src/organisms/IntroScreen/index.tsx`                                                                                     | 3, 4           |
| 15  | Create `src/organisms/CaptureScreen/index.tsx`                                                                                   | 3, 4, 13       |
| 16  | Create `src/organisms/ResultScreen/index.tsx`                                                                                    | 2, 3, 4        |
| 17  | Create `src/templates/FaceRegister/index.tsx`                                                                                    | 11,12,14,15,16 |
| 18  | Update `src/index.ts` (same exports, new paths)                                                                                  | 17             |
| 19  | Update `src/App.tsx` (one-line import)                                                                                           | 17             |
| 20  | Delete old `src/FaceRegister/` and `src/i18n/` trees                                                                             | 18, 19         |
| 21  | Update `tsconfig.build.json` `include`                                                                                           | 20             |
| 22  | Run `yarn build` + `yarn build:lib`, verify `dist/index.d.ts` public surface                                                     | 21             |
| 23  | Manual verification: `yarn dev` + 6-pose flow end-to-end                                                                         | 22             |
| 24  | Rewrite `.claude/CODING_CONVENTIONS.md` §1 (Project Structure) + §3 (allow `index.tsx` as component entry inside atomic folders) | 20             |
| 25  | Rewrite `.claude/PROJECT_OVERVIEW.md` Repository Layout block                                                                    | 20             |
