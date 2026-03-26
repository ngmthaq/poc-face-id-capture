# @ngmthaq/react-face-id-capture

React component for face registration with real-time face detection and multi-angle capture. Guides users through capturing 6 face poses (center, left, right, up, down, tilt) using AI-powered face detection.

## Installation

```bash
yarn add @ngmthaq/react-face-id-capture
```

### Peer Dependencies

```bash
yarn add react react-dom i18next react-i18next
```

> `i18next` and `react-i18next` are optional — the component will auto-initialize i18n if your app doesn't already use it.

## Quick Start

```tsx
import { FaceRegister } from "@ngmthaq/react-face-id-capture";

function App() {
  return (
    <FaceRegister
      onComplete={(captures) => {
        // captures: array of 6 face images
        captures.forEach((c) => {
          console.log(c.step); // "center" | "left" | "right" | "up" | "down" | "tilt"
          console.log(c.data); // base64 JPEG data URL
        });
      }}
      onExit={() => {
        // Called when user taps back on intro or discard on result screen
        console.log("User exited");
      }}
    />
  );
}
```

## Props

| Prop           | Type                            | Description                                                                     |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| `onComplete`   | `(captures: Capture[]) => void` | Called when all 6 face images are captured and user taps "Save & Continue"      |
| `onExit`       | `() => void`                    | Called when user taps back on intro screen or "Discard & Exit" on result screen |
| `locale`       | `string`                        | Override the active language (`"en"`, `"ja"`, or custom)                        |
| `translations` | `FaceRegisterTranslations`      | Override or extend translation strings                                          |

## Capture Object

```ts
interface Capture {
  step: "center" | "left" | "right" | "up" | "down" | "tilt";
  labelKey: string;
  data: string; // base64 JPEG data URL
}
```

## Internationalization

Built-in languages: English (`en`) and Japanese (`ja`).

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
    // ... all keys
  }}
  onComplete={handleComplete}
/>
```

### All Translation Keys

| Key                 | Default (EN)                                |
| ------------------- | ------------------------------------------- |
| `introTitle`        | Face Registration                           |
| `introSub`          | Set up your face profile for identification |
| `introStep1`        | Position your face within the oval frame    |
| `introStep2`        | Follow the crosshair by moving your head    |
| `introStep3`        | Hold still during the countdown to capture  |
| `getStarted`        | Get Started                                 |
| `back`              | Back                                        |
| `hudTitle`          | Face Registration                           |
| `hudProgress`       | {{current}} / {{total}}                     |
| `stepCenter`        | Look straight ahead                         |
| `stepLeft`          | Turn your face left                         |
| `stepRight`         | Turn your face right                        |
| `stepUp`            | Tilt your face up                           |
| `stepDown`          | Tilt your face down                         |
| `stepTilt`          | Tilt your head sideways                     |
| `outsideOval`       | Move your face into the oval                |
| `maskWarning`       | We need to see your full face               |
| `maskWarningDetail` | Make sure nothing is covering your face     |
| `resultTitle`       | Registration Complete                       |
| `resultSub`         | {{count}} face images captured successfully |
| `registerAgain`     | Register Again                              |
| `save`              | Save & Continue                             |
| `discard`           | Discard & Exit                              |
| `loadingModels`     | Loading face detection models...            |

## Exported Types

```ts
import type {
  Capture,
  FaceRegisterProps,
  FaceRegisterTranslations,
  StepName,
} from "@ngmthaq/react-face-id-capture";
```

## How It Works

1. **Intro Screen** — Instructions with a "Get Started" button
2. **Capture Screen** — Camera feed with an oval overlay and crosshair guide. The component detects the user's face in real-time and validates head position (yaw, pitch, roll). When the pose matches, a countdown triggers and the frame is captured automatically.
3. **Result Screen** — Displays all 6 captured images in a grid with "Save & Continue", "Register Again", and "Discard & Exit" options.

## Requirements

- HTTPS required for camera access (except `localhost`)
- Face detection models are loaded from CDN (`@vladmandic/face-api`)
- Works on desktop and mobile browsers

## License

MIT
