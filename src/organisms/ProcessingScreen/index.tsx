import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";

export default function ProcessingScreen() {
  const { t } = useTranslate();

  return (
    <div style={S.processing}>
      <div style={S.spinner} />
      <div style={S.processingTitle}>{t("faceRegister.processingTitle")}</div>
    </div>
  );
}
