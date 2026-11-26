/** Counts fields, never vehicle rows or table cells. Each regulation is counted independently. */
export interface ConfigurationProgress { completed: number; total: number; percent: number }
export function configurationProgress(completed: number, total: number): ConfigurationProgress {
  const done = Math.min(Math.max(0, completed), Math.max(0, total));
  return { completed: done, total, percent: total > 0 ? done / total * 100 : 0 };
}
export function sumConfigurationProgress(rows: readonly ConfigurationProgress[]): ConfigurationProgress {
  return configurationProgress(rows.reduce((sum, row) => sum + row.completed, 0), rows.reduce((sum, row) => sum + row.total, 0));
}
export function submittedFieldCount(fields: readonly { id?: string; tag: string; values: string[] }[], assignments: readonly { tag: string; status: string }[] | undefined, status: string): number {
  const accepted = status === 'reviewing' || status === 'completed';
  return fields.filter(field => field.values.length > 0 && field.values.every(value => value.trim())
    && (assignments?.length ? assignments.some(group => group.tag === field.tag && group.status === 'submitted') : accepted)).length;
}
