# PROJECT OVERVIEW

---

- **Project Name**: `@ngmthaq20/react-face-id-capture`
- **Project Description**: `React component library for face registration with real-time face detection and multi-angle capture. Guides users through capturing 6 face poses (center, top, top-left, top-right, left, right) using AI-powered face detection. Published to npm as a public package.`
- **Programming Languages**: `TypeScript (TSX/TS, strict mode)`
- **Frameworks**: `React 19, Vite 6 (library build via vite lib mode)`
- **Package Managers**: `Yarn (yarn.lock is authoritative; package-lock.json is stale and should be removed)`
- **Key Libraries**: `@vladmandic/face-api (runtime), i18next + react-i18next (optional peer deps for i18n), @vitejs/plugin-react, @vitejs/plugin-basic-ssl (HTTPS dev server for camera access)`
- **Database**: `N/A (pure frontend library)`
- **Doc Directory**: `.claude/docs/`
- **Testing Workflow**: `Skip-Testing` <!-- Code-First | Test-First | Skip-Testing -->
- **Playwright Check**: `Ask-User` <!-- Always | None | Ask-User -->

> Note: DO NOT edit the checklist template above.

## Additional Informations

### Repository Layout

```
face-id-capture/
├── src/
│   ├── index.ts                      # Public library entry — re-exports FaceRegister + types
│   ├── App.tsx                       # Local dev harness (not bundled into the library)
│   ├── main.tsx                      # Vite dev entry
│   ├── atoms/                        # Reserved (currently empty)
│   ├── molecules/
│   │   ├── LoadingOverlay/index.tsx
│   │   └── SvgOverlay/index.tsx
│   ├── organisms/
│   │   ├── IntroScreen/index.tsx
│   │   ├── CaptureScreen/index.tsx
│   │   └── ResultScreen/index.tsx
│   ├── templates/
│   │   └── FaceRegister/index.tsx    # Main <FaceRegister/> state-machine shell
│   └── shared/
│       ├── constants/faceRegister.ts # STEPS, geometry, internal types
│       ├── types/faceRegister.ts     # Public types (Capture, FaceRegisterProps, etc.)
│       ├── styles/faceRegister.ts    # CSS-in-JS + injectStyles()
│       ├── hooks/                    # useCamera, useFaceModels, useFaceDetection
│       ├── utils/                    # faceCalculations, curveOffsets
│       └── i18n/
│           ├── index.ts              # ensureI18n() — lazy/optional react-i18next bootstrap
│           └── locales/{en,ja}.ts    # Built-in translations
├── dist/                             # Built library output (ESM + CJS + .d.ts)
├── package.json
├── vite.config.ts                    # Library build config (lib mode, externalizes peer deps)
├── tsconfig.app.json                 # Dev/build typecheck config
├── tsconfig.build.json               # Declaration-only emit for published .d.ts
└── README.md
```

### Build & Publish

- `yarn dev` — Vite dev server with HTTPS (required for camera access on non-localhost)
- `yarn build` — typecheck + Vite build (for local verification)
- `yarn build:lib` — produces the published artifacts (ESM, CJS, type declarations) in `dist/`
- `prepublishOnly` hook runs `build:lib` automatically before `npm publish`

### Distribution

- Published to npm as `@ngmthaq20/react-face-id-capture` (public access)
- Dual-format output: `react-face-id-capture.js` (ESM), `react-face-id-capture.cjs` (CJS), `index.d.ts` (types)
- `react`, `react-dom`, `react/jsx-runtime`, `i18next`, `react-i18next` are externalized — consumers provide them
- Face detection models are loaded at runtime from a CDN by `@vladmandic/face-api`

### Runtime Requirements

- HTTPS required for `getUserMedia` (camera) — `localhost` is exempt; `@vitejs/plugin-basic-ssl` handles dev
- Modern browsers with MediaDevices API support

### Tooling Notes

- **No ESLint, Prettier, EditorConfig, or test framework is configured.** Style is enforced by convention / TypeScript strict mode only.
- TypeScript is strict (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`).
