import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";

interface RetryScreenProps {
  onRetry: () => void;
  onExit?: () => void;
}

export default function RetryScreen({ onRetry, onExit }: RetryScreenProps) {
  const { t } = useTranslate();

  return (
    <div style={S.retry}>
      {onExit && (
        <button style={S.backBtn} onClick={onExit}>
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
      <div style={S.retryIcon}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff6b6b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      <div style={S.retryTitle}>{t("faceRegister.retryTitle")}</div>
      <div style={S.retrySub}>{t("faceRegister.retrySub")}</div>
      <button style={S.btn} onClick={onRetry}>
        {t("faceRegister.retryButton")}
      </button>
    </div>
  );
}
