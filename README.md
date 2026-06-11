# @ngmthaq20/react-face-id-capture

React component for face registration with real-time face detection and multi-angle capture. The user slowly rolls their head in a circle while the camera records; the motion is post-processed to automatically select the best frame for each of 6 face angles (center, top, top-left, top-right, left, right) using AI-powered face detection.

## Installation

```bash
yarn add @ngmthaq20/react-face-id-capture
```

### Peer Dependencies

```bash
yarn add react react-dom
```

## Quick Start

```tsx
import { FaceRegister } from "@ngmthaq20/react-face-id-capture";

function App() {
  return (
    <FaceRegister
      locale="en"
      onComplete={(captures) => {
        // captures: array of up to 6 face images
        captures.forEach((c) => {
          console.log(c.step); // "center" | "top" | "topLeft" | "topRight" | "left" | "right"
          console.log(c.labelKey); // translation key for the step label
          console.log(c.data); // base64 JPEG data URL
        });
      }}
      onExit={() => {
        // Called when the user backs out of the intro/result screen
        console.log("User exited");
      }}
    />
  );
}
```

By default the component drops the user straight into the **capture** screen and fires `onComplete` as soon as processing finishes — no intro or result screen. Opt into those screens with `showIntroScreen` and `showResultScreen`:

```tsx
<FaceRegister
  locale="en"
  showIntroScreen
  showResultScreen
  onComplete={handleComplete}
  onExit={handleExit}
/>
```

## Props

| Prop               | Type                            | Default | Description                                                                             |
| ------------------ | ------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `onComplete`       | `(captures: Capture[]) => void` | —       | Called with the selected face images (after processing, or after "Save & Continue")     |
| `onExit`           | `() => void`                    | —       | Called when the user backs out of the intro screen or "Discard & Exit" on the result    |
| `locale`           | `string`                        | —       | Required. Active language (`"en"`, `"ja"`, or custom — falls back to `"en"` if unknown) |
| `translations`     | `FaceRegisterTranslations`      | —       | Override or extend translation strings                                                  |
| `showIntroScreen`  | `boolean`                       | `false` | Show the instructional intro screen before the camera starts                            |
| `showResultScreen` | `boolean`                       | `false` | Show the captured-images review screen before completing                                |

## Capture Object

```ts
interface Capture {
  step: "center" | "top" | "topLeft" | "topRight" | "left" | "right";
  labelKey: string; // translation key for the step label (e.g. "faceRegister.labelCenter")
  data: string; // base64 JPEG data URL
}
```

## How It Works

1. **Intro Screen** _(optional — `showIntroScreen`)_ — Instructions with a "Get Started" button.
2. **Capture Screen** — Camera feed with a circular overlay and a progress ring. The user slowly rolls their head in a circle. The component detects the face in real-time, fills ring ticks as each head angle is swept through, and records the motion. When coverage is complete the ring locks green and recording stops automatically.
3. **Processing Screen** — The recorded motion is sampled into frames and scored against each target pose to pick the best image per angle. If coverage was incomplete, a retry prompt asks the user to sweep more slowly.
4. **Result Screen** _(optional — `showResultScreen`)_ — Displays the captured images with "Save & Continue", "Register Again", and "Discard & Exit" options.

When `showResultScreen` is `false`, `onComplete` fires automatically once processing succeeds.

## Translations

Built-in languages: English (`en`) and Japanese (`ja`). The library ships its own lightweight translation layer — no `i18next` or other i18n peer dependency is required.

### Change language

```tsx
<FaceRegister locale="ja" onComplete={handleComplete} />
```

### Override specific strings

```tsx
<FaceRegister
  translations={{
    introTitle: "Verify Your Identity",
    getStarted: "Begin Scan",
    save: "Confirm & Continue",
  }}
  onComplete={handleComplete}
/>
```

### Add a custom language

```tsx
<FaceRegister
  locale="ko"
  translations={{
    introTitle: "얼굴 등록",
    introSub: "본인 확인을 위해 얼굴 프로필을 설정합니다",
    getStarted: "시작하기",
    // ... other keys
  }}
  onComplete={handleComplete}
/>
```

### All Translation Keys

| Key                    | Default (EN)                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `introTitle`           | Face Registration                                                                            |
| `introSub`             | Set up your face profile for identification                                                  |
| `introStep1`           | Position your face within the circle                                                         |
| `introStep2`           | Slowly roll your head in a circle                                                            |
| `introStep3`           | Hold steady while we capture each angle                                                      |
| `getStarted`           | Get Started                                                                                  |
| `back`                 | Back                                                                                         |
| `hudTitle`             | Face Registration                                                                            |
| `hudProgress`          | {{current}} / {{total}}                                                                      |
| `recordingInstruction` | Slowly roll your head in a circle                                                            |
| `stepCenter`           | Look straight ahead                                                                          |
| `stepTop`              | Tilt your face up                                                                            |
| `stepTopLeft`          | Tilt your face up and left                                                                   |
| `stepTopRight`         | Tilt your face up and right                                                                  |
| `stepLeft`             | Turn your face left                                                                          |
| `stepRight`            | Turn your face right                                                                         |
| `outsideOval`          | Move your face into the oval                                                                 |
| `maskWarning`          | We need to see your full face                                                                |
| `maskWarningDetail`    | Make sure nothing is covering your face                                                      |
| `labelCenter`          | Center                                                                                       |
| `labelTop`             | Top                                                                                          |
| `labelTopLeft`         | Top Left                                                                                     |
| `labelTopRight`        | Top Right                                                                                    |
| `labelLeft`            | Left                                                                                         |
| `labelRight`           | Right                                                                                        |
| `processingTitle`      | Analyzing                                                                                    |
| `processingSub`        | Selecting the best images from your motion...                                                |
| `retryTitle`           | Let's try that again                                                                         |
| `retrySub`             | We couldn't capture every angle. Roll your head a little slower so we can see each position. |
| `retryButton`          | Try Again                                                                                    |
| `resultTitle`          | Registration Complete                                                                        |
| `resultSub`            | {{count}} face images captured successfully                                                  |
| `registerAgain`        | Register Again                                                                               |
| `save`                 | Save & Continue                                                                              |
| `discard`              | Discard & Exit                                                                               |
| `loadingModels`        | Loading face detection models...                                                             |

## Exported Types

```ts
import type {
  Capture,
  FaceRegisterProps,
  FaceRegisterTranslations,
  StepName,
} from "@ngmthaq20/react-face-id-capture";
```

## Requirements

- HTTPS required for camera access (except `localhost`)
- Face detection models are loaded from CDN (`@vladmandic/face-api`)
- Works on desktop and mobile browsers

## License

MIT
