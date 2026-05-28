import { useTranslation } from "react-i18next";
import { libraryI18n } from "../../shared/i18n";
import { S } from "../../shared/styles/faceRegister";

export default function LoadingOverlay() {
  const { t } = useTranslation(undefined, { i18n: libraryI18n });

  return (
    <div style={S.loadingOverlay}>
      <div style={S.spinner} />
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "rgba(255,255,255,.6)",
        }}
      >
        {t("faceRegister.loadingModels")}
      </div>
    </div>
  );
}
