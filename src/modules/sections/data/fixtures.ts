import type { Item, SectionEntry } from './items';
import { templateRecords } from '../../templates/data/templates';

// Shared, deterministic fixture inputs: both owning task data and section data read these.
// This file must not import either module's runtime state.
type SectionSeed = Pick<Item, 'id' | 'project' | 'type' | 'status' | 'law' | 'start' | 'end' | 'actual' | 'executor' | 'reviewer' | 'entries' | 'executionSubmitted'>;
const definitions: { project: string; type: Item['type']; status: Item['status']; law: string }[] = [
  { project: 'PROJ-0004', type: 'technical', status: 'pending', law: 'GB-2024-001' },
  { project: 'PROJ-0004', type: 'test', status: 'pending', law: 'GB-2024-001' },
  { project: 'PROJ-0009', type: 'technical', status: 'active', law: 'GB-2024-002' },
  { project: 'PROJ-0004', type: 'report', status: 'active', law: 'GB-2024-002' },
  { project: 'PROJ-0010', type: 'technical', status: 'submitting', law: 'EU-2024-001' },
  { project: 'PROJ-0010', type: 'test', status: 'submitting', law: 'EU-2024-001' },
  { project: 'PROJ-0010', type: 'certificate', status: 'submitting', law: 'EU-2024-001' },
  { project: 'PROJ-0010', type: 'report', status: 'submitting', law: 'EU-2024-001' },
  { project: 'PROJ-0015', type: 'certificate', status: 'reviewing', law: 'EU-2024-002' },
  { project: 'PROJ-0016', type: 'technical', status: 'completed', law: 'EU-2024-003' },
  { project: 'PROJ-0014', type: 'report', status: 'withdrawn', law: 'EU-2024-002' },
  { project: 'PROJ-0014', type: 'technical', status: 'rejected', law: 'EU-2024-003' },
  { project: 'PROJ-0003', type: 'test', status: 'voided', law: 'GB-2024-003' },
  { project: 'PROJ-0003', type: 'certificate', status: 'reviewing', law: 'GB-2024-003' },
  { project: 'PROJ-0003', type: 'report', status: 'pending', law: 'GB-2024-003' },
  { project: 'PROJ-0003', type: 'vehicle', status: 'active', law: '' },
];
export const sectionSeeds: SectionSeed[] = definitions.map((definition, index) => {
  const id = `ITEM-${String(index + 1).padStart(2, '0')}`;
  const code = definition.type === 'test' ? 'testing' : definition.type;
  const templates = templateRecords.value.filter(row => row.type === code && row.status === 'completed');
  const approved = ['reviewing', 'completed', 'rejected', 'withdrawn'].includes(definition.status);
  const laws = [definition.law, definition.law === 'GB-2024-002' ? 'GB-2024-003' : 'GB-2024-002'];
  const entries: SectionEntry[] = definition.status === 'pending' || definition.type === 'vehicle' ? [] : laws.map((law, row) => ({
    id: `${id}-entry-${row + 1}`, law,
    template: definition.status === 'submitting' && row === 1 ? '' : templates[row % templates.length]!.id,
    externalReview: definition.type === 'technical' ? row === 0 : undefined,
    approval: approved || (definition.status !== 'submitting' && row === 0) ? 'completed' : 'pending',
  }));
  return {
    ...definition, id, entries,
    start: '2026-11-06', end: '2026-11-30', actual: definition.status === 'completed' ? '2026-11-10' : '',
    executor: index === 13 ? 'section-executor' : 'demo-wang',
    reviewer: index === 13 ? 'demo-wang' : 'section-reviewer',
    executionSubmitted: !['pending', 'submitting'].includes(definition.status),
  };
});
