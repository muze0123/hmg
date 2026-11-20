# 通用前端应用平台模版

> **一句话定位**：一套基于 Vue 3 + TypeScript + Arco Design 的**通用企业级前端应用平台初始模版**——自带应用壳子与系统级能力，不包含任何业务模块；新项目以此为起点，按自身需求接入业务模块与后端契约。

| 项 | 内容 |
|---|---|
| 工程名 | `app-template`（见 `package.json`，按需修改） |
| 形态 | Vue 3 单页应用（Vite + TypeScript + Arco Design Vue） |
| 当前状态 | 平台初始框架；无后端，演示数据为模块级 typed mock |
| 界面语言 | 简体中文（默认）+ English（`zh-CN` / `en-US` 双语切换） |

---

## 1. 模版能力

开箱即用的平台级能力，全部与具体业务无关：

| 能力 | 位置 | 说明 |
|---|---|---|
| 应用壳子 | `src/layouts/` | 顶部导航 + 侧栏菜单布局（ProductLayout）、顶部导航布局（DefaultLayout）、全局助手 |
| 主题 | `src/design/theme.ts` | 明 / 暗主题免刷新切换，`localStorage` 持久化 |
| 国际化 | `src/app/i18n.ts`、`src/app/locale.ts`、`src/app/stores/locale.ts` | 双语字典、语言注册表、切换 store（含 `<html lang>`、Arco 语言包、跨标签页同步） |
| 导入导出 | `src/modules/task-center/` | 全局抽屉：导入 / 下载任务双 Tab、筛选栅栏、分页契约、文件下载演示——任何业务模块的异步任务都可复用 |
| 消息中心 | `src/modules/dashboard/` | 通知列表 + 类型筛选 |
| 审计管理 | `src/modules/audit/` | 审计记录列表范本：筛选栅栏、列设置、详情抽屉、导出链路（确认弹窗 → 导入导出「下载任务」）——**它是平台级留痕能力的演示，也可整体替换为你自己的首个业务页** |
| 占位页 | `src/modules/dashboard/pages/PendingModulePage.vue` | 尚未开发的菜单项挂载占位说明页 |
| 菜单 / 路由 | `src/app/navigation.ts`、`src/app/router.ts` | 单一菜单源驱动顶栏与侧栏；路由懒加载 + 兜底回落 |
| 列设置组件 | `src/shared/components/ColumnSettingsPopover.vue` | 筛选条件设置 / 列设置共用 popover（勾选、拖拽排序、键盘等价操作、恢复默认） |
| 设计令牌 | `src/design/tokens.css` | 语义色 / 表面 / 分割线 / 阴影等 CSS 变量，明暗两套 |
| 全局样式 | `src/styles/global.css` | 分页、筛选控件、按钮表面、抽屉覆盖等共享规则 |

## 2. 以此模版启动新项目

1. 复制本目录，改 `package.json` 的 `name`、`index.html` 的 `<title>` 与 favicon。
2. 替换品牌：应用名统一走 i18n 键 `shell.appName`（默认「系统平台」/ "Platform"，中英各改一处即可全局生效）；logo 为 `src/assets/product-logo-placeholder.svg` 中性占位图。
3. 规划业务模块：在 `src/modules/` 下新建 `<feature>/`（`pages/` / `components/` / `data/` / `stores/`），并在 `src/app/navigation.ts` 与 `src/app/router.ts` 注册菜单与路由；未开发完的项先挂 `PendingModulePage`。
4. 替换演示数据：所有 mock 都集中在各模块 `data/` 目录，接入 API 时改为适配层，页面与导出结构不需重写。
5. 按需删除演示模块：审计管理（`src/modules/audit/`）与消息中心是可整体删除的范例模块，删除后同步清理 `navigation.ts`、`router.ts`、`i18n.ts` 对应命名空间，并跑 `pnpm verify` 收口。
6. 建立你自己的需求文档与设计规范（可参考 `PRD/Vibe Coding产品PRD模版.md` 的 PRD 范式）。

## 3. 文档体系

**职责分工**（`AGENTS.md` 头部约定）：**AGENTS.md / CLAUDE.md：怎么实现与验证 · DESIGN.md：视觉与交互标准 · 模块 PRD：产品要做什么**。

| 文档 | 位置 | 职责 |
|---|---|---|
| 前端开发规则 | `AGENTS.md`（主规则源）、`CLAUDE.md`（镜像，冲突以 AGENTS.md 为准） | 实现与验证规则：技术栈、工程结构、i18n 契约、数据 mock、无障碍、工作流与交付清单 |
| 视觉与交互规范 | `DESIGN.md` | 组件、令牌、间距、状态、可访问性及项目级裁决记录 |
| PRD 模板 | `PRD/Vibe Coding产品PRD模版.md` | 新模块 PRD 的 12 章骨架与写作范式 |
| 共享层说明 | `src/shared/README.md`、`src/design/components/README.md` | 共享代码与设计组件的放置约定 |

> 文档更新边界：PRD 与 `DESIGN.md` 默认不自动修改，仅在用户明确要求或点名时更新（`AGENTS.md §1`）。

## 4. 技术栈

| 关注点 | 标准 |
|---|---|
| 应用框架 | Vue 3 · Composition API · `<script setup lang="ts">` |
| 语言 / 构建 | TypeScript · Vite（版本以 `package.json` / `pnpm-lock.yaml` 为准） |
| UI 组件 | `@arco-design/web-vue` + Arco 图标（不用 emoji 作界面图标） |
| 样式 | `DESIGN.md` + Arco 语义令牌 + `src/design/tokens.css` / `src/styles/global.css` 约定 |
| 路由 / 状态 | Vue Router（`src/app/router.ts`）· Pinia（共享状态） |
| 国际化 | Vue I18n（`zh-CN` / `en-US` 对称，简体中文默认） |
| 数据 | 模块级 typed mock（接入 API 契约前），不把 mock 表述为真实后端 |
| 导出 | ExcelJS（审计导出演示；CSV/图表等按需自行引入） |

## 5. 工程结构

```
app-template/
├─ AGENTS.md / CLAUDE.md / DESIGN.md / README.md   # 规则与规范文档
├─ PRD/                                            # PRD 模板
├─ scripts/i18n.mjs                                # i18n 提取 / 校验 / 中文巡检
├─ src/
│  ├─ app/            # 启动、路由、i18n、locale、导航、全局 store
│  │  └─ stores/      # locale / userProfile
│  ├─ layouts/        # 应用壳子：ProductLayout / DefaultLayout / 全局助手
│  ├─ modules/
│  │  ├─ audit/       # 审计管理（平台级留痕演示，可整体删除）
│  │  ├─ dashboard/   # 消息中心 + 模块占位页
│  │  └─ task-center/ # 导入导出抽屉（导入 / 下载任务，业务可复用）
│  ├─ design/         # 设计令牌、主题（tokens.css / theme.ts）
│  ├─ shared/         # 跨域组件（列设置 popover）
│  ├─ styles/         # 全局样式（分页 / 筛选控件 / 抽屉覆盖等共享规则）
│  └─ assets/         # 占位 logo / 头像
└─ dist/              # 构建产物（生成物）
```

新增业务模块遵循 `src/modules/<feature>/`（页面 / 组件 / 数据 / 领域 store 自包含），不在模块内创建第二个应用根、顶栏或全局 provider。

## 6. 快速开始

```bash
pnpm install     # 安装依赖（Node ≥ 20，pnpm）
pnpm dev         # 启动开发服务 http://127.0.0.1:5173
```

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务 |
| `pnpm build` | 类型检查 + 生产构建（输出 `dist/`） |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm verify` | typecheck + i18n 校验（缺失 / 漏译 / 参数不一致即失败） |
| `pnpm i18n:extract` | 导出 `i18n-report/` 双语清单（翻译交接用，生成物不入库） |
| `pnpm i18n:cjk` | 巡检模板中未走 `t()` 的硬编码中文 |

## 7. 开发与验证工作流

1. 开工前读 `AGENTS.md`、`DESIGN.md` 及对应模块的需求文档，确认范围与共享依赖。
2. 以 Vue 单文件组件实现页面，接入既有路由 / 布局 / 主题 / i18n；文案同时提供 `zh-CN` 与 `en-US`。
3. 运行 `pnpm verify` 与 `pnpm build`，清理失效引用与生成物（`i18n-report/`、过期 `dist/` 不留在版本内）。
4. 浏览器实测：桌面与窄屏宽度、双语切换、明暗主题、键盘可及性、控制台无错误。
5. **验证约定**：功能验证使用无头浏览器 DOM 断言与 `getComputedStyle` 取值校验（元素、文案、对齐、间距、禁用态、弹窗开关、路由跳转），**不产出截图、Playwright trace、video、PDF 等副产物**；临时验证脚本置于 `/tmp`。
6. 交付前对照 `AGENTS.md §11` 交付清单自查；未经明确授权不修改 PRD 与 `DESIGN.md`。

## 8. 多语言约定（摘要）

- 界面文案、枚举字典、空态与可访问名 → 双语 i18n key；专名 / 编号 / 时间戳原样渲染，不进字典。
- 枚举存 `code`、`labels.ts` 内联模板字面量渲染（保证 `scripts/i18n.mjs` 可静态校验）。
- 语言切换仅经 `useLocaleStore()`（`src/app/stores/locale.ts`），不在组件内直写 `localStorage`。

## 9. 边界与声明

- 本模版不包含任何业务模块、业务术语与外部系统对接；所有演示数据均为占位口径。
- 登录与会话未包含在模版内；生产鉴权方案由使用方按自身安全要求接入（可在 `src/app/` 增加 auth store 与路由守卫）。
- `DESIGN.md` 为通用企业 UI 规范，其中的项目级裁决记录（带日期条目）可作为参考约定，使用方可按自身产品调整。
# hmg
# hmg
