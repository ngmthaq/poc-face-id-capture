import { useTranslation } from "react-i18next";
import { ACCENT } from "../constants";
import { S } from "../styles";

interface IntroScreenProps {
  onStart: () => void;
  onBack?: () => void;
}

export default function IntroScreen({ onStart, onBack }: IntroScreenProps) {
  const { t } = useTranslation();

  return (
    <div style={S.intro}>
      {onBack && (
        <button style={S.backBtn} onClick={onBack}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          {t("faceRegister.back")}
        </button>
      )}
      <div style={S.introIcon}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3H5a2 2 0 0 0-2 2v4" />
          <path d="M15 3h4a2 2 0 0 1 2 2v4" />
          <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
          <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
          <circle cx="12" cy="10" r="3" />
          <path d="M12 13c-2.5 0-5 1.3-5 4v1h10v-1c0-2.7-2.5-4-5-4z" />
        </svg>
      </div>
      <div style={S.introTitle}>{t("faceRegister.introTitle")}</div>
      <div style={S.introSub}>{t("faceRegister.introSub")}</div>
      <div style={S.introSteps}>
        <div style={S.introStep}>
          <div style={S.introStepNum}>1</div>
          <div style={S.introStepText}>{t("faceRegister.introStep1")}</div>
        </div>
        <div style={S.introStep}>
          <div style={S.introStepNum}>2</div>
          <div style={S.introStepText}>{t("faceRegister.introStep2")}</div>
        </div>
        <div style={S.introStep}>
          <div style={S.introStepNum}>3</div>
          <div style={S.introStepText}>{t("faceRegister.introStep3")}</div>
        </div>
      </div>
      <button style={S.btn} onClick={onStart}>
        {t("faceRegister.getStarted")}
      </button>
    </div>
  );
}
