import { useI18n } from 'vue-i18n';
export function useProjectLabels() { const { t } = useI18n(); return (code: string) => t(`projects.${code}`); }
