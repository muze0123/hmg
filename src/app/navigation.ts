import type { Component } from 'vue';
import { IconHistory, IconDashboard, IconFolder } from '@arco-design/web-vue/es/icon';

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
 * 平台初始框架菜单：业务模块仅保留「审计管理」。
 * 用户与授权入口由统一用户中心提供，本系统只保留占位直达页。
 */
export const navigationItems: NavigationItem[] = [
  { name: 'workbench', path: '/workbench', labelKey: 'wb.title', icon: IconDashboard },
  { name: 'projects', path: '/projects', labelKey: 'projects.title', icon: IconFolder },
  { name: 'tasks', path: '/tasks', labelKey: 'reports.tasks', icon: IconFolder, children: [
    { name: 'vehicle', path: '/tasks/vehicle', labelKey: 'vehicle.title' },
    { name: 'technical', path: '/tasks/technical', labelKey: 'tech.title' },
    { name: 'testing', path: '/tasks/testing', labelKey: 'testing.title' },
    { name: 'certificates', path: '/tasks/certificates', labelKey: 'cert.title' },
    { name: 'reports', path: '/tasks/reports', labelKey: 'reports.title' },
  ] },
  { name: 'archive', path: '/archive', labelKey: 'archive.title', icon: IconFolder },
  { name: 'templates', path: '/templates', labelKey: 'templates.title', icon: IconFolder, children: [{ name: 'template-config', path: '/templates/configuration', labelKey: 'templates.config' }, { name: 'template-usage', path: '/templates/usage', labelKey: 'templates.usage' }] },
  { name: 'tags', path: '/tags', labelKey: 'tags.title', icon: IconFolder },
];

/** 初始框架无二级分组，侧栏与顶部导航共用同一份一级菜单。 */
export const sidebarNavigationItems: NavigationItem[] = navigationItems;

/** 保留平台级占位路由的直达能力，不再作为本系统菜单入口。 */
export const pendingNavigationItems: NavigationChild[] = [
  { name: 'accounts', path: '/accounts', labelKey: 'nav.accounts' },
  { name: 'grants', path: '/grants', labelKey: 'nav.grants' },
];
