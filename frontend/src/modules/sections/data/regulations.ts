/** Saved execution rows are the only source of a section's regulation numbers. */
export function sectionRegulations(section: { entries?: readonly { law: string }[] }): string[] {
  return [...new Set((section.entries ?? []).map(entry => entry.law.trim()).filter(Boolean))];
}
