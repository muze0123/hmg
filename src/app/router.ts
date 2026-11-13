import { createRouter, createWebHistory } from 'vue-router';
import { pendingNavigationItems } from './navigation';

/**
 * 平台初始框架路由。
 * 业务模块仅保留「审计管理」；消息中心、账号与角色、功能授权为平台级页面/占位页。
 * 任何未知路径统一回落到审计管理，避免历史书签落到空白页。
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
 { path: '/projects/:id', component: () => import('../modules/projects/pages/TaskExecutionPage.vue'), meta: { layout: 'product' } },
 { path: '/projects/:id/execute', component: () => import('../modules/projects/pages/TaskExecutionPage.vue'), meta: { layout: 'product' } },
    { path: '/tags', name: 'tags', component: () => import('../modules/tags/pages/TagsPage.vue'), meta: { layout: 'product' } },
    { path: '/tasks/testing/:id?/:mode?', name: 'testing', component: () => import('../modules/testing/pages/TestingPage.vue'), meta: { layout: 'product' } },
    { path: '/templates/:section(configuration|usage)?', name: 'templates', component: () => import('../modules/templates/pages/TemplatesPage.vue'), meta: { layout: 'product' } },
    { path: '/tasks', redirect: '/tasks/certificates' },
    { path: '/tasks/certificates/:id?/:mode?', component: () => import('../modules/certificates/pages/CertificatesPage.vue'), meta: { layout: 'product' } },
    { path: '/tasks/reports/:id?/:mode?', name: 'reports', component: () => import('../modules/reports/pages/ReportsPage.vue'), meta: { layout: 'product' } },
    { path: '/archive', name: 'archive', component: () => import('../modules/archive/pages/ArchivePage.vue'), meta: { layout: 'product' } },
    ...['/tasks/vehicle', '/tasks/vehicle/:id/:mode'].map(path => ({ path, component: () => import('../modules/vehicle/pages/VehiclePage.vue'), meta: { layout: 'product' } })),
    { path: '/tasks/technical/:id?/:mode?', name: 'technical', component: () => import('../modules/technical/pages/TechnicalPage.vue'), meta: { layout: 'product' } },
    { path: "/sections", name: "sections", component: () => import("../modules/sections/pages/SectionsPage.vue"), meta: { layout: "product" } },
    { path: '/sections/:id', name: 'sections-detail', component: () => import('../modules/sections/pages/SectionDetailPage.vue'), meta: { layout: 'product' } },
    ...['/projects', '/projects/new', '/projects/:id/edit'].map((path) => ({ path, component: () => import('../modules/projects/pages/ProjectsPage.vue'), meta: { layout: 'product' } })),
    ...(import.meta.env.DEV ? [{ path: "/__design-system", name: "design-system-patterns", component: () => import("../design/patterns/DesignPatternsPage.vue"), meta: { layout: "product" } }] : []),
    { path: '/workbench', name: 'workbench', component: () => import('../modules/workbench/pages/WorkbenchPage.vue'), meta: { layout: 'product' } },
    {
      path: '/',
      redirect: '/workbench',
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('../modules/audit/pages/AuditManagementPage.vue'),
      meta: { layout: 'product' },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../modules/dashboard/pages/MessageCenterPage.vue'),
    },
    ...pendingNavigationItems.map((item) => ({
      path: item.path,
      name: item.name,
      component: () => import('../modules/dashboard/pages/PendingModulePage.vue'),
      props: { labelKey: item.labelKey },
      meta: { layout: 'product' },
    })),
    {
      path: '/:pathMatch(.*)*',
      redirect: '/workbench',
    },
  ],
});

export default router;
