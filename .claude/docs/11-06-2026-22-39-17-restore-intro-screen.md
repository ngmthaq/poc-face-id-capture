- Author: Root Agent
- Title: Plan — Restore the Intro Screen
- Classification: feature
- Description: Re-create the `IntroScreen` organism from git and re-wire it as the landing screen in the `FaceRegister` state machine.

---

## Approach Summary

- Restore `src/organisms/IntroScreen/index.tsx` from its last-known-good version (commit `d3eca70`), since all its dependencies (styles, translations, theme, `useTranslate`) still exist unchanged.
- Add `"intro"` back to the `Screen` union, set it as the initial screen, and render it with an `onStart` handler that advances to `"capture"`.
- The existing camera-start effect already keys off `screen === "capture"`, so no camera-lifecycle changes are needed — the camera stays off until "Get Started" is pressed.

## Functional Requirements

- On mount, `FaceRegister` shows the IntroScreen (icon, title, subtitle, 3 steps, "Get Started").
- Tapping **Get Started** transitions to the capture screen and starts camera + recording.
- If `onExit` is provided, the intro shows a **Back** button that calls it.
- New flow: `intro → capture → processing → result`.
- Camera does not activate until "Get Started" is pressed.

## Non-Functional Requirements

- Match existing conventions (default export, `<Component>Props` interface, relative imports, `import type`, 2-space/double-quote/semicolons).
- No new strings — reuse existing i18n keys (en + ja already cover it).

## Files in Scope

- Create: `src/organisms/IntroScreen/index.tsx` (restored from `d3eca70`)
- Modify: `src/shared/types/screen.ts` (add `"intro"`)
- Modify: `src/templates/FaceRegister/index.tsx` (import, initial state `"intro"`, `handleStart`, render block)

## Risks & Assumptions

- Assumes the intro should be the default landing screen (standard interpretation of "restore").
- Assumes the original 3-step intro design is wanted as-is (translations already match it).
- The removed `RetryScreen` is out of scope — only the intro is restored.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                     | Responsible Role | Dependencies | Skills       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------ | ------------ |
| 1   | TODO   | Restore `src/organisms/IntroScreen/index.tsx` from commit `d3eca70` verbatim                                                                                             | developer        | none         | `clean-code` |
| 2   | TODO   | Add `"intro"` to the `Screen` union in `src/shared/types/screen.ts`                                                                                                      | developer        | none         | `clean-code` |
| 3   | TODO   | Wire IntroScreen into `FaceRegister`: import, initial state `"intro"`, add `handleStart` (→ `"capture"`), render `<IntroScreen onStart={handleStart} onExit={onExit} />` | developer        | 1, 2         | `clean-code` |

> Testing: project workflow is Skip-Testing — no tester sub-agent; verification is manual via `yarn dev`.
