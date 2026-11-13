export interface ArchiveProject { id: string; name: string; count: number }
export interface Deliverable { id: string; projectId: string; name: string; activity: string; date: string; owner: string }
export const archiveProjects: ArchiveProject[] = [
  { id: 'P-2026-018', name: '某车型网络安全项目', count: 12 },
  { id: 'P-2026-014', name: '某新能源平台预研', count: 8 },
  { id: 'P-2025-102', name: '某出口车型合规', count: 15 },
  { id: 'P-2026-030', name: 'VW 平台测试', count: 5 },
  { id: 'P-2025-088', name: '某车型改款', count: 3 },
  { id: 'P-2025-066', name: '文档管理试点', count: 9 },
  { id: 'P-2026-021', name: 'AION Y 网安专项', count: 11 },
  { id: 'P-2025-110', name: '出口欧盟合规包', count: 7 }];
const samples = [
 ['相关项边界说明.pdf', '相关项边界定义', '2026-04-20', '陈晨'],
 ['威胁分析报告.docx', '威胁场景分析', '2026-04-22', '林浩'],
 ['安全需求规格.pdf', '安全需求定义', '2026-05-02', '陈晨'],
 ['交付物清单.txt', '软件物料盘点', '2026-05-10', '陈晨'],
 ['架构评审纪要.pdf', '安全架构评审', '2026-05-18', '刘洋'],
 ['测试用例集.xlsx', '安全测试', '2026-06-01', '孙伟'],
 ['漏洞闭环报告.pdf', '漏洞修复', '2026-06-12', '林浩'],
 ['交付验收纪要.pdf', '项目验收', '2026-06-28', '周凯'],
 ['安全计划.pdf', '安全计划', '2026-04-18', '陈晨'],
 ['风险评估报告.pdf', '风险评估', '2026-05-20', '林浩'],
 ['合规检查清单.xlsx', '合规检查', '2026-06-20', '刘洋'],
 ['归档记录.json', '项目验收', '2026-06-30', '周凯'],
 ['测试补充记录.pdf', '安全测试', '2026-06-21', '孙伟'],
 ['评审补充记录.pdf', '安全架构评审', '2026-06-22', '刘洋'],
 ['验收补充记录.pdf', '项目验收', '2026-06-29', '周凯'],
];
export const deliverables: Deliverable[] = archiveProjects.flatMap(project => samples.slice(0, project.count).map((row, index) => ({ id: `${project.id}-${index}`, projectId: project.id, name: row[0]!, activity: row[1]!, date: row[2]!, owner: row[3]! })));
