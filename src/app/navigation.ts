import type { Component } from 'vue';
import {
  IconDashboard, IconCalendar, IconCheckSquare, IconArchive, IconLayout, IconTags,
  IconUnorderedList,
} from '@arco-design/web-vue/es/icon';

export interface NavigationChild {
  name: string;
  path: string;
  labelKey: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  labelKey: string;
  icon: Component;
  children?: NavigationChild[];
}

/**
 * 一级菜单的图标按模块业务对象一一对应，全部取自 Arco 图标家族（DESIGN.md · Sidebar
 * module icon semantics，2026-11-12）：同一个通用图标不得复用于不同业务模块，否则
 * 205/64px 侧栏在收起态只剩图标时无法区分模块。侧栏（16px）与顶部导航（18px）
 * 共用这份数据，颜色继承 .product-menu-link 的 currentColor，选中态自动跟随主色。
 *
 * 工作台   → IconDashboard       跨模块指标、图表与待办的聚合总览
 * 任务管理 → IconCalendar        项目以立项 / 开始 / 结束 / 实际完成日期与任务节点驱动
 * 分项管理 → IconUnorderedList   项目下逐条拆分的法规 / 任务分项清单
 * 任务执行 → IconCheckSquare     车型配置 / 技术资料 / 测试记录 / 证书 / 报告的执行与完成状态
 * 项目归档 → IconArchive         交付物目录的归档留存
 * 模版管理 → IconLayout          定义字段结构与格式的模板，以及其使用记录
 * 标签管理 → IconTags            标签分类与打标
 */
export const navigationItems: NavigationItem[] = [
  { name: 'workbench', path: '/workbench', labelKey: 'wb.title', icon: IconDashboard },
  { name: 'projects', path: '/projects', labelKey: 'projects.title', icon: IconCalendar },
  { name: 'sections', path: '/sections', labelKey: 'sections.title', icon: IconUnorderedList },
  { name: 'tasks', path: '/tasks', labelKey: 'reports.tasks', icon: IconCheckSquare, children: [
    { name: 'vehicle', path: '/tasks/vehicle', labelKey: 'vehicle.title' },
    { name: 'technical', path: '/tasks/technical', labelKey: 'tech.title' },
    { name: 'testing', path: '/tasks/testing', labelKey: 'testing.title' },
    { name: 'certificates', path: '/tasks/certificates', labelKey: 'cert.title' },
    { name: 'reports', path: '/tasks/reports', labelKey: 'reports.title' },
  ] },
  { name: 'archive', path: '/archive', labelKey: 'archive.title', icon: IconArchive },
  { name: 'templates', path: '/templates', labelKey: 'templates.title', icon: IconLayout, children: [{ name: 'template-config', path: '/templates/configuration', labelKey: 'templates.config' }, { name: 'template-usage', path: '/templates/usage', labelKey: 'templates.usage' }] },
  { name: 'tags', path: '/tags', labelKey: 'tags.title', icon: IconTags },
];

/** 初始框架无二级分组，侧栏与顶部导航共用同一份一级菜单。 */
export const sidebarNavigationItems: NavigationItem[] = navigationItems;

/** 保留平台级占位路由的直达能力，不再作为本系统菜单入口。 */
export const pendingNavigationItems: NavigationChild[] = [
  { name: 'accounts', path: '/accounts', labelKey: 'nav.accounts' },
  { name: 'grants', path: '/grants', labelKey: 'nav.grants' },
];
