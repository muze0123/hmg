import { useI18n } from 'vue-i18n';
import type { Format, Status } from './data/testing';
export function useTestingLabels() {
  const { t } = useI18n();
  const statusLabel = (code: Status) => t(`taskStatus.${code}`);
  const formatLabel = (code: Format) => t(`testing.formats.${code}`);
  const priorityLabel = (code: string) => t(`testing.priorities.${code}`);
  const itemLabel = (code: string) => t(`testing.items.${code}`);
  const tagLabel = (code: string) => t(`testing.tags.${code}`);
  const resultLabel = (code: string) => t(`testing.results.${code}`);
  return { statusLabel, formatLabel, priorityLabel, itemLabel, tagLabel, resultLabel };
}
