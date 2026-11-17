// Snapshot of OpenData/src/modules/parts/data/parts.ts partCatalogSeed.
// OpenData's editable Pinia catalog has no API or cross-origin transport yet.
// Replace this read boundary with its maintained catalog API when supplied.
export interface PartCatalogSeed { id: string; code: string; name: string; abbreviation: string; supplier: string }
export const partCatalogSeed: PartCatalogSeed[] = [
  { id: 'PN-DCU-A01', code: 'PN-DCU-A01', name: '域控制器总成', abbreviation: '', supplier: '华为' },
  { id: 'PN-GW-B02', code: 'PN-GW-B02', name: '网关', abbreviation: 'GW', supplier: '博世' },
  { id: 'PN-TBOX-C03', code: 'PN-TBOX-C03', name: 'TBOX', abbreviation: '', supplier: '大陆' },
  { id: 'PN-IVI-D04', code: 'PN-IVI-D04', name: '车机', abbreviation: 'IVI', supplier: '德赛西威' },
  { id: 'PN-CDC-E01', code: 'PN-CDC-E01', name: '座舱域控', abbreviation: '', supplier: '均胜' },
  { id: 'PN-IC-F02', code: 'PN-IC-F02', name: '仪表', abbreviation: '', supplier: '联创' },
  { id: 'PN-RADAR-01', code: 'PN-RADAR-01', name: '前雷达', abbreviation: '', supplier: '大陆' },
];

export function partLabel(id?: string) { const part = partCatalogSeed.find(part => part.id === id); return part ? `${part.code} · ${part.name}` : id || '—'; }
