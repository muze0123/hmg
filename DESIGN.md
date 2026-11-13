# Metritag Design — 麦唐产品设计规范

> The design specification of record for 麦唐科技 (Metritag) products, synchronized from the Figma source of truth. This is a **proprietary design system that overrides Arco Design defaults**: where a value below differs from an Arco default, the value below wins.

**Source:** Figma file `BIaI9TEH8NiVlkKtbHaCh3` — 麦唐产品设计规范 · cover **Metritag Design v0.1.0** · changelog entry `2024.12.13 — 版本 1.0.0 结合品牌和产品制定设计规范` · cached file `lastModified 2026-01-12T14:04:10Z`, version `2316142384288859459`. The cover and changelog use different version labels; neither is silently promoted to a resolved release number. The cache inventories 37 pages, but is not a complete, current export; see Source coverage.

**Implementation:** Vue 3 + TypeScript + `@arco-design/web-vue`. Arco supplies component mechanics; use measured Metritag values for the components and states actually specified in Figma. Unspecified cases follow the fallback contract under Component selection.

**Theme:** the cached light palette is Figma-backed. A complete Figma dark-mode token mapping is **not verified by the available cache** (variable inventory is unavailable); absence cannot be inferred. The dark mapping below is an **implemented project extension**, marked **[Project-Dark]**, not a verified Figma specification or proof that every rendered state passes contrast. An authenticated Figma dark specification, if confirmed, supersedes this project mapping where they differ.

**UI language:** Simplified Chinese. This document is written in English; the product interface is not.

**Production use:** the Figma-backed values below are a design reference, not proof that the current Vue application implements every value or passes release acceptance. The open gates under Governance apply to the affected routes and components. Do not close a gate by editing this document alone.

## Executable design system [Project, 2026-11-07]

The implementation priority approved on 2026-11-07 is **Metritag semantic tokens (this specification) → Arco → shared compositions → verified page patterns → concise AI entry → automated checks**. Metritag values govern Arco appearance. Reuse an existing matching composition before assembling another implementation.

The development entry is `AI-DESIGN.md`. `pnpm design:context` returns the relevant component index and project profile. Read the applicable sections of this specification when implementing or resolving a missing case.

| Artifact | Responsibility |
| --- | --- |
| `src/design/tokens.core.json` | Shared geometry and semantic aliases, project format `metritag-css-tokens-v1` |
| `src/design/tokens.project.json` | Existing project theme values, compatibility variables, and the Arco primary/link adapter |
| `src/design/tokens.core.css` / `tokens.css` | Generated CSS, verified against JSON on build |
| `src/design/project.json` | Scoped brand and editable/filter/detail punctuation differences |
| `src/design/registry.json` | Actual component files, API contracts, page patterns, and evidence locations |
| `src/design/patterns/README.md` | Composition and verification instructions |
| `design-report/check.json` | Introduced and historical static findings |
| `design-report/browser.json` | Latest executed browser assertions and screenshot paths |

The initial JSON migration preserves existing theme assignments. The blue projects now explicitly map Arco primary/link normal, hover, and active values to this specification's measured control ramp. OpenData retains its approved teal mapping. Dark mappings remain project extensions. The prior DS-02 primary assignment gap for these mappings is addressed in code, while the broader route/state acceptance gates retain their own evidence requirements.

Common components include `AppListToolbar`, `AppPagination`, `AppFormLayout`, `AppFieldLabel`, `AppDetailList`, and `ConfirmDialog`. The development-only `/__design-system` route demonstrates list and edit workflows in the current shell. Audit routes adopt the shared toolbar. Project-specific field punctuation decisions remain recorded in the original sections and in `project.json`.

The shared confirmation component defines the four-part icon/title/optional-description/action structure, 560px width constrained to the viewport, a **fixed 250px height** (2026-11-08 decision), a 48px text-free header whose `X` is pinned to the **top-right corner**, a **state icon sharing the title's line** (2026-11-08 decision), and a footer without a divider. Its action uses the project's primary theme. Modules own async completion and pass loading/dismissible state. This shared composition applies to new confirmation surfaces in all three projects.

`pnpm verify` and `pnpm build` enforce generated-token integrity and new static violations. `pnpm design:audit` includes historical violations as failures. Baseline records preserve identified pre-migration debt, scoped by file, rule, snippet and occurrence count. A passing incremental check only establishes that no additional covered violations were introduced. Visual and business acceptance follow the relevant route's release checklist.

`pnpm design:sync` compares shared implementation files across the three configured projects. `node scripts/design-sync.mjs --write` propagates authorized common changes from the current project, with project theme, business rules, full specification history and debt records retained per project. Run token generation and checks in every target after synchronization.

## How to read this document

Values in Figma-backed tables are read from the cached nodes or source prose. Where the source gives only a visual example, the rule is generalized from readable geometry, fills, strokes, and variant state names — those entries are marked **[Derived]**. Source wording is marked **[Stated]**. Project-level implementation contracts that Figma does not cover (routing, data, permissions, testing) are marked **[Project]**; their implementation status does not itself prove product or design approval. Cache gaps and disputed interpretations are listed under Source coverage.

Precedence: law/security/accessibility obligations > approved business rules and module PRD > this document > Arco defaults. An Arco demo does not establish a Metritag rule.

## Governance

- At project kickoff record the locked Vue/Arco versions, router/store, default language and time zone, supported browsers and minimum viewport, roles and tenants, and acceptance owners. Product owns field dictionaries, state transitions, permissions, and exceptions; design owns structure, tokens, interaction, and all visible states; frontend owns implementation and tests; QA checks each route against the release checklist.
- “Must” and “must not” are release gates; “should” is the default requiring a recorded exception; “may” depends on context. Record a deviation's clause, reason, affected routes, approvers, version, evidence, review date, and rollback path. A local `.vue` style override is not a platform decision.
- Scope: desktop-first admin, operations, CRM, approval, finance, and configuration products. Marketing sites, native mobile, embedded microfrontends, and display walls need separate specifications.
- When this document and the Figma file disagree, the Figma file wins **unless an explicit, scoped user-approved update is recorded below**. The recorded Figure 1 / Figure 2 page-shell update is such an exception; other Figma component rules remain in force. When this document and an Arco default disagree, this document wins.
- **Layout update, 2026-10-22:** the user-supplied Figure 1 and Figure 2 explicitly replace the older cached Figma Layout page's shell dimensions for the two page patterns below. This override is limited to page-shell geometry; the original Figma navigation component variants remain source evidence, not automatic page-shell widths.
- **Page-title removal, 2026-10-24:** by user decision, business pages render **no page title and no subtitle inside the content area** — page identity is carried by the shell navigation. The former 18px/600/26 page-title role and every reference to it (Typography · Title roles, Spacing, Composition, Review checklist) are removed from this document. Panel, card, dialog, and drawer titles at 16px/600/24 are unchanged, and standalone full-screen routes keep their own hero scale.
- **Ledger list update, 2026-10-25:** by user decision, recorded under the affected sections — (1) filter strips wrap on a uniform grid with right-aligned labels / left-aligned controls and the action group trailing the last filter (Filter control surface rule) — **filter-strip geometry superseded 2026-11-09, see the filter strip restacking entry below**; (2) icon-only settings triggers render on the `#DDDDDD` fill (Icon-only toolbar controls) — **superseded 2026-10-26, see the next entry**; (3) business drawers use the `#F7F8FA` canvas with white header/footer/content-group cards, and read-only drawers close on mask click with a linear slide-right (Drawer).
- **Icon trigger fill update, 2026-10-26:** by user decision, the 筛选条件设置 and 列设置 icon-only triggers drop the `#DDDDDD` fill and render on the **white business surface** (`app-btn-neutral`), matching the text buttons beside them in the same toolbar. The 2026-10-25 grey-fill rule and its `app-icon-trigger` implementation are retired; the authoritative wording now lives under Icon-only toolbar controls.
- **Form field layout, 2026-11-01:** by user decision, configuration/edit forms use label-above + **500px control width** + left-side required asterisk, and read-only views switch to the `字段名：值` summary list (Form field layout under Components). Forms made of several equally mandatory parts split those parts into tabs; there is no extra progress strip (Mandatory-part headers under Lists).
- **Row drag-reorder language, 2026-11-01:** by user decision, the 列设置 popover's drag-reorder grammar is promoted to the **project-wide standard** for pointer-driven row reordering: source row fades to `opacity: .55` with `grabbing` cursor, the valid destination row tints with `--color-primary-light-1` and carries a 3px `--app-accent` insertion line on the approached edge, and the drag snapshot must be the whole row via `dataTransfer.setDragImage` — never the bare 20×28 handle. Authoritative wording lives under Row drag-and-drop reorder (Components).
- **Field label colon, 2026-11-06:** by user decision, **every field name in add/edit drawers, dialogs, and equivalent field surfaces renders a trailing colon** on its right (`姓名：`), including filter strips, popover filter fields, and the read-only `字段名：值` detail rows; the sign-in form is included. The colon is a global CSS contract, not copy: `--app-field-colon` is `：` in `zh-CN` and `:` in `en-US` (driven by `<html lang>`), rendered once by `.app-field-label::after` / `.app-detail-label::after` in `src/styles/global.css`. No i18n string, label value, or template may hardcode a colon; Arco's `colon` prop is not used because it always emits a half-width `:` with a leading space and cannot be localized. Authoritative wording lives under Form field layout (Components), with the filter and read-only exceptions recorded under Filter control surface rule and Descriptions.
- **Unsaved-change guards by surface, 2026-11-06:** by user decision, a **centered dialog** closes immediately on its `X`, 取消, or Escape — it never shows a second “当前有未保存的修改，确定要放弃吗？” confirmation, whether or not the form is dirty. The confirm-and-discard guard belongs only to **editing drawers and add/edit child routes**, and there it fires **only when the user actually changed something** (close, mask click, Escape, route leave). Read-only drawers and plain confirmation dialogs keep their direct-close behaviour. Authoritative wording lives under Dialog and Drawer (Components); implemented in `DepartmentsPage` / `DepartmentFormDrawer` (centered, no guard) versus `UserFormDrawer` / `RolesPage` / `WorkflowPage` (guarded).
- **Department dialog footer and height, 2026-11-06:** by user decision, the 添加部门 / 添加子部门 / 编辑部门 centered dialogs use **确定** (not 保存) as the primary action, put 取消 + 确定 in Arco's **footer block with an upper border**, and keep a **320px minimum height that grows with content**. The header/body/footer spacing is 24px / 24px / 16px+20px. Both department surfaces (`DepartmentsPage`, `DepartmentFormDrawer`) share one `.department-dialog` shell in `src/styles/global.css`; 保存 remains on the add-user drawer. Authoritative wording lives under Dialog (Components).
- **Unified confirmation dialogs, 2026-11-06:** by user decision, **every 二次确认 / 提示 / 告警 / 成功 dialog** follows one four-part format — **state icon → title → optional subtitle → bottom action block** — with a text-free 48px header carrying only the top-right `X`, a 20px outlined orange status icon, 16px/600 title, 14px `#999999` subtitle, and right-aligned 取消 + 确定 (or a single 我知道了) in a footer with **no upper border**. Width 560px; the original `min-height: 320px` growing with content is **superseded by the 2026-11-08 fixed-250px decision below**. Implemented once as `src/shared/components/ConfirmDialog.vue` with its `.app-confirm-dialog` shell styles; inline `a-modal` confirmations, in-body `<footer>`s, and `Modal.confirm()` are prohibited. The theme primary button applies even to destructive actions — no red danger primary. Authoritative wording lives under Dialog (Components); the Batch export baseline is updated to point at this component.
- **Confirmation dialog height and close control, 2026-11-08:** by user decision, **every 二次确认 / 提示 / 告警 / 成功 dialog is exactly 250px tall, globally**, and its `X` is **pinned to the top-right corner**. The 320px minimum height that grew with content is retired for this family; the fixed height is a single generated token `--mt-ds-confirm-height: 250px` (`src/design/tokens.core.json` → `tokens.core.css`) consumed once by `.app-confirm-dialog .arco-modal`, with `min-height: 0`, a scrollable `flex: 1` body and fixed header/footer. The `X` defect was real: `global.css`'s `.arco-modal .arco-modal-header .arco-modal-title` (0,3,0) forced `justify-content: flex-start` + `padding-right: 24px` on the `#title` slot, so the close button rendered at the **top-left**; a 0,4,0 selector in `ConfirmDialog.vue` now sets `justify-content: flex-end` / `padding-right: 0`, placing the 32×32 control 20px from the right edge and 8px from the top. Form dialogs (`.department-dialog`) keep their own `min-height: 320px` and Arco's own top-right close button — this decision does **not** resize them. Authoritative wording lives under Dialog (Components); verification is encoded in `scripts/design-browser.mjs`.
- **Confirmation icon/title alignment, 2026-11-08:** by user decision, the **state icon and the title sit on the same horizontal line, in the same row** in every 二次确认 / 提示 / 告警 / 成功 dialog — the icon is not centred against the whole icon/title/subtitle block. The old `.app-confirm-main { align-items: center }` aligned the icon to the combined text column, so a 1-line subtitle pushed it 15px below the title centre and a 2-line subtitle 28px. The shared component now uses `align-items: flex-start` and a `20px × 24px` icon slot (`--mt-ds-confirm-icon` × `--mt-ds-line-title`) that vertically centres the 20px glyph on the title's first line; subtitle lines stay in the right-hand copy column, left-aligned under the title. The body still vertically centres the whole group at `250px`; wrapped titles keep the icon on their first line. Verification is encoded in `scripts/design-browser.mjs` for both the no-subtitle and multi-line-subtitle cases. Authoritative wording lives under Dialog (Components).
- **Account hover popover width, 2026-11-08:** by user decision, the dropdown opened by hovering the nav-bar avatar/name (`src/layouts/ProductLayout.vue` → `.account-popup`) is **240px content wide** (`min(240px, calc(100vw - 48px))`), down from 380px. Arco's 16px side padding and 1px border make the measured outer popup **274px** (previously 414px). **Copy is deliberately unchanged:** the compact identity summary and the three menu items (账号信息 / 审计管理 / 退出登录, localized) stay as they are; `个人中心` remains an accessible name (`account.center`), not a new visible label or a renamed item. The narrower column wraps long names and role tags instead of clipping them — verify `scrollWidth <= clientWidth` in both locales, light/dark, and narrow viewports, and never widen the popover back to accommodate the summary card. **(2) Type, 2026-11-08 user decision:** the compact identity line carrying **login account + display name** (`.account-identity-name` in `src/modules/account/components/AccountSummary.vue`, rendered only in this popover) is **14px**, reduced from 16px; its `line-height: 24px`, the 12px department line, the 12px role tags and the 14px menu items are unchanged. At 240px the line then fits on one row again, so the popup returns from 307px to 283px tall. This is a compact-popover-only rule: the non-compact `AccountSummary` on `/settings/account` keeps its `dl` structure and 14px body copy.

- **Global AI assistant, 2026-11-09:** by user decision, the platform gains a **globally visible bottom-right AI assistant** built on the 天枢 `GlobalAssistant.vue` structure (chat panel opening directly above the launcher). Three scoped changes: **(1)** the launcher is **only the robot avatar** — the 天枢 48px filled primary circle and `IconStarFill` glyph are retired, and the supplied avatar's blue emissive parts are hue-mapped to the brand colour **`#0DB9C6`** (`--brand-6`), not recoloured by a CSS filter; **(2)** the panel grows from 372×420 to **420×560**; **(3)** the seeded welcome line, sample question, answers and simulated replies are **localized to OpenData modules** in both locales instead of 天枢's generic copy. Scope: mounted once from `src/app/App.vue` behind `route.meta.layout !== false`, so all `ProductLayout` / `DefaultLayout` business routes show it and standalone pages (`/login`, `/apps/:appId`) do not. This is a **project-level shell surface**, not a Figma-derived component rule. Authoritative wording, measured geometry and state contracts live under Global AI assistant (Project) below; no online model is connected and the fallback copy must say so.
- **Filter strip restacking, 2026-11-09:** by user decision, **the 2026-10-25 horizontal filter grid is retired globally**. Every list query area now renders each filter as a **vertical unit**: a `12px` left-aligned field-name label carrying the global colon (`字段名：`) on the first line, and the `200px` control directly below it with a **4px label-to-control gap**. Units plus the trailing action group wrap on a uniform **16px gutter** ("栅栏"), all left-aligned; the 查询 (primary), 重置 (neutral outline) and 筛选设置 (icon-only) buttons sit **immediately to the right of the last filter control** on the same wrapping row, with no stretch and no auto margin. At the narrow breakpoint each unit takes a full row and its control becomes `width: 100%`. This replaces the inline `max-content` label track, 8px inner gap, right-aligned labels, and the "a label and its control always stay on one line" clause — those now describe a defect. Applies to **all list pages**, including existing ones, not only newly built screens. Authoritative wording under Filter control surface rule → Filter strip packing, Filter label colon, and Filter field composition.

- **Batch import unification, 2026-11-10:** by user decision, all four 基础数据库 modules (证书 / 车型车辆 / 零部件 / 法规) share **one** import drawer: title **批量导入** at 560px, a dashed upload target whose primary action is **上传文件** (label becomes **重新上传** after selection, the filename is shown inside the target, and the instruction reads 点击上传，或将文件拖拽到此处), a 注意事项 sub-block on `--app-primary-light-bg` (`#DFF7F9` light / `#123B41` dark), a pre-generated `当前业务模块导入模版.xlsx` download command, and a fixed 取消 / 导入 footer — all inside one white content block. The notes copy follows a single **1..N numbered skeleton** — file format, 20 MB limit, `*` required-field meaning, module field/enum rules, duplicate handling, error-data download — while each module documents **its own** row schema instead of copying another module's business rule. Implemented once as `.app-import-drawer` / `.app-import-block` / `.app-import-target` / `.app-import-notes` / `.app-import-template` in `src/styles/global.css` plus shared `batchImport.*` copy; per-module copy lives in `certificates.importHelp`, `parts.importHelp`, `regulations.importHelp`, `vehicles.importHelp`. Verification is headless DOM/token assertion on all four drawers (63/63) — no screenshots.

- **Batch export alignment, 2026-11-10:** by user decision, 基础数据库 list exports follow the Batch export baseline end-to-end via the shared `ConfirmDialog`, never a direct download or a hand-rolled modal. The 导出 trigger is a labelled `app-btn-neutral` with the download icon; clicking it opens the **560 × 250** info dialog titled **导出提示** with two left-aligned lines — line 1 states the applied-filter scope (**本次将导出当前筛选条件下的所有证书** / 所有法规 / 所有零部件), line 2 is fixed as **导出结果可以在「导入导出-导出数据」中查看和下载** — plus 取消 (neutral) and 确认导出 (primary, loading, `dismissible=false` while in flight). With an empty applied result only an info `Message` appears and **no** dialog opens. On confirm: build the workbook from the applied filter result, register an export record named `证书_YYYY-MM-DD.xlsx` (or the module equivalent), show the mandatory **导出成功** success `Message`, then open 导入导出 on the **导出数据** tab. 法规 / 零部件 previously omitted the success `Message`; they now match 证书 in copy, sequence and feedback. Scope: 证书 / 法规 / 零部件 — 车型车辆 has no export trigger yet and is outside this alignment. Verified headless (47/47 DOM/computedStyle assertions on all three modules, 0 pageerror) — no screenshots.
- **Business-drawer block spacing fix, 2026-11-10:** the 法规 add/edit drawer's 基本信息 white card inherited the browser default `h3` margin (16px top and bottom) while only 附件 / 审核 had `margin: 0 0 12px`, and its last `a-form-item` stacked a 16px row gap on top of the card's 16px padding — content sat **32px** from the card's top/bottom edges instead of 16px. Per Business-drawer surface and grouping, every block title in a business drawer now uses `margin: 0 0 12px` and the **last field** of a block uses `margin-bottom: 0`, so the card keeps a uniform 16px inset, 12px from title to first field, 16px between fields, and 16px between cards. The edit drawer title is a dedicated key `regulations.editTitle` (**编辑法规** / *Edit regulation*); the row action keeps `regulations.edit` (**编辑**). Verified headless on both add and edit states (24/24 DOM/computedStyle assertions, 0 pageerror) — no screenshots.
- **Detail sub-page header unification, 2026-11-10:** by user decision, all 基础数据库 detail child routes (证书 / 法规 / 零部件) share one header contract. **(1)** The **status Tag moves out of the header** and sits to the **right of the 基础信息 / 基本信息 section title**, inside a flex `.block-title` wrapper (title + tag, 8px gap); the tag is never repeated in the top bar. **(2)** On the 证书 draft state, 提交审批 is renamed **提交** (`certificates.submit`, both locales), it becomes the **primary highlighted action** (`#0DB9C6`), and a neutral outline **取消** button is added **immediately to its left**, returning to the module list; 审核中 keeps 同意 as the sole primary among 撤回 / 转交 / 驳回 / 同意. Primary actions are driven by a `PRIMARY_ACTIONS` list, not per-status template branches. **(3)** Breadcrumb: the leading `<` back control is **Text-3 gray by default** with a **primary-color (`#0DB9C6`) hover** (plus `Fill-2` hover background on the button); the **upper-level module label is Text-3 gray** with a **primary-color hover highlight**; the **second-level (current) page name is Text-1 black / 600** and stays a non-link. Applies to all three modules, not only certificates; parts adds its own status-color map (规划中 gray / 进行中 orange / 已完成 green). The **parts 关联信息 / 项目详情 child route** (`PartRelationsPage.vue`, a 2–3 level breadcrumb) syncs the same breadcrumb color contract via `.relations-toolbar` overrides, even though it has no 基础信息 section or submit actions, so no status-Tag or action rule applies there. Authoritative wording lives under Breadcrumb 面包屑 (Components). Verified by headless DOM + `getComputedStyle` assertions on all four detail routes (30/30) plus typecheck, i18n, design-check and design tests — no screenshots.

- **Tabs hover and selection hierarchy, 2026-11-12:** by user decision, hovering a single tab highlights **only its text colour** — neither the text block nor the tab cell may show a background. Arco's default `Fill-2` hover patch on `.arco-tabs-nav-type-line .arco-tabs-tab-title::before` (and the `Fill-2` / `Fill-3` cell fills of the text, card, card-gutter, rounded and capsule variants) is retired; hover text moves from `Text-2` to `--primary-5` at weight 400. **Selection outranks hover:** an active tab keeps `--primary-6` at weight 500 plus its 2px ink bar even while hovered, because the hover rule excludes `.arco-tabs-tab-active` / `.arco-tabs-tab-disabled` and the active declaration is stated last. One global rule set in `src/styles/global.css` drives every `a-tabs` instance (模板配置, 车型详情, 测试记录详情, 导入导出抽屉); page-local hover, colour or weight overrides are prohibited. Authoritative wording lives under Tabs 标签页 (Components); verification is headless `getComputedStyle` on normal / hover-inactive / hover-active / switched states in both themes and locales — no screenshots.

- **Sidebar module icon semantics, 2026-11-12:** by user decision, the first-level menu icon of each business module is redesigned around **that module's business object** instead of the generic `IconFolder` previously shared by five of six modules. Approved one-to-one mapping: 工作台 → `IconDashboard`, 项目管理 → `IconCalendar`, 任务管理 → `IconCheckSquare`, 项目归档 → `IconArchive`, 模版管理 → `IconLayout`, 标签管理 → `IconTags`. All six stay in the Arco icon family, no two first-level entries share a glyph, and a new module may not fall back to a generic folder. One source (`src/app/navigation.ts` → `icon`), rendered at 16px in the sidebar and 18px in the top navigation with `currentColor` inheritance. Authoritative wording and rationale under Sidebar module icon semantics (Composition); verified by headless DOM assertions on glyph uniqueness, sizes, collapsed rail and theme/locale states — no screenshots.

- **Content-region spacing, 2026-11-12:** by user decision, **every route** now implements the two existing spacing rules end to end: the content region keeps **16px** from the header, from the sidebar (or from the page's left edge when there is no sidebar), from the right edge and from the page bottom; adjacent blocks **inside the content region** are **12px** apart. The 16px gutter belongs to the shell only, and both shells now read the same `--app-page-gutter` token: `ProductLayout.vue` owns the right padding (`.product-body`), top padding, bottom margin and the 205/64px sidebar offset (`.product-main`), while `global.css` owns `.default-layout-content`'s four-side padding. A page root must not add a second outer margin. The 12px module gap is `var(--mt-ds-space-3)` and is applied by each page's root container or by the margin between its sibling panels — vertical stacks (筛选条件 → 数据列表, tabs → filter → list, detail sub-pages, the design-system example page, message center header → list) **and** horizontal siblings (项目归档 directory ↔ content) alike. Panel inset (16px), in-panel spacing and the filter-strip's own 16px/4px geometry are explicitly **out of scope** and unchanged. At ≤900px the stacked shell keeps 16px from the header to the horizontal menu, 16px from that menu to the content, and 16px on left / right / bottom. Verified headless with `getComputedStyle` and `getBoundingClientRect` across 24 routes × 5 viewport/theme/locale/sidebar scenarios (815 assertions, 0 failures, 0 console errors) — no screenshots.

- **Project archive panel packing and document preview, 2026-11-13:** by user decision, `/archive` becomes the **single documented exception** to the 12px horizontal module gap. The directory and content stay two independent white rounded panels but are packed at `gap: 0`; the whole block is pinned to the shell's 16px bottom gutter and only the table region scrolls. Table density is retired, the table head takes the Fill-2 `--app-table-header` background, the four default filters are 交付物名称 / 关联活动 / 交付日期 / 责任人 with 筛选设置 immediately after 重置, and 列设置 moves to the data-list toolbar's top-right 32×32 icon. Preview dispatches pdf / docx / xlsx to the third-party `@vue-office` component family (txt / json rendered natively), while both download entry points register an 导入导出 download task under module key `archive` instead of triggering a local Blob download. Authoritative nine-item wording lives under 项目归档 (Composition); verified headless in both locales and themes at 1440 / 1280 / 375px with 0 pageerror — no screenshots.

### Decision and release gates [Project]

`Open` means the decision or its verification evidence is missing. Owners are roles, not implied approvals. Close a gate only with the decision, affected routes/components, Figma version or implementation commit, measured evidence, approver, and date. A gate blocks release of the **affected surface**; other independently verified surfaces need not wait for an unrelated proposal.

| ID | Status | Open decision / evidence | Owner | Release condition |
|---|---|---|---|---|
| DS-01 | Open | Full Table subtree, Figma variable modes, and the authoritative cover/changelog version are unverified in the cache | Design | Obtain a complete versioned export or approve an explicitly limited component scope; do not claim full Figma coverage |
| DS-02 | Open | Documented semantic aliases and the current CSS token mappings differ | Frontend + design | Reconcile the mapping table under Colors, then inspect computed styles in both themes for affected components |
| DS-03 | Open | White-on-primary hover, readable placeholder, and success/warning marks have failing contrast pairings | Design + accessibility | Approve contrast-safe variants and verify actual rendered normal/hover/focus/disabled states before releasing affected controls |
| DS-04 | Open | Minimum supported browser width and narrow/zoomed business-route behaviour are not approved | Product + QA | Record route support matrix and verify navigation, forms, tables, and overlays at the approved floor and zoom levels |
| DS-05 | Open | Dark theme is implemented as a project extension, but Figma dark variables and full-state acceptance are unverified | Product + design + QA | Approve dark-mode scope and verify token mapping, contrast, overlays, and first paint before calling it production-supported |

The icon npm/sprite pipeline is a separate **proposal**, not a release gate while this codebase stays on the installed Arco icon set. For any Figma rule not covered by the cache, preserve the existing non-conflicting project rule and mark its authority; do not silently promote an inference into a Figma requirement.

## Global AI assistant [Project, 2026-11-09]

The structure follows the 天枢 `GlobalAssistant.vue` composition — a bottom-right launcher opening a chat panel **directly above the icon** — with the three user-approved changes recorded under Governance. Implementation is a single `src/layouts/GlobalAssistant.vue`, mounted once from `src/app/App.vue`.

**Launcher artwork.** The launcher is **only the robot avatar**: no filled circle, no icon glyph, no text label. The supplied `萌趣绿光机器人头像.svg` is not editable vector artwork — it is a 1538×1475 transparent PNG embedded as base64 inside an SVG `<image>` pattern (1.43 MB) with no `fill` attributes to restyle. The shipped `src/assets/ai-assistant-avatar.svg` keeps the SVG container but embeds a 320×307 recoloured bitmap: pixels with hue **190°–255°** and saturation **> 0.20** are hue-mapped to **`#0DB9C6`** (H 184.2°), keeping their original saturation and value so the white shell, dark face screen, white eye highlights and alpha channel survive. Asset size falls from 1.43 MB to ~96 KB. The same artwork appears in the panel header and in assistant message avatars; user messages keep `IconUser`.

**Measured geometry:**

| Element | Value | Note |
|---|---|---|
| Launcher | 56 × 56 px, `object-fit: contain` | Transparent PNG; no background/border |
| Launcher offset | `right: 24px; bottom: 24px` | `right/bottom: 16px` at ≤560 px |
| Panel | **420 × 560 px**, `min-height: 280px` | `min(420px, 100vw - 32px)` × `min(560px, 100dvh - 120px)` |
| Panel offset | `right: 24px; bottom: 96px` | 24 + 56 launcher + 16 gap; `16px / 88px` at ≤560 px |
| Header | 52px min-height, 28px avatar, 18px/600 title | Bottom border, top-right close |
| Message bubble | `max-width: 300px`, 13px/1.55 | 28px avatar, 8px gap |
| Compose | 40px send button, 12/16px padding | Empty draft disables send |
| Root stacking | `z-index: 900` | Above header 20 / sidebar 10, below Arco modals and popovers |

**Interaction and states.** Click toggles the panel; pointer-down outside the panel or launcher closes it; Escape closes it and returns focus to the launcher; the compose input receives focus on open and the message log scrolls to the newest entry. Submitting trims the draft, appends the user line plus one simulated reply, clears the input and scrolls again. `role="dialog"`, `aria-modal="false"`, `aria-expanded`, `aria-controls`, `aria-live="polite"` and visible `:focus-visible` outlines are required. Hover/focus applies a `scale(1.06)` with a brand-colour drop shadow; `prefers-reduced-motion: reduce` removes the transition.

**Copy and scope.** The three seeded messages and the compose block follow 天枢, but welcome, sample question and answers refer to OpenData modules (data catalogue, task centre, message centre, certificates). Replies are **local simulations** keyed off business keywords under `assistant.*`; the fallback states that demo data is in use and no online model is connected — it must not claim a service outage. `zh-CN` and `en-US` carry the same key set. Dark mode reuses `--color-bg-popup`, `--color-fill-2/3`, `--color-text-1/2` and `--primary-6`; the avatar artwork is theme-independent. Never mount a second instance inside a layout shell, and never widen the panel to fit longer English copy.

## Colors

The Metritag palette is an 8-step brand ramp plus functional, neutral, text, and border ramps. **Do not substitute Arco's `#165DFF` primary or Arco's semantic ramps.** Map these values into application-semantic CSS variables; never put a raw HEX in page code.

### Theme color 主题色

Brand ramp. `Theme-6 #0DB9C6` is the primary action and selection color.

**Primary update, 2026-11-05 (final):** by user decision, the primary color changes from blue `#005BF5` to teal `#0DB9C6` and stays at that single value everywhere — buttons, links, row actions, active menus, focus, and graphics. An intermediate two-shade variant (interactive `#0A8290` + bright `#0DB9C6`) was implemented same-day for WCAG contrast but **was reverted by user decision: the primary stays `#0DB9C6`**, with white text/icons on solid fills. This entry supersedes the cached Figma blue ramp.

| Token | Value | Role |
|---|---|---|
| `Theme-1` | `#DFF7F9` | 浅色/白底悬浮 — light fill, hover on white |
| `Theme-2` | `#A8ECEF` | 文字禁用 — disabled text |
| `Theme-3` | `#72DEE3` | 一般禁用 — general disabled |
| `Theme-4` | `#3CCFD8` | 特殊场景 — special cases |
| `Theme-5` | `#22C4CF` | 悬浮 — hover |
| **`Theme-6`** | **`#0DB9C6`** | **主题色 — primary（user decision 2026-11-05, single value）** |
| `Theme-7` | `#0A9AAB` | 点击 — active/pressed |
| `Theme-8` | `#0A6E7C` | 品牌色 — brand deep |

**Contrast note [Project, recorded; superseded by user decision].** `Theme-6 #0DB9C6` measures 2.39:1 both as white-on-fill and as text on white, below WCAG AA (4.5:1). A two-shade split (`#0A8290` interactive) was implemented on 2026-11-05 and then reverted the same day by user decision to keep the single primary `#0DB9C6` with white text on solid fills. The measured ratios are retained here as the recorded trade-off of that decision; if accessibility certification is ever required, revisit this entry rather than silently re-splitting the hue. Dark mode keeps the lifted fill `#2BD0DC` with dark-teal `#0A3A40` text (6.59:1).

### Subsidiary color 辅助色

| Token | Value | Role |
|---|---|---|
| `Subsidiary-1` | `#EBFFFD` | 浅色/白底悬浮 |
| `Subsidiary-2` | `#C2FFFB` | 文字禁用 |
| `Subsidiary-3` | `#99FFFC` | 一般禁用 |
| `Subsidiary-4` | `#70FFFF` | 特殊场景 |
| `Subsidiary-5` | `#47F9FF` | 悬浮 |
| **`Subsidiary-6`** | **`#1DE4F3`** | **辅助色 — accent** |
| `Subsidiary-7` | `#0EB9CC` | 点击 |
| `Subsidiary-8` | `#0390A6` | 深色 |

### Functional colors 功能色

Each functional ramp is ordered by the source as regular → hover → active → disabled → special → light background. Note the ramps are **not** monotonic by index: `-6` is the regular value, `-4` is hover, `-7` is active.

| Role | `-1` light bg | `-2` special | `-3` disabled | `-4` hover | `-6` regular | `-7` active |
|---|---|---|---|---|---|---|
| Success 成功 | `#DCF5DE` | `#95E89D` | `#69DB78` | `#42CF5A` | **`#00B42A`** | `#008F26` |
| Warn 警示 | `#FFF4E6` | `#FFD6A3` | `#FFBF7A` | `#FFA552` | **`#FF6B00`** | `#D95300` |
| Error 错误 | `#FFECE8` | `#F6BCB3` | `#EE8D82` | `#E55D53` | **`#D40000`** | `#B20006` |

### Neutral fills 背景填充色

| Token | Value | Role |
|---|---|---|
| `Fill-1` | `#F7F8FA` | 默认页面底色背景 — page canvas |
| `Fill-2` | `#F2F3F5` | 容器背景/表头背景 — container, table header |
| `Fill-3` | `#E7E7E7` | 组件背景 — component background |
| `Fill-4` | `#DCDCDC` | 组件背景悬浮 — component hover |
| `Fill-5` | `#A6A6A6` | 组件背景点击 — component active |
| `Fill-6` | `#000000 @ 50%` | 遮罩层 — overlay mask |
| `Fill-7` | `#FFFFFF` | 白色/卡片背景 — surface, card |

### Text 文字

| Token | Value | Role |
|---|---|---|
| `Text-1` | `#FFFFFF` | 纯白文字 — on dark/brand fills |
| `Text-2` | `#CCCCCC` | 置灰信息 — disabled |
| `Text-3` | `#999999` | 备注/底纹词 — source placeholder/caption role; not contrast-safe for readable text on white |
| `Text-4` | `#666666` | 次要信息 — secondary |
| `Text-5` | `#333333` | 次强调/正文标题 — body, sub-emphasis |
| `Text-6` | `#1A1C20` | 强调/正文标题 — emphasis, titles |

### Border 边框

| Token | Value | Role |
|---|---|---|
| `Border-1` | `#EEEEEE` | 分割线 — divider |
| `Border-2` | `#FFE696` | 单选/多选 — radio/checkbox accent |
| `Border-3` | `#DDDDDD` | 默认边框 — default control border |

### Interaction tints not in the base palette

**[Derived]** The Button and Select components use a finer primary interaction ramp than the eight-step Theme scale. These values are measured source states for controls, even though the Colors page does not list them. Their presence does not certify contrast; the white-on-`#2D7EF7` hover pair remains an accessibility issue below.

| Value | Measured use |
|---|---|
| `#2D7EF7` | Primary emphasize/outline **hover** fill and stroke |
| `#0044CB` | Primary emphasize/outline **active** fill and stroke |
| `#E6F3FF` | Secondary-primary **normal** fill; text-button primary hover fill; selected menu item; Alert info background |
| `#B8DBFD` | Secondary-primary **hover** fill; primary emphasize **disabled** fill; text-button primary active fill |
| `#7AB8FF` | Secondary-primary **active** fill; primary outline/text **disabled** stroke and text |

Where `#E6F3FF` and `Theme-1 #E8F2FF` both appear as a pale primary tint, **components use `#E6F3FF`**. Treat `Theme-1` as the page-level pale primary and `#E6F3FF` as the control-level one; do not swap them.

### Rules [Stated]

- Basic conventional colors comprise theme color, neutral color, text color, mask color, and functional colors.
- Each product has at least one theme color and may define additional auxiliary theme colors.
- The page defines **system-level** color. Product-level color may be adjusted per business need, but adjustment is a recorded decision, not a page-local choice.
- Colors carry brand/VI identity and are used for primary buttons, primary tags, and icons that must express brand character.

### Application semantic layer [Project]

Keep three distinct layers: **Figma primitive** (the measured tables above), **application semantic role** (stable `--app-*` contract), and **Arco adapter** (central mapping to its installed theme variables). The table gives the *light-mode target* and the observed implementation as of this document revision; an alias existing in CSS is not evidence that it resolves to the Figma value. Current source: `src/design/tokens.css` and `src/styles/global.css`.

| Semantic role | Light-mode Figma target | Current project mapping | Status |
|---|---|---|---|
| `--app-page` | `Fill-1 #F7F8FA` | `--mt-fill-1` in `global.css` | Bound: light resolves to `#F7F8FA` and is painted by `body` + `.product-shell`; dark resolves through Arco `--color-bg-1` (`rgb(23, 23, 26)`), not the `--mt-d-bg-1 #17181C` table value |
| `--app-surface` | `Fill-7 #FFFFFF` | `--color-bg-2` in `global.css` | Verify resolved value and use on page/card surfaces |
| `--app-accent` | `Theme-6 #0DB9C6` (2026-11-05 final) | `rgb(var(--primary-6))`; adapter re-points `--primary-*` to the teal ramp in `tokens.css` | **Open DS-02:** verify every Arco component state resolves to the teal ramp after the adapter change |
| `--app-text-primary` | `Text-6 #1A1C20` | `--color-text-1` in `tokens.css` | Verify resolved value and contrast |
| `--app-divider` | `Border-1 #EEEEEE` | `--color-border-2` in `global.css` and `tokens.css` | Verify resolved value; distinguish divider from control border |
| `--app-control-border` | `Border-3 #DDDDDD` | `#DDDDDD` in `tokens.css` | Light value aligned; verify dark and focus states |
| `--app-field-colon` | No Figma target — project extension (2026-11-06) | `'：'` on `:root`; `':'` under `html[lang^='en']` in `global.css` | Bound: consumed by `.app-field-label::after` and `.app-detail-label::after`; verify computed `content` in both locales |

`--app-page-bg` appears in earlier examples but is **not** a defined project alias; use the actual `--app-page` name when updating the implementation contract. The palette tables are authoritative Figma evidence; this mapping table is an implementation gap register, not permission to swap a Metritag value for an Arco default. Resolve DS-02 by defining one central adapter, checking the computed value for every role in light/dark, then updating this table and the code together. Do not duplicate raw HEX values in individual pages. Status meaning must never depend on color alone.

## Dark theme [Project-Dark]

**Status.** Not verified as a Figma dark specification in this cache. This is an implemented project-authored mapping of the Metritag light palette onto a dark surface model, subordinate to any authenticated dark mapping from design. The numerical pairings below are checks of selected tokens, not a complete WCAG 2.2 AA audit of rendered controls and states. Product and design ownership of the dark-mode release remains to be confirmed.

**Method.** Surfaces invert into a four-step elevation ladder (darker = lower). The brand and functional hues are **lifted in lightness**, not merely reused: the superseded blue `#005BF5` on a dark surface measured 2.93:1 and failed, so dark mode used a lifted `#4D8DF8`; the 2026-11-05 teal primary already reads 8.56:1 when lifted to `#2BD0DC`. The text ramp is rebuilt rather than inverted, because a straight inversion of `#CCCCCC`/`#999999` reproduces the same failures in the opposite direction.

### Surfaces

Light mode layers by *lightness descending* (`#FFFFFF` card on `#F7F8FA` page). Dark mode layers by *lightness ascending* — the raised surface is lighter. Do not carry the light-mode ordering across.

| Dark token | Value | Light counterpart | Role |
|---|---|---|---|
| `--mt-d-bg-1` | `#17181C` | `Fill-1 #F7F8FA` | Page canvas |
| `--mt-d-bg-2` | `#1F2126` | `Fill-7 #FFFFFF` | Card / business surface |
| `--mt-d-bg-3` | `#26282E` | `Fill-2 #F2F3F5` | Container, table header, input fill |
| `--mt-d-bg-4` | `#2E3138` | `Fill-3 #E7E7E7` | Component background, hover |
| `--mt-d-bg-5` | `#3C4049` | `Fill-4 #DCDCDC` | Component active |
| `--mt-d-bg-popup` | `#26282E` | `Fill-7 #FFFFFF` | Dropdowns, dialogs, drawers, tooltips |
| `--mt-d-mask` | `rgba(0,0,0,.65)` | `Fill-6 #000000 @50%` | Overlay mask — raised from 50% because a 50% mask over a dark page no longer separates the layer |

### Text

| Dark token | Value | Light counterpart | On `bg-2` | On `bg-1` |
|---|---|---|---|---|
| `--mt-d-text-6` | `#F2F3F5` | `Text-6 #1A1C20` | 14.51:1 | 15.98:1 |
| `--mt-d-text-5` | `#D4D6DB` | `Text-5 #333333` | 11.08:1 | 12.20:1 |
| `--mt-d-text-4` | `#9CA0A8` | `Text-4 #666666` | 6.14:1 | 6.76:1 |
| `--mt-d-text-3` | `#878B94` | `Text-3 #999999` | **4.72:1** | 5.20:1 |
| `--mt-d-text-2` | `#5A5E68` | `Text-2 #CCCCCC` | 2.42:1 — disabled only | — |
| `--mt-d-text-1` | `#0A0C10` | `Text-1 #FFFFFF` | — | Label on a lifted brand fill |

`--mt-d-text-3` is deliberately lighter than a literal inversion so that **placeholder text passes AA in dark mode** — a case that fails in light mode. `--mt-d-text-2` remains below AA by design, matching light mode: it is for disabled text only, and disabled state must never be signalled by color alone.

Note `--mt-d-text-1` is near-black, not white: on a lifted brand fill such as `#4D8DF8`, dark text (6.04:1) outperforms white (2.9:1).

### Brand and functional

**2026-11-05 primary update:** the dark brand row is re-derived for the teal primary. The old blue rows are kept below as superseded history.

| Dark token | Value | Light counterpart | On `bg-2` |
|---|---|---|---|
| `--mt-d-primary` | `#2BD0DC` | `Theme-6 #0DB9C6` | 8.56:1 |
| `--mt-d-primary-hover` | `#22C4CF` | `Theme-5 #22C4CF` | 7.57:1 |
| `--mt-d-primary-active` | `#0A9AAB` | `Theme-7 #0A9AAB` | — fill only |
| `--mt-d-primary-pale` | `#123B41` | `Theme-1 #DFF7F9` | Selected row, pale fill |
| `--mt-d-primary-pale-hover` | `#0F4A52` | `#BFFBFF` | — |
| `--mt-d-success` | `#3FD15F` | `#00B42A` | 8.05:1 |
| `--mt-d-success-bg` | `#15291A` | `#DCF5DE` | — |
| `--mt-d-warn` | `#FF9A4D` | `#FF6B00` | 7.66:1 |
| `--mt-d-warn-bg` | `#2E2015` | `#FFF4E6` | — |
| `--mt-d-error` | `#FF6A5E` | `#D40000` | 5.73:1 |
| `--mt-d-error-bg` | `#2E1A18` | `#FFECE8` | — |
| `--mt-d-accent` | `#1DE4F3` | `Subsidiary-6 #1DE4F3` | Unchanged — already passes at 10.4:1 |

The pale semantic backgrounds are **not** the light values darkened by opacity. They are hue-matched near-neutrals; an alpha-blended light tint turns muddy over a dark surface.

### Borders

Dark mode needs a **two-tier** border system, because one value cannot serve both roles at AA.

| Dark token | Value | Light counterpart | Role | Contrast vs `bg-2` |
|---|---|---|---|---|
| `--mt-d-border-1` | `#2E3138` | `Border-1 #EEEEEE` | Divider — decorative, exempt from 3:1 | 1.24:1 |
| `--mt-d-border-3` | `#6E7684` | `Border-3 #DDDDDD` | **Control border** — input, select, outline button | **3.52:1 PASS** |
| `--mt-d-border-2` | `#C9A227` | `Border-2 #FFE696` | Radio/checkbox accent | 5.0:1 |

A control border must reach 3:1 as a meaningful non-text boundary; a divider between rows need not. Using `--mt-d-border-1` on an input would fail the audit.

### Implementation status

The dark tables above are the **project mapping target**, not an exact copy of the current CSS. `src/design/theme.ts` toggles `body[arco-theme='dark']`; `src/design/tokens.css` currently defines only a subset of the dark roles, with several aliases still resolved through Arco. Reconcile them through the same semantic layer as light mode (DS-02), then verify all visible states (DS-05). Page components should not each maintain a second dark palette.

The current application offers light and dark, not a system-following choice. Such a choice would need product approval plus an initial-mode, persistence, and OS-change policy. Test first paint rather than assuming a later theme toggle prevents a flash.

### What dark mode does not change

Geometry is theme-independent: control heights (40/32/24), radii (2/4/8), the default 4px sizing rhythm (with the 205px sidebar as the one explicit shell-size exception), and fixed overlay widths do not change with theme. Both updated page layouts retain a 56px header and 16px content margin; the top-side-content shell retains a 205px sidebar, with adjacent content modules 12px apart (2026-11-05). The separate Figma navigation component's 240px/64px variants are not page-shell widths.

### Verification required before shipping dark mode

Shadows are near-invisible on dark surfaces — the three elevation levels must be re-verified and will likely need a border or a lighter raised surface to carry separation instead. Also check: chart series legibility, upload previews and user images against the dark canvas, icon stroke weight, focus-ring visibility, third-party widgets, and first-paint flash.

**Dark mode is not released until every state in the interaction-states table has been inspected in dark.** A light-mode pass is not evidence.

## Typography

**Family:** `PingFang SC` throughout the source. [Stated] Prefer each platform's official system font; this specification governs the Chinese desktop web product.

```css
:root {
  --mt-font-sans: 'PingFang SC', -apple-system, BlinkMacSystemFont,
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

### Type scale

Thirteen size/weight/line-height combinations across eight sizes. Weight `600` is `PingFangSC-Semibold`; `400` is `PingFangSC-Regular`. There is no 500-weight step in the scale.

| Size | Weight | Line-height | Name (source) | Use |
|---|---|---|---|---|
| 48px | 600 | 56px | 运营标题-中 | Marketing/large display headline |
| 36px | 600 | 44px | 运营标题-小 | Marketing/small display headline |
| 24px | 600 | 32px | 标题-大 | Detail-page or standalone page title, emphasized |
| 24px | 400 | 32px | 标题-大 | Detail-page or standalone page title, regular |
| 20px | 600 | 28px | 标题-中/模块标题 | Overview heading that leads a scroll region — **not** a card, dialog, drawer, or section title |
| 20px | 400 | 28px | 标题-中/模块标题 | Overview heading, regular — same restriction |
| **16px** | **600** | **24px** | 标题-小 | **Card, dialog, drawer, and section titles** |
| 16px | 400 | 24px | 标题-小 | Emphasised body, large control and Tag text |
| **14px** | **600** | **22px** | 正文-常规-加粗 | **Body emphasized outside data lists — form field labels** |
| **14px** | **400** | **22px** | 正文-常规 | **Body default — the primary UI size** |
| 12px | 600 | 20px | 辅助文案/标签文字 | Caption/tag emphasized |
| 12px | 400 | 20px | 辅助文案/标签文字 | Caption/tag, metadata, timestamps |

14px/400/22 is the default control and table text. 14px/600/22 is the table header and emphasized label. The 36px and 48px steps are operational/marketing sizes and do not belong on a dense business route.

**[Derived]** Line-heights are fixed per step, not a ratio: 12→20, 14→22, 16→24, 18→26, 20→28, 24→32, 36→44, 48→56. Use the paired value; do not compute `1.5×` and round.

**[Project]** Use tabular numerals for aligned numeric columns where the font supports them. Align monetary amounts right with declared currency and precision; keep IDs copyable. Test long Chinese, English, numeric, and mixed strings and 200% text enlargement. Do not scale core type with viewport units.

### Title roles and vertical rhythm [Project]

**[Project — reaffirmed 2026-11-06]** 业务页面内容区不显示页面标题、副标题或开场说明，页面身份由应用导航表达，直接从工具栏、查询条件或业务内容开始。不得添加通用的“本地演示”说明作为页面副标题。弹窗、抽屉与必要的业务分区标题仍按对应规范使用。

Two title roles are in scope on a business route. Size carries grouping; weight `600` plus `Text-1` colour carries emphasis. Never rely on colour alone, and never add a fourth size that differs from its neighbour by less than 4px. Business pages render **no page title and no subtitle** in the content area (see the 2026-10-24 decision note at the top of this document); page identity is carried by the shell navigation.

| Role | Spec | Where | Count per page |
|---|---|---|---|
| Card / dialog / drawer / section title | **16px/600/24** | Panel headers, `a-card` title, dialog and drawer headers, section dividers | One per panel or section |
| Group label inside a panel | 14px/600/22 | Form groups, table headers, field labels | As needed |

**Why 16px for panel titles.** 16px/600 is the Arco card, dialog, and drawer title default, and this specification already assigned 16px/600 to Drawer and Popconfirm titles. Promoting it to a single panel-title role removes the earlier split where one visual role was 20px in a card and 16px in a drawer, and it removes the need for a per-component font override. Card and dialog titles at 20px also read as marketing headings rather than panel labels once body copy is 14px.

**Separation at 16px.** A 16px/600 title over 14px/400 body separates by 2px of size and one weight step. That is enough only when the title also differs in colour (`Text-1` against `Text-2`/`Text-3`) and when the title-to-content gap is consistent. Do not restore 20px to fix a weak title — if a panel title still reads as body copy, the cause is spacing or colour, not scale.

**Title block.** Treat a title as a block: its line box plus 8px above and below. A 16px panel title therefore occupies 40px (24 + 8 + 8). Keep 12px between a title block and the content it governs, and do not stack an additional 16px or 20px margin on top of the block.

**20px.** 20px/600/28 survives only for an overview heading that leads a whole scroll region. It is not a card, dialog, drawer, or section title. The Empty component's 20px/400/28 caption remains its own sanctioned use. 24px and above belong to detail-page and standalone page heroes; do not introduce them inside a panel.

**Components with measured header gaps.** A measured header gap is not a typography value, and a title must never be enlarged to fill one that is too big for it. The Dialog is the worked case: its 40px header-to-body gap was measured against a 20px title, so the title block rule required it to be re-derived to 24px — see Dialog 对话框. Apply the same review to any other measured header gap: keep the gap only if it still reads as attached at 16px, otherwise re-derive it from the title block and record the change.

### User-facing language [Project]

Titles, labels, table headings, buttons, status, help, and empty/error copy are concise Simplified Chinese. Reject decorative English eyebrow labels, side-by-side bilingual headings, and acronym-only metric names (`DAU` → `日活跃用户`, `GMV` → `成交金额`). Technical values, IDs, event names, API keys, file types, and versions keep their original spelling. English documentation does not change UI copy. The product supports `zh-CN` and `en-US`: every business page, route, overlay, table, filter/column setting, feedback message, tooltip, and accessible name must use matching Vue I18n keys in both locales; do not hardcode user-facing Chinese or English in templates, and do not use display strings as domain keys. Switching locale must update the page and any open overlay without a reload, including Arco component text. Field-label punctuation is the one deliberate exception to copy living in `i18n.ts`: the trailing `：` / `:` is a locale-driven CSS token (`--app-field-colon`), not a translatable string, so it switches with `<html lang>` while both locales keep colon-free label values (2026-11-06 decision, Form field layout). Before delivery, verify switching in both directions, direct load/refresh with the saved locale, long English labels, keyboard/accessible text, and missing-key/fallback warnings. Other locales require a decision, domain-keyed translations, a synchronized Arco locale, long-label tests, and localized export headers.

## Product copy [Project]

### Data provenance and copy

**Production surfaces speak as real product.** Do not add decorative “demo / prototype / sample” labels to a real workflow. Equally, do not present a mock result, mock login, or unavailable backend capability as a confirmed live service. These are separate requirements: concise product copy never overrides truthful data provenance.

**Development and review environments:** typed module-scoped mocks may drive credible lists without marking every row as a sample. The environment or affected workflow must nevertheless be identifiable as non-production wherever a reviewer could mistake the results for live data or act on them as such. A delivery note alone is insufficient for an independently accessible preview. State actual integration gaps precisely, and never announce a mock write as a server-confirmed success.

**Production gate:** do not release a mock-backed business workflow as live. If a backend is unavailable, expose the actual unavailable state and recovery path instead of fabricated records or a success toast. Product decides the exact environment-level disclosure copy; it need not become a banner on every screen.

Never prefill real credentials or print a password on a sign-in page. If local demo credentials are explicitly required for a controlled test, identify them as local mock behavior, keep them out of production, and follow `AGENTS.md`'s masking and secret-handling rules.

## Spacing & Layout

### Canvas and breakpoints [Source reference + approved layout update]

- The cached Figma Layout page recommends a **1440px** artboard and lists **1280px** as its minimum design size and **1920px** as its maximum reference size. These are design references, not a supported-browser-width contract.
- The two page shells below follow the **2026-10-22 Figure 1 / Figure 2 update**: their content regions are fluid, with 16px outer margins. The older fixed 1200px content column and frozen width above 1920px do **not** apply to these updated patterns. A future maximum content width requires a separate, explicit decision.

### Size increment [Stated]

**Use 4 as the default minimum increment** for element size, padding, and margin. Padding progresses in 4px steps. The **56px header** follows that rhythm and needs no exception. The user-specified **205px sidebar** is the single explicit shell-size exception; do not round it to 204px or 208px.

**[Project] Header height revision.** The source measured the page-shell header at 55px, but the Figma navigation component's own brand row is 56px and the implemented shell renders 56px. Adopting **56px** makes the shell and the navigation component agree and keeps the height on the 4px rhythm, so no one-pixel exception is needed. Previous 55px references, including the Figure 1 / Figure 2 descriptions, are superseded; do not reintroduce 55px.

This replaces Arco's own rhythm as the governing rule. The updated 16px outer margins and the 16px panel inset are multiples of 4; the content-region module gap is now **12px** (2026-11-05 user decision, below). They remain **distinct rules** with distinct scopes. The source's 20px module-card-to-inner-content distance is superseded by the 16px panel inset — do not treat these rules as interchangeable, and do not reinstate 20px inside a panel.

**[Project] Content-region module gap — 2026-11-05 user decision.** The vertical gap between adjacent content blocks in a page's content region (typically the 筛选条件 block above the 数据列表 block, and any further sibling white panels) is **12px**, replacing the earlier 16px inter-module gap. This is the content-area block spacing rule for business list pages (功能台账, 数据类型, 数据字典, 材料清单, 规则配置, 审计管理, 测试方法, 问卷工作台, and the same stack on detail/edit routes); it does not change the 16px shell gutters around the content region, the 16px panel inset, the 16px sidebar-to-content gap, or any in-panel spacing rule.

**[Project] Full-site spacing implementation — 2026-11-12 user decision.** The 16px / 12px split is now enforced on **all** routes, in both patterns, rather than only on the list pages named above. Scope: every pair of adjacent sibling blocks inside the content region, whether stacked vertically (filter panel ↔ list, tab strip ↔ filter ↔ list, detail/edit sub-pages, design-system example page, message-center header ↔ list) or placed side by side (项目归档 directory ↔ content). Every such pair resolves to `var(--mt-ds-space-3)` (12px); a new page must not introduce a 16px inter-module gap. The shell's four 16px gutters share `--app-page-gutter` and remain a separate rule owned by `ProductLayout.vue` / `global.css`; the 16px panel inset and all in-panel spacing keep their own values. The ≤900px stacked shell keeps 16px on all four sides and 16px between the horizontal menu and the content. Authoritative implementation contract under Governance; measured evidence is headless DOM / computed-style assertions, never screenshots. **Exception — 2026-11-13 user decision:** the 项目归档 directory ↔ content pair is `0px`, not 12px; the two panels remain independent and the block still ends 16px above the page bottom (see 项目归档 under Composition). No other route may use a 0px module gap.

### Spacing by scope [Source + approved layout update]

| Value | Meaning |
|---|---|
| **16px** | The outer content margin on all four sides in both updated page layouts (Figures 1 and 2) |
| **12px** | Gap between adjacent content blocks (modules) inside the content region — e.g. 筛选条件 block to 数据列表 block (2026-11-05 user decision; was 16px) |
| **16px** | Panel content inset — the distance from a card's or panel's edge to its content. Revised from the source's 20px together with the 16px panel-title role |
| **12px** | Distance from a title block to the content it governs, inside a panel (see Typography · Title roles and vertical rhythm) |
| 4px | The increment all other padding follows |

### Two page layout patterns [User-approved update, Figures 1 and 2]

**1 — Top-content (顶部-内容区布局, Figure 1).** The full-width **56px** header holds logo, first-level navigation, and auxiliary actions (user, settings, notifications), in that order from left to right. Below it, the content region fills the remaining available width and height. Its **outer margin is 16px on all four sides** (including the space below the header); the content div stretches within that margin. Do not apply the older 1200px fixed width, 64px header, or mandatory footer to this pattern. Any footer is a separate, explicit page requirement.

**Header inset.** The header's horizontal padding equals the content outer margin (**16px**), so the brand mark and the content region below it share one left edge, and the trailing actions share one right edge. The header itself spans the full viewport width; only its contents are inset. In Pattern 2 the header also spans full width, but its leading content aligns to the sidebar's own item inset rather than to the content margin — do not apply 16px there merely because the rule exists for Pattern 1.

The cached Figure 1 does not state a gap between multiple modules inside this content region; the 2026-11-12 user decision supplies it: **adjacent modules in this pattern are 12px apart**, the same `var(--mt-ds-space-3)` used by Pattern 2. Do not reuse the old Figma 20px module gap, and do not fall back to a 16px shell gutter between modules.

**2 — Top-side-content (顶部-侧边-内容区布局, Figure 2).** The full-width **56px** header sits above the sidebar and content. Below it, the sidebar begins flush at the left edge (**margin 0px**), measures **205px wide**, and adapts its height to the available area. The content region occupies the remaining width and available height, with **16px outer margin on all four sides** between its boundary and the sidebar/header/viewport. Adjacent modules **inside the content region** have a **12px gap** (2026-11-05 user decision; was 16px). This is the baseline pattern for most back-office pages; the older 240px Figma navigation-component width does not override the 205px page-shell width.

```text
Pattern 1 — top-content (Figure 1)
  Header 56px       [logo | L1 nav items | auxiliary menu]
  Content area      [16px margin | fluid content | 16px margin]

Pattern 2 — top-side-content (Figure 2)
  Header 56px       [logo | L1 nav items | auxiliary menu]
  Sider 205px       [flush left and bottom, margin 0, height below header]  ⇄ 64px collapsed rail
  Content area      [16px margin | fluid content; module gap 12px | 16px margin]
```

**Content region canvas [Project, 2026-10-24].** The system framework paints **one page background across the whole viewport**: `Fill-1 #F7F8FA` (`--app-page`; in dark mode the token remaps through Arco `--color-bg-1`), **including the 16px gutters around the content region** — no white frame remains between the shell and the content. The content region is built as an independent div **on top of this canvas**: the shell owns the 16px canvas gutters — top 16px above the content, right edge 16px, bottom 16px, and 16px between the sidebar and the content provided by `.product-main`'s left margin on top of the fixed 205/64px sidebar width (2026-11-12: all four read `--app-page-gutter`) — and each page's root node is itself a **white business panel** (`--app-surface`, corners-1 2px radius, 16px content inset) that fills the content region (天枢 models-content 同构).

- The 56px header and the 205/64px sidebar keep the white surface (`--app-surface`) as chrome over the page canvas; the sidebar sits flush left at full height below the header and is separated from the content by the 16px canvas gap, not by a border.
- Gutter geometry belongs to the shell and the panel is white: a page root must not re-add its own 16px margin or paint itself `Fill-1`; on this shell a `Fill-1`-filled or margin-carrying page root is a leftover of the retired white-frame architecture, not a variant.
- Verification anchor: the computed `background-color` of `body` and `.product-shell` resolves to `#F7F8FA` in light mode; the page root (`.surveys-page`, `.ledger-page`), the header, and the sidebar resolve to `#FFFFFF`. In dark mode `--app-page` resolves to Arco `--color-bg-1` (`rgb(23, 23, 26)`), which differs from the `--mt-d-bg-1 #17181C` table value above — reconcile that mapping at the next dark-token audit.

**Sidebar footprint [Project, 2026-10-23].** Two geometric rules that every Pattern 2 sidebar must satisfy, in both the expanded and the collapsed state:

- **The bottom edge is flush with the page bottom.** The sidebar ends exactly at the viewport bottom — no page-wrapper `padding-bottom`, no strip of page canvas under it, no rounding at the bottom corners. The 16px breathing room at the bottom of a screen belongs to the content region (its own bottom margin), never to the wrapper that holds the sidebar; otherwise the sidebar is pushed up and the two bottom edges stop matching.
- **The height is fixed, not content-driven.** The sidebar is `position: sticky` with `height: calc(100dvh - 56px)` and `top: 56px`, so a long page scrolls inside the content region while the sidebar stays pinned. It must never be `align-self: stretch` inside a `min-height` page: that makes it grow with the document, scroll away with it, and re-open the bottom gap. Menu entries that overflow the available height scroll inside the sidebar, above the 44px toggle.

**Sidebar collapse [Project, 2026-10-23].** Navigation sidebars in Pattern 2 (system settings, model projects) can be collapsed to an icon-only rail. This section records the decision the earlier shell specification left open: it fixed the 205px expanded width but named no collapsed width or breakpoint.

| Property | Expanded | Collapsed |
|---|---|---|
| Width | **205px** (the Pattern 2 shell value) | **64px** — reuses the Figma navigation component's 64px icon-only variant, now adopted as the shell rail width |
| Height | fills the area below the 56px header (`calc(100dvh - 56px)`), sticky at `top: 56px`; the menu list scrolls inside it | same |
| Item composition | 16px icon + label, 10px icon-to-label gap, **40px** row (5px/16px padding), 14px/22px text, **20px** left inset in every shell | icon centred at 18px, label removed |
| Group trigger | label + caret, children listed underneath | icon only; activating it expands the sidebar and opens that group instead of toggling an invisible list |
| Active state | primary text on the `theme-1` fill | icon keeps the same colour and fill; the active icon is the only position cue, so nothing else may rely on the label |
| Toggle | 44px footer row with the `menu-fold` icon and 收起侧栏, above a hairline divider | `menu-unfold` icon and 展开侧栏 |
| Motion | width transition 200ms ease, disabled under `prefers-reduced-motion` | — |

- The toggle is a real button, not a decorative chevron: `aria-expanded` reflects the sidebar state, its accessible name switches between 收起侧栏 and 展开侧栏, and focus stays on the button after toggling.
- Collapsed items keep their accessible name through `aria-label` plus a `title` tooltip, because the visible label is removed; an icon alone is never the only name of a menu entry.
- The state is remembered per shell in `localStorage` (`tianshu-sidebar-collapsed:<shell>`), so refresh, back/forward, and a direct link into a child route keep the user's choice. When storage is unavailable the fallback is session-only, never a broken layout.
- Content margins stay 16px in both states: collapsing widens the content region, it does not change content padding or the 16px gap between sidebar and content.
- The sidebar stops being sticky and hides its toggle below **901px** in every shell. The page stacks the sidebar above its content at its own narrow breakpoint — **901px** in system settings, **761px** in model projects, whose card grid needs the full width sooner — and from there the sidebar is a full-width block. A 64px rail cannot carry a six-item menu plus submenus on a narrow viewport.
- Only navigation sidebars collapse. Content panels that happen to sit on the left — the task-detail flow column, the overview notification/app column — are not sidebars and keep their own layout.

**Sidebar module icon semantics [Project, 2026-11-12 user decision].** Each first-level module icon must express **that module's business object**, not a generic container. Before this decision five of six HMG modules shared `IconFolder` and only 工作台 had `IconDashboard`; in the 64px collapsed rail the icon is the only position cue (see the collapse table above), so reusing one glyph makes the modules indistinguishable. The approved mapping is:

| Module (label key) | Business object | Arco icon | Why this glyph |
|---|---|---|---|
| 工作台 (`wb.title`) | cross-module metrics, charts and the pending queue | `IconDashboard` | an aggregate instrument panel, not a single business object |
| 任务管理 (`projects.title`) | projects driven by start / end / actual dates and assigned task nodes | `IconCalendar` | plan and milestone dates are the project's defining attributes |
| 分项管理 (`sections.title`) | the per-regulation / per-task item list split out under a project | `IconUnorderedList` | an enumerated item list, distinct from the project calendar and the task check-square |
| 任务执行 (`reports.tasks`) | execution and completion state of 车型配置 / 技术资料 / 测试记录 / 证书 / 报告 | `IconCheckSquare` | a checkable work item, not a folder of files |
| 项目归档 (`archive.title`) | retained deliverable directory | `IconArchive` | the dedicated archive-box glyph, now used only here |
| 模版管理 (`templates.title`) | reusable field structures and formats, plus usage records | `IconLayout` | a structured layout, not a file or a copy command |
| 标签管理 (`tags.title`) | classification tags | `IconTags` | multiple tags for a management list; a single `IconTag` would read as one item |

**2026-11-12 addition — 分项管理 entry.** 分项管理 is a first-level entry placed **immediately below 任务管理** in `src/app/navigation.ts` (route `/sections`), not a child of the projects menu. Its `IconUnorderedList` is the seventh distinct glyph: the module owns an itemised breakdown list, so neither the project calendar nor the generic folder glyph may be reused. The mapping table above is the authoritative seven-module set.

**Implementation contract.** All seven glyphs come from the same Arco icon family (per the one-icon-family rule under Components), and no two first-level entries may share a glyph. The single source is the `icon` field of `src/app/navigation.ts`; the sidebar renders it at 16px and the shell's top navigation at 18px, both inheriting `currentColor` so the active primary colour and the hover/focus states apply without a second colour rule. A new module must pick a glyph that names its own business object — falling back to `IconFolder` or copying another module's icon is a defect. Second-level children stay text-only, and the icon remains decorative: the module name is carried by the visible label plus `aria-label` / `title` in the collapsed state. Verification is headless DOM assertion of per-module glyph uniqueness, SVG rendering, 16px/18px sizes, collapsed-rail visibility and currentColor inheritance in both locales and themes — no screenshots.

**One sidebar for every shell [Project, 2026-10-23].** Every Pattern 2 sidebar is the same component (`src/shared/components/AppSidebar.vue`). Geometry, row metrics, hover/active/focus states, the group accordion and the collapse toggle live there; a page only supplies its menu data — label, icon, target, active flag, children. System settings and model projects pass different menus and nothing else, which is how the two shells stay identical, and a new page with a left menu reuses the component instead of restyling a sidebar of its own.

A first-level entry comes in three shapes:

| Shape | Has | Behaviour |
|---|---|---|
| Link | a route | navigates; `aria-current="page"` and the active fill when the route matches |
| Group | children | expands/collapses only (see below); never navigates |
| Action | neither | renders as a `<button>`, triggers a command or a "not yet available" message (for example 问题管理 in model projects). It must never look like a link or steal the active state |

**Sidebar groups — one expanded at a time [Project, 2026-10-23].** A Pattern 2 sidebar contains two kinds of first-level entry: **leaves** (they navigate) and **groups** (they hold one flat level of children). The sidebar behaves as an **accordion**: at most one group is expanded at any moment. Expanding a group collapses whichever group was open before it, so a user who opens a page under one group and then clicks a second group never ends up with two open submenus pushing the menu — and the toggle at the bottom — out of place.

| Situation | Result |
|---|---|
| Initial load, or a direct link into a child route | Only the group containing the active page is expanded; every other group starts collapsed |
| Initial load on a leaf entry (no group involved) | No group is expanded — zero open groups is a valid state, not an empty sidebar |
| Activating another group | That group expands and the previously expanded one collapses in the same interaction |
| Activating the group that is already expanded | It collapses; the accordion may hold zero open groups |
| Navigating into a child of a collapsed group (breadcrumb, in-page link, browser back/forward) | That group expands and the previous one collapses — the active page is always visible in the sidebar |
| Sidebar collapsed to the 64px rail | Activating a group expands the sidebar and opens that group; the rail never holds a hidden submenu state |
| Sub-items | One flat level directly under the group. Do not nest a third level in a sidebar; if a domain needs three levels, split it into separate first-level pages |

- The group trigger shows its state with the caret (`down` icon, rotated 180° when open) and `aria-expanded`; do not animate list height — the sublist appears at once, because a height transition under a scrolling menu reads as lag.
- Group expansion is **view state, not stored preference**: unlike the collapsed width it is not persisted, it is re-derived from the current route on every entry. A refresh therefore always lands with the active page's group open, and a stale localStorage value can never hide the page the user is on.
- Only groups participate. A leaf entry neither opens nor closes a group, and activating it must not change another group's state.
- A group trigger only expands or collapses — it never navigates, and neither does collapsing it. When the area has an obvious landing page, list it as the group's first child rather than making the group label jump.


### Border radius [Stated]

Three levels, chosen by the designer per scenario.

| Token | Value | Scope |
|---|---|---|
| `corners-1` | **2px** | Controls — buttons, inputs, selects, tags, table cells |
| `corners-2` | **4px** | Containers — dialogs, alerts, messages, popconfirm |
| `corners-3` | **8px** | Large panels and illustrative/explanatory blocks |

There is no 6px, 10px, or 12px step in the specification. Circular elements (switch track, avatar) use a full radius.

## Elevation

The Figma source defines three shadow levels [Stated], each a three-layer composite. Keep those values unchanged. **Level 4 is a project-approved addition dated 2026-10-26**, scoped to persistent top navigation; it is not a Figma token or a replacement for the three floating/drag layers.

**一级投影 (Level 1)** — warning and popup components, e.g. global message / notification:
```css
box-shadow: 0 1px 2px -2px rgba(0,0,0,.16), 0 3px 6px 0 rgba(0,0,0,.12), 0 5px 12px 4px rgba(0,0,0,.08);
```

**二级投影 (Level 2)** — dropdown components, e.g. dropdown menu / popconfirm / picker:
```css
box-shadow: 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.04), 0 9px 28px 8px rgba(0,0,0,.05);
```

**三级投影 (Level 3)** — component hover states, e.g. table and tree drag:
```css
box-shadow: 0 6px 16px -8px rgba(0,0,0,.08), 0 9px 28px 0 rgba(0,0,0,.04), 0 12px 48px 16px rgba(0,0,0,.02);
```

**四级投影 (Level 4) [Project]** — a lighter, low-spread separation under a persistent top navigation bar, replacing its bottom border:
```css
box-shadow: 0 2px 6px rgba(0,0,0,.06);
```
Use `--app-shadow-4` in the shared header for both light and dark themes. Do not use this level for menus, notices, dialogs, or dragged elements. Its single soft layer is intentionally shallower than the three source composites; verify the rendered separation on each theme without adding a bottom stroke.

**[Derived]** Measured assignments: Message uses Level 3's composite; Tooltip uses Level 2; Dialog at 560px uses Level 3. Prefer spacing and surface contrast over shadow; use Levels 1–3 for their specified floating/drag contexts and Level 4 only for the persistent header. Centralize z-index and overlay containment.

## Surfaces

| Surface | Fill | Notes |
|---|---|---|
| Page canvas | `#F7F8FA` (`Fill-1`) | **Whole-page background** — `body` and `.product-shell`, including the 16px gutter around the content region (Content region canvas, 2026-10-24) |
| Card / business surface | `#FFFFFF` (`Fill-7`) | Framed content, panels |
| Container / table header | `#F2F3F5` (`Fill-2`) | Grouping and table head |
| Component background | `#E7E7E7` → hover `#DCDCDC` → active `#A6A6A6` | `Fill-3/4/5` |
| Overlay mask | `#000000 @ 50%` | `Fill-6` |
| Explanatory block | `#F2F3F5`, radius 8px | **[Derived]** the source's own 整体说明 blocks |

Not every route needs a white card. Separate content with space first; add a container only when the content is genuinely a framed tool, a repeated record, or an independently loading region. Do not nest cards inside cards.

## Icons

**[Stated]** A linear icon set for business scenarios, designed to universal standards, matching the Metritag brand: **linear, rounded**.

**Grid.** Draw on a unified **24×24px** grid. Inside the grid, align to pixel points wherever possible to preserve clarity.

**Keyline shapes** inside the 24px grid:

| Shape | Size |
|---|---|
| Square 正方形 | 18×18 |
| Horizontal rectangle 水平矩形 | 22×18 |
| Vertical rectangle 垂直矩形 | 18×22 |
| Circle 圆形 | 20×20 |

**Design principles [Stated]**
- **简单 Simple** — simplify parameters when drawing; eliminate decimal points and non-integer angles. Avoid unnecessary decoration on output.
- **精确 Precise** — avoid ambiguous figures; when one concept has several common depictions, pick the most widely circulated one and strengthen it where needed. Follow naming conventions on output so others can find the icon.
- **节奏 Rhythm** — maintain line rhythm even in necessarily dense icons so they feel comfortable rather than oppressive. A series of icons follows a principle of moderation: keep variation within a bounded range.

**Pixel alignment [Stated].** Non-integer pixels render as grey and damage clarity and meaning — align to the pixel grid. When handling symmetrical figures, centre them; do not break visual balance merely to meet the grid.

**Angles [Stated].** Where a line must slant, keep it parallel to the grid's 45° guide, or use multiples of 15° (the page illustrates 30°, 45°, 60°, 120°). This preserves line clarity at low resolution.

**Categories.** 方向指示类图标 (directional), 通用型图标 (general), 编辑类图标 (editing), plus a 面性图标-fill (filled) set alongside the linear default.

### Rendered sizes [Project]

The 24×24 grid governs the artwork; the rendered size is chosen by context:

| Context | Rendered size | Colour |
|---|---|---|
| Inline auxiliary icon in a title or field-label row (for example the metric card's `IconInfoCircle`) | **16px** | `Text-3`, never a semantic colour — help affordance is carried by the tooltip, not by the icon's colour |
| Icon inside a control (button, input affix, menu item) | Matches the control's text size, minimum 14px | Inherits the control's colour |
| Standalone illustrative icon (app tile, empty state) | 36px and up, per the component | Own palette |

An inline auxiliary icon never carries status meaning on its own; if the icon signals a state, pair it with text or a Tag. A 16px render of the 24px grid artwork keeps 2:3 proportions and stays crisp because the grid's keylines land on whole pixels at that size.


### Icon library inventory
**Library name [Stated]: IRS图标库.** The source directs that teams reference this library across different scenarios and projects to build a consistent user experience — it is the named, shared asset, not a per-project icon folder.

**[Derived]** The file ships **282 uniquely named icon components**, all drawn at **24×24px**, organized in three namespaces. Icon names are the contract — reference an icon by its full path (`general/search`), not by appearance. 39 icons have a paired `-fill` solid variant; the default is linear.
| Namespace | Count | Scope |
|---|---|---|
| `direction/` | 49 | Arrows, carets, expand/collapse, pagination jumps, rotate, swap |
| `edit/` | 27 | Text formatting, alignment, lists, sort, clipboard, color |
| `general/` | 206 | Business, status, media, file, system, and domain icons |

Complete name list, for reference when mapping a UI action to an icon:

<details>
<summary>IRS icon names in the cached Figma inventory (reference only)</summary>

This snapshot is not an import contract. Check the current Figma component name before using an icon; the naming defects below are not valid package API names.

**`direction/`** — `add-square`, `add-square-fill`, `arrow- rise`, `arrow-down`, `arrow-fall`, `arrow-left`, `arrow-right`, `arrow-up`, `caret- right`, `caret-down`, `caret-left`, `caret-up`, `check-square`, `check-square-fill`, `close-square`, `close-square-fill`, `down`, `down-circle`, `down-square`, `down-square-fill`, `down.double`, `expand`, `left`, `left-circle`, `left-square`, `left-square-fill`, `left.double`, `minus-square`, `minus-square-fill`, `page-first`, `page-last`, `right`, `right-circle`, `right-square`, `right-square-fill`, `right.double`, `rotate-left`, `rotate-right`, `shrink`, `swap`, `to-bottom`, `to-left`, `to-right`, `to-top`, `up`, `up-circle`, `up-square`, `up-square-fill`, `up.double`

**`edit/`** — `align-center`, `align-left`, `align-right`, `bg-colors`, `bold`, `brush`, `edit`, `eraser`, `find-replace`, `font-colors`, `formula`, `h`, `highlight`, `italic`, `language`, `line-height`, `ordered-list`, `original-size`, `paste`, `scissor`, `sort`, `sort-ascending`, `sort-descending`, `strikethrough`, `text`, `underline`, `unordered-list`

**`general/`** — `Launch`, `adjust`, `archive`, `at`, `back`, `bar chart`, `batch add`, `batch export`, `book`, `browser`, `bug`, `building`, `building-fill`, `business`, `business-fill`, `calendar`, `calendar-fill`, `camera`, `certificate`, `chart`, `chart-fill`, `check`, `check-circle`, `check-circle-fill`, `checkin`, `clock-circle`, `clock-circle-fill`, `close`, `close-circle`, `close-circle-fill`, `cloud`, `cloud-download`, `cloud-upload`, `code`, `code-block`, `code-square`, `command`, `common`, `compass`, `copy`, `copyright`, `customer`, `customer-fill`, `customer-service`, `dashboard`, `data`, `data-2`, `delete`, `demand docking`, `demo`, `desktop`, `double line chart`, `download`, `draft`, `drag-arrow`, `drag-dot`, `drag-dot-vertical`, `drive-file`, `early-warning`, `edit-fill`, `email`, `empty`, `exclamation`, `exclamation-circle`, `exclamation-circle-fill`, `export`, `eye`, `eye-fill`, `eye-invisible`, `eye-invisible-fill`, `face-frown`, `face-frown-fill`, `face-meh`, `face-meh-fill`, `face-smile`, `face-smile-fill`, `file`, `file-add`, `file-audio`, `file-image`, `file-pdf`, `file-video`, `filter-o`, `flow`, `folder`, `folder-add`, `folder-delete`, `gift`, `heart`, `heart-fill`, `history`, `home`, `hotline`, `idcard`, `idea`, `image`, `image-close`, `import`, `info`, `info-circle`, `info-circle-fill`, `journal`, `knowledge`, `layering`, `line chart`, `link`, `list`, `loading`, `loading-black`, `loading-blue`, `loading-white`, `location`, `lock`, `man`, `menu`, `menu-fold`, `menu-unfold`, `message`, `message-banned`, `message-fill`, `mind-mapping`, `minus`, `minus-circle`, `minus-circle-fill`, `more`, `more-circle`, `more-circle-fill`, `more-vertical`, `nav`, `nav-grid`, `notification`, `notification-close`, `notification-fill`, `objection`, `old-version`, `plus`, `plus-circle`, `plus-circle-fill`, `portrait`, `poweroff`, `process`, `pushpin`, `pushpin-fill`, `qrcode`, `question`, `question-circle`, `question-circle-fill`, `read all`, `redo`, `refresh`, `revise`, `robot`, `robot-add`, `safe`, `save`, `scan`, `schedule`, `search`, `select-all`, `send`, `settings`, `settings-fill`, `share-alt`, `share-external`, `share-internal`, `shopping`, `show`, `stacked graph`, `star`, `star-fill`, `stop`, `storage`, `subscribe`, `subscribe-add`, `subscribed`, `sync`, `table`, `table-add`, `text`, `thumb-down`, `thumb-down-fill`, `thumb-up`, `thumb-up-fill`, `tools`, `trophy`, `undo`, `undo-circle`, `unlink`, `unlock`, `upload`, `user`, `user-add`, `user-external`, `user-fill`, `user-gronp`, `user-management`, `user-management-fill`, `user-purview`, `video-camera`, `voice`, `wallet`, `warning`, `warning-fill`, `woman`, `zoom-in`, `zoom-out`

Once the IRS library has an approved distribution path and a route is migrated, use its icons consistently within that route. Until then, this codebase stays on Arco icons; do not copy individual Figma SVGs into a mixed family. Request missing IRS equivalents from design before migration.

</details>

### Icon library delivery — one source, three channels [Project proposal]

**[Project proposal, not a Figma delivery requirement.]** The Figma source contains 282 IRS icons on a 24×24 grid. If product/design approve a distribution pipeline, the following three channels could share that source. Neither an npm package nor a sprite is present merely because this proposal is documented.

| Channel | Audience | Form |
|---|---|---|
| **Figma library** | Designers | Source components on the 24×24 grid with `namespace/name` names; publishing status requires separate verification. |
| **NPM package (proposed)** | Business projects after approval and publication | Tree-shakable ES modules with typed exports. |
| **SVG sprite (proposed)** | Low-code and legacy projects after approval | A `<symbol>` sheet referenced by `<use>`. |

**Proposed precedence after delivery.** A Vue business project would use the npm package; the sprite would be a fallback where a bundler is unavailable. Until approval, publication, and migration, this codebase continues to use Arco icons.

#### Source of truth and naming

Under the proposed distribution contract, the Figma component name propagates into both artifacts: `direction/arrow-left` → `IconDirectionArrowLeft` (npm) → `#irs-direction-arrow-left` (sprite). Once published, renaming becomes a breaking API change requiring versioning and a deprecation alias.

The source currently contains naming inconsistencies that must be normalized **before** the first publish, because they become API once published: `direction/arrow- rise` and `direction/caret- right` carry a stray space; `general/user-gronp` is a typo for `user-group`; `direction/down.double` uses a dot where its siblings use a hyphen. Fix these in Figma first.

#### Package contract

- **Name:** `@maitang/irs-icons` (or the org's registry equivalent).
- **Format:** ESM with `"sideEffects": false` so unused icons are dropped. Ship a CJS fallback only if a consumer needs it.
- **One file per icon**, re-exported from an index — a single barrel file defeats tree-shaking in some bundlers.
- **Typed:** every icon is a Vue component accepting `size`, `color`, and the standard SVG attributes; `color` defaults to `currentColor` so icons inherit text color and themes automatically.
- **No hardcoded fills.** An icon that bakes in a hex cannot follow the dark theme.
- **Accessibility:** default `aria-hidden="true"` with `focusable="false"`; an icon conveying meaning on its own takes an explicit `aria-label` from the call site.
- **Versioning:** semver. Adding an icon is a minor; changing or removing a name is a major.

#### Sprite contract

- Built from the same export, emitted as `irs-sprite.svg` with one `<symbol id="irs-<namespace>-<name>" viewBox="0 0 24 24">` per icon.
- Served from the application origin, **not a public CDN** — the sprite is reachable on unauthenticated routes and must not leak a third-party request.
- Consumed as `<svg><use href="/assets/irs-sprite.svg#irs-general-user"/></svg>`, with `fill="currentColor"` on the symbol so theming still works.
- Version the filename (`irs-sprite.v1.svg`) so a cached sheet cannot silently change meaning.

#### Migration status and gate

**This codebase stays on Arco icons until the npm package exists.** Mixing families is worse than one consistent family, and the spec forbids ad-hoc mixing.

**Blocking gap — three icons in current use have no IRS equivalent:** `IconApps`, `IconFullscreen`, `IconFullscreenExit`. Migration cannot complete until design adds them or a documented substitute is agreed. Most other icons in use map directly (`general/lock`, `general/user`, `general/send`, `general/notification`, `general/exclamation-circle`, `general/info-circle`).

**Migration sequence, once published:** add the dependency → replace imports namespace by namespace, not file by file → verify stroke weight and optical size against the 24×24 grid at every call site → remove the Arco icon import → confirm no `@arco-design/web-vue/es/icon` import remains. Do not run the migration and a feature change in the same commit.

**Never** hand-copy an individual SVG out of Figma into the repo. It forks the source of truth and the copy will drift.

**[Project]** Use one icon family consistently. Give every icon-only action an accessible name and a tooltip; never replace an icon with a punctuation character. Task-critical actions must not exist only on hover.

## Components

Figma-backed geometry, fills, and variant states below come from the named component sets. Not every control or state is specified there; use the Unspecified component fallback for gaps. Arco supplies interaction mechanics.

### Component handoff and state contract [Project]

For a route using one of these components, record the Figma node/variant, the extra project or PRD rule, and the route-specific test result. The Figma column is **not** evidence that every listed interaction was designed there. The module PRD owns business data and state transitions; `AGENTS.md` owns implementation mechanics.

| Component | Figma-backed appearance | Additional acceptance before release |
|---|---|---|
| Button | 40/32/24px sizes; measured normal/hover/active/disabled, theme, icon, shape | Visible keyboard focus, loading/duplicate-submit prevention, disabled explanation where necessary, and the DS-03 hover-contrast resolution |
| Input / Select | 32px trigger, source focus/disabled variants; Select option rows 32/39px | Label and required rule, readable help/error, first-error focus, long option/scroll behaviour, keyboard selection, and meaningful placeholder contrast |
| Table / Pagination | Source cell/header and pagination variants; Table subtree is **partially cached** | Loading/empty/no-match/error, sort/filter semantics, stable row key, selection scope, horizontal scrolling, keyboard path, and a scoped DS-01 evidence check |
| Tag / icon action | Tag 32/24/20px visual sizes and icon/close variants | Text conveys the status without colour; check actual click/close target and spacing separately from the 20px visual box (24×24px target or an applicable spacing/equivalent exception) |
| Dialog / Drawer / Popconfirm | Measured geometry, themes, and overlay types | Focus entry/return, Escape/mask/X policy, dirty-state protection, one scroll owner, footer visibility, and low-risk-only Popconfirm use |
| Tabs | No Figma-measured tab variant; **Project** decision 2026-11-12 under the unspecified-component fallback | Hover is text-colour only with no background on the label or cell, active outranks hover (including while hovered), one global rule in `global.css`, and no page-local hover / colour / weight override; verify computed styles in both themes and locales |

Use this matrix as an index into the detailed component sections below, not as a replacement for their measured tokens. Mark a state **Project** or **PRD** when Figma does not specify it; never write “matches the measured matrix” for an unmeasured loading, keyboard, or server-error state.

### Button 按钮

**Purpose [Stated].** Starts an immediate action in response to a click, triggering business logic. Use it when the user must be told the content is an interactive trigger, or must be guided to click.

**Sizes [Stated].** Three sizes; height fixed, width hugs the text.

| Size | Height | Padding V | Padding H | Text |
|---|---|---|---|---|
| large 大尺寸 | **40px** | 8px | 24px | 16px / line-height 24 |
| medium 中尺寸 | **32px** | 5px | 16px | 14px / line-height 22 |
| small 小尺寸 | **24px** | 2px | 8px | 12px / line-height 20 |

**Radius:** 2px (`corners-1`) for all sizes and variants.

**Variant axes** (616 measured components): `variant类型` = emphasize 强调 / outline 线性按钮 / text 文字按钮 · `theme 主题样式` = primary 主要 / secondary 次要 / danger 危险 / 次要危险 · `size尺寸` = large / medium / small · `state 状态` = normal 默认 / hover 悬停 / active 点击 · `disabled 禁用` = true / false · `icon 图标` = true / false with `icon type` = prefixIcon 前置图标 / suffixIcon 后置图标 / singleIcon 独立图标 · `shape 形状` = rectangle 矩形 / square 方形 / circle 圆形.

**Measured state matrix.** Fill / border / text per variant, theme, and state. **2026-11-05 primary update:** the matrix below is the measured Figma (blue) evidence and is retained as source history; where a value follows from the primary hue, implementations resolve it through the teal ramp (`Theme-6 #0DB9C6` replacing `#005BF5`, `Theme-5 #22C4CF` hover replacing `#2D7EF7`, `Theme-7 #0A9AAB` active replacing `#0044CB`, `Theme-1 #DFF7F9` pale replacing `#E6F3FF`) via the Arco adapter rather than hard-coding the superseded blue values. On solid teal fills in light mode, button text/icon is white per the 2026-11-05 user decision; in dark mode on the lifted `#2BD0DC`, use dark-teal `#0A3A40` (see the Contrast note under Theme color).

| Variant | Theme | State | Fill | Border | Text |
|---|---|---|---|---|---|
| emphasize | primary | normal | `#005BF5` | — | `#FFFFFF` |
| emphasize | primary | hover | `#2D7EF7` | — | `#FFFFFF` |
| emphasize | primary | active | `#0044CB` | — | `#FFFFFF` |
| emphasize | primary | disabled | `#B8DBFD` | — | `#FFFFFF` |
| emphasize | secondary | normal | `#E6F3FF` | — | `#005BF5` |
| emphasize | secondary | hover | `#B8DBFD` | — | `#005BF5` |
| emphasize | secondary | active | `#7AB8FF` | — | `#005BF5` |
| emphasize | secondary | disabled | `#E6F3FF` | — | `#7AB8FF` |
| emphasize | danger | normal | `#D40000` | — | `#FFFFFF` |
| emphasize | danger | hover | `#E55D53` | — | `#FFFFFF` |
| emphasize | danger | active | `#B20006` | — | `#FFFFFF` |
| emphasize | danger | disabled | `#F6BCB3` | — | `#FFFFFF` |
| emphasize | 次要危险 | normal | `#FFECE8` | — | `#D40000` |
| emphasize | 次要危险 | hover | `#F6BCB3` | — | `#D40000` |
| emphasize | 次要危险 | active | `#EE8D82` | — | `#D40000` |
| emphasize | 次要危险 | disabled | `#FFECE8` | — | `#EE8D82` |
| outline | primary | normal | — | `#005BF5` | `#005BF5` |
| outline | primary | hover | — | `#2D7EF7` | `#2D7EF7` |
| outline | primary | active | — | `#0044CB` | `#0044CB` |
| outline | primary | disabled | — | `#7AB8FF` | `#7AB8FF` |
| outline | secondary | normal | — | `#DDDDDD` | `#333333` |
| outline | secondary | hover | — | `#2D7EF7` | `#2D7EF7` |
| outline | secondary | active | — | `#0044CB` | `#0044CB` |
| outline | secondary | disabled | — | `#DDDDDD` | `#CCCCCC` |
| outline | danger | normal | — | `#D40000` | `#D40000` |
| outline | danger | hover | — | `#E55D53` | `#E55D53` |
| outline | danger | active | — | `#B20006` | `#B20006` |
| outline | danger | disabled | — | `#EE8D82` | `#EE8D82` |
| text | primary | normal | — | — | `#005BF5` |
| text | primary | hover | `#E6F3FF` | — | `#005BF5` |
| text | primary | active | `#B8DBFD` | — | `#005BF5` |
| text | primary | disabled | — | — | `#7AB8FF` |
| text | secondary | normal | — | — | `#333333` |
| text | secondary | hover | `#F2F3F5` | — | `#333333` |
| text | secondary | active | `#E7E7E7` | — | `#333333` |
| text | secondary | disabled | — | — | `#CCCCCC` |
| text | danger | normal | — | — | `#D40000` |
| text | danger | hover | `#FFECE8` | — | `#D40000` |
| text | danger | active | `#F6BCB3` | — | `#D40000` |
| text | danger | disabled | — | — | `#EE8D82` |

Note the asymmetries, which are intentional and must be preserved:
- **Outline secondary** changes hue on hover (neutral `#DDDDDD`/`#333333` → primary `#2D7EF7`), unlike outline primary/danger which only shift lightness.
- **Emphasize disabled** keeps white text on a pale fill rather than greying the label.
- Secondary (pale) and text variants keep a **constant** text color across normal/hover/active; only the fill changes.

**[Project]** One primary command per region; supporting actions use secondary or outline; row utilities use text; destructive actions use danger plus a scope-aware confirmation that names the target. Labels are verb + object, not a generic “确定”. A loading state is specified (按钮加载状态) and must block duplicate submission.

**[Project] Non-emphasized button surface.** The measured matrix above has **no** filled-gray secondary variant: the quiet, non-highlighted button is `outline secondary` — the white business surface `Fill-7 #FFFFFF`, a 1px `Border-3 #DDDDDD` border, body text `#333333`, with hover/active shifting border and text to the primary hue. A non-highlighted button therefore defaults to a **white** background, not to Arco's default `secondary` gray fill (`Fill-2 #F2F3F5`), which is not a button surface in this system. Implement it as the shared `app-btn-neutral` class so the white fill holds on any canvas (transparent fill would inherit whatever sits behind the button); the reset actions on the task-center and project-management list pages use it. Existing buttons still rendering Arco's gray `secondary` fill (card copy actions, dialog cancel, member-toolbar reset) are recorded drift, to be migrated when those pages are next touched.

### Navigation 导航

**Purpose [Stated].** A menu list providing navigation to pages and features. **Top navigation** carries global categories and functions; **side navigation** provides the multi-level structure that organizes the site architecture.

**Top navigation [Stated].** Placed at the page top; left to right: logo, navigation items, auxiliary menu (user, settings, notifications).

**Side navigation component geometry [Derived from the older Figma component page]:** the following variants describe the **menu component itself**, not the page-shell sidebar. For the updated top-side-content page shell, the sidebar is **205px wide with 0px margin** as specified under Spacing & Layout. Fit or adapt the menu within that shell; do not silently enlarge the shell to the 240px component sample. The 64px collapsed variant remains source evidence but does not establish a collapsed shell width or breakpoint for the updated layout.

| Property | Value |
|---|---|
| Expanded width | **240px** |
| Collapsed width | **64px** |
| Menu item height | **48px** |
| Header/brand row height | **56px** |
| Item gap | 12px |
| L1 item padding-left | **20px** |
| L2 item padding-left | **52px** |
| L3 item padding-left | **84px** |
| Collapsed item padding-left | 22px |

Indentation steps by **32px** per level (20 → 52 → 84).

**Measured item states:**

| State | Fill |
|---|---|
| normal 默认 | `#FFFFFF` |
| hover 悬浮 | `#F7F8FA` |
| click 点击 | `#F2F3F5` |
| select 选中 | `#E6F3FF` |

**Menu typography [Derived].** L1 item 16px — weight 500 when active, 400 when not. L2/L3 items 14px, same weight rule. System name in the brand row: 17px/700.

**Disabled menu items [Derived].** Every menu component set — `item/Menu/1st`, `/2rd`, `/base`, and all three `item/collapsedMenu/*` sets — carries a `disable 禁用` on/off axis. A disabled menu item is therefore a specified state, not an improvisation. Per the standing rule, convey it by more than the greyed fill: set `aria-disabled`, keep it non-focusable as a link, and where the reason is not evident, state it. **A disabled menu item is not a permission boundary** — the server authorizes, and a hidden or disabled item never substitutes for that.

**Collapsed navigation structure [Derived].** The source's collapsed menu is a separate 64px **component variant**, not merely the 240px sample narrowed in place. Its three component sets (`item/collapsedMenu/base`, `/1st`, `/2rd`) have an `expanded 展开` axis and `items 数量` of 1–8. Collapsed parent items open a flyout rather than expanding in place. The `1st` and `2rd` sets carry the same `normal / hover / click / select` states plus `disable` as their expanded counterparts. Using that component in the updated 205px shell requires an explicit collapse and integration decision.

**Component types [Stated].** Side navigation ships as: 基础菜单 (base), 常规单层/双层/三层导航 (regular 1/2/3-level), 分组单层/双层/三层导航 (grouped 1/2/3-level), 折叠导航 (collapsed). **Collapse is supported only for regular navigation with icons** (仅支持带图标常规导航折叠). Menu item roles are named `1st group menu item`, `1st menu item`, `2rd menu item`, `base menu item`.

Top navigation states cover 一级菜单 normal/hover/select, 顶部导航二级菜单 normal/hover/select, and 顶部导航右侧菜单 normal/hover plus a two-level variant.

**[Project]** Route metadata, active menu, title, and permissions derive from one source. Group by task/domain; review grouping and search after seven modules; generally limit to two levels and give an occasional third level an unambiguous breadcrumb. Direct URLs, reload, favourites, back/forward, tenant changes, and unsaved drafts have defined outcomes. A hidden menu is never an authorization boundary.

### Breadcrumb 面包屑

**Purpose [Stated].** Shows the current page's position in the system hierarchy and allows navigating back up. Use when the system has **more than two levels**, when the user must be told "where am I", or when upward navigation is needed.

**Variants:** `item 数量` = 2–7 · `state 状态` = normal 默认 / hover 悬浮 / current 当前.

**[Derived]** Ancestor items are 14px/400; the current item is 14px/600 and is not a link. Hover applies to ancestor items only.

**[Project] Detail sub-page breadcrumb colors (2026-11-10 user decision).** On 基础数据库 detail child routes (证书 / 法规 / 零部件), the breadcrumb carries an explicit color contract that overrides Arco's default link blue: the **leading `<` back control** is `Text-3` (`--color-text-3`) by default and switches to the **primary `Theme-6 #0DB9C6`** on hover, with the button's `Fill-2` hover background; the **upper-level module label** is `Text-3` gray by default and turns **primary `#0DB9C6`** on hover; the **current (second-level) page name** is `Text-1` (`--color-text-1`, black) / 600 and is never a link. Ancestor typography stays 14px/400 and current stays 14px/600 per the derived rule above. The status Tag belongs to the **基础信息 / 基本信息 section title** (flex `.block-title`, title + tag), **not** to this header bar — a Tag next to the breadcrumb in the top bar is a defect. Implemented with scoped `.detail-back` / `.detail-breadcrumb .arco-link` / `.detail-current` (证书/法规), `.detail-toolbar` overrides (零部件详情, which must also beat the global `.parts-detail-page a` primary-color rule), and `.relations-toolbar` overrides (零部件 关联信息 / 项目详情, which must beat its own global `a` primary-color rule). Applies to **all** 基础数据库 detail child routes including nested ones; a blue/primary-colored ancestor link or a non-black current page name on any of them is a defect. Verification is a headless `getComputedStyle` assertion on each route.

### 详情子页面顶部操作栏 [Project, 2026-11-13 用户确认]

后续详情子页面统一采用独立白色操作栏。左侧按「〈 上一层级目录 / 当前页名称」排列，右侧放本页实际操作。任务执行页对应「〈 任务管理 / 任务详情」。操作栏内边距 16px，与相邻内容区块保持 12px 间距。

返回箭头使用 Arco 线性左箭头。箭头、上一层级目录及分隔符默认 Text-3，上级目录文字为 14px / 400。悬停箭头或上级目录时，可返回部分高亮为当前项目主色，焦点状态可见。箭头与目录可以组成同一个链接，两处点击均返回明确的父级路由，使用 Vue Router，不依赖浏览器历史记录。已有未保存修改时先走共享 ConfirmDialog 离开确认。

当前页名称使用 Text-1、14px / 600，无链接和悬停高亮。分隔符使用「/」，不响应点击。右侧操作使用既有按钮规范，窄屏时允许操作组换行且保留合理的键盘顺序。状态标识放在业务内容区对应标题或字段中。

### Tabs 标签页 [Project, 2026-11-12 user decision]

No Figma-measured tab variant is recorded, so this is a project decision under the Unspecified component fallback. Arco supplies the mechanics (ink bar, keyboard path, disabled handling); this section owns the visible hover and selection contract.

**States, in precedence order.**

| State | Text colour | Weight | Background |
|---|---|---|---|
| normal 默认 | `Text-2` (`--color-text-2`) | 400 | the variant's normal fill; transparent for line / card / rounded / capsule |
| hover 悬浮 (inactive) | `--primary-5` — light `#3EC9D1`, dark `#0DB9C6` | 400 | **unchanged from normal; no hover patch on the text block or the tab cell** |
| active 选中 | `--primary-6` — light `#0DB9C6`, dark `#2BD0DC` | 500 | unchanged from normal; the 2px ink bar remains |
| disabled 禁用 | Arco `Text-4` | 400 | Arco default; never takes the hover highlight |

Hovering an already-active tab is a no-op — the active row wins. Hover adds no underline, border, shadow, transform or weight change; only the text colour moves. The hover colour is one step lighter than the active colour, so the hierarchy reads **active > hover > normal** without a background block. A background tile behind the label, a hover that keeps `Text-2`, or an active label that turns back to `Text-2` on hover are all defects.

**Implementation contract [Project].** One rule set in `src/styles/global.css`, prefixed with `body` so it outranks Arco's lazily loaded stylesheet, its `body[arco-theme='dark']` overrides and page scoped styles. The hover rule is scoped with `:not(.arco-tabs-tab-active):not(.arco-tabs-tab-disabled)`; the line-type `.arco-tabs-tab-title::before`, the text-type title and the card / card-gutter / rounded / capsule cell fills are reset to their normal values (card-gutter keeps `--color-fill-1`); the active declaration is written last. Pages may still set the surrounding white surface or hide `arco-tabs-content` (模板配置, 车型详情, 导入导出抽屉), but must not restate tab hover, colour or weight. Applies to every `a-tabs` in the product: 模板配置, 车型详情 (基本信息 / 配置项), 测试记录详情 (逐项填写 / 批量填写) and 导入导出抽屉 (导入数据 / 导出数据).

**Verification [Project].** Headless `getComputedStyle` assertions on normal, hover-inactive, hover-active and post-switch states in `zh-CN` / `en-US` and light / dark: hover leaves the tab cell and `.arco-tabs-tab-title::before` at their normal backgrounds, changes only `color` and keeps `font-weight: 400`; an active tab keeps `--primary-6` / 500 while hovered. No screenshots.

### Pagination 分页

**Purpose [Stated].** Splits a long list into pages, loading one page at a time. Use when loading all data would take too long.

**Pagination variants:** `totalcontent 总条数` · `pagesize 一页条数` · `jumper 跳转` · `numberbtn 数字按钮` — each on/off. **Child button variants:** `item/page arrow btn` has `type 类型` = left 左 / right 右 for the **previous/next arrow direction**, not overall pagination alignment. Number and arrow buttons carry their applicable normal / hover / click / select states.

**Composed parts [Derived]**, in source order: 共 101 项数据 (total count) · 10 条/页 (page-size select) · page number buttons · 跳至 [ 11 ] /20 页 (jumper). Body text 14px/400/22.

**[Project] Control surface.** The pager's controls share the white business surface: `Fill-7 #FFFFFF` fill, 1px `Border-3 #DDDDDD` border, 2px radius, 32px height. This covers the page-size select (132px wide), the jumper input (72px wide), and the enabled page-number and arrow buttons; hover keeps the white surface, focus switches the border to primary. The selected page number uses the primary fill with white text, and a disabled arrow keeps the `#DDDDDD` border but switches to the neutral disabled surface `Fill-2 #F2F3F5` with a `not-allowed` cursor. Arco's default gray select fill (`Fill-2`) must be overridden in the footer — an enabled pager control never renders gray. These surfaces are implemented once as the shared `app-pagination` block (with `app-page-size` / `app-page-jump` on the two inputs) so both list pages cannot drift apart.

**[Project] Pagination implementation contract.** The default business-list footer uses the complete source order above: total count, page-size select, previous arrow, visible page-number buttons, next arrow, then the jumper label, input, and total-pages suffix. Each interactive control is 32px high with a 2px radius; the selected page uses the primary fill and white text, while disabled arrows use the neutral disabled surface. Page-size changes reset to page one. The visible page-number window may be limited to five buttons for compact desktop layouts, but it must preserve the current page and provide previous/next controls. Every label, aria name, and suffix is localized through the active `zh-CN` or `en-US` locale.

**[Project]** A query change normally resets to page one; if the total invalidates the current page, choose a valid page and explain. Prefer server pagination except for a demonstrably small complete local set.

**[Project] List footer contract.** In a business data list, align the footer to the right and compose it in this order: total count, page-size selector, previous/next and page-number controls, then the jumper. Use the same 32px control height and 2px radius as other medium controls, keep 16px between the total and pagination group, and do not add a separate container border. The total count must remain visible even when the component's built-in total slot is replaced for localization. Page-size, number, arrow, hover, selected, disabled, focus, and jumper labels must update with the active locale.

### Input 输入框

**Purpose [Stated].** A text field that carries user information entry; used in forms, dialogs, and similar contexts.

**Measured geometry:** height **32px**, radius **2px**, padding 8px left/right, internal gap 8px, border `1px #DDDDDD`, fill `#FFFFFF`, text 14px/400/22.

**Measured states:**

| State | Border | Fill |
|---|---|---|
| normal 默认 | `#DDDDDD` | `#FFFFFF` |
| hover 悬浮 | `#DDDDDD` | `#FFFFFF` |
| focus 聚焦 | **`Theme-6`（2026-11-05 终版 `#0DB9C6`）** | `#FFFFFF` |
| disabled 禁用 | `#DDDDDD` | **`#F2F3F5`** |

The Figma placeholder (暗提示) uses `Text-3 #999999`; entered content uses the body color. For a released input, meaningful placeholder copy follows the contrast resolution under Accessibility rather than treating this measured source value as an exemption.

**Types [Stated]:** 基本文本框 (basic), 多行文本框 (textarea), 前后缀输入框 (with prefix/suffix, e.g. `http://` … `.com`), 密码输入框 (password).

**Variant axes:** `prefixIcon 前置图标` · `prepend 前置标签` · `append 后置标签` · `clearable 清空` · `maxcharacter 限制字符` · `tips 提示` · `error 出错` · `browse 浏览` · `disable 禁用` — each off/on · `state 状态` = normal / hover / focus / filled 填充.

**Specified states [Stated, normalized labels]:** normal 默认 · hover 悬浮 · filled 填充 · focus 聚焦 · disable 禁用 · filled-disable 已填写禁用 · clearable 清空 · tips 提示 · error 出错. The Figma variant's `naomal` / `narmal` spelling is a source defect, not a state to reproduce.

**Auxiliary text [Derived].** Helper and counter text is 12px/400/20 and sits below the field. The source notes the field **wraps rather than truncates** when the helper text is long (“文字过多时输入框宽度折行”). The character counter renders as `5/150`.

**[Project] Fill is enforced globally.** The white fill above is not left to each page: `src/styles/global.css` sets `background: var(--app-surface)` and the `#DDDDDD` control border on every editable control (`.arco-input-wrapper`, `.arco-textarea-wrapper`, `.arco-input-number`, `.arco-select-view`, `.arco-input-tag`, `.arco-picker`) in normal, hover, and focus states, with focus border `--app-accent` (Theme-6, teal `#0DB9C6` since 2026-11-05). Disabled controls keep Arco's `#F2F3F5` fill. A business page that shows a grey editable input is a defect against this rule, not a variant.

**[Project] Editable vs disabled surface — 2026-10-26 user decision.** This rule is unconditional and restated here because it was violated repeatedly: **every editable control renders on the white business surface, and only a disabled control may render grey.** It is not scoped to list filters and it does not depend on a page-level class — the earlier implementation only covered `.app-filter-control`, so a plain form `a-select` trigger kept Arco's default `Fill-2` grey beside a white input in the same row, which is exactly the grey-select defect this note closes. Consequences for implementation: (1) the global defaults live in `global.css` for all six wrappers and apply inside forms, tables, drawers, dialogs, and overlays alike; (2) a page must not add a white-fill patch for a single control, and must not paint an editable control grey; (3) the disabled state (`#F2F3F5` fill, `#DDDDDD` border, Arco's disabled text) is the only sanctioned grey, and the white rule must never win over it; (4) verification reads the computed `background-color` of the control in normal, hover, focus, and disabled states — a passing typecheck or build proves nothing here.

### Form field layout [Project, 2026-11-01 user decision; colon rule 2026-11-06]

Applies to every configuration/edit form, not only the rule-management screens: **label above the control, control fixed at 500px, required asterisk to the left of the label** (`*` in `--app-color-danger`, 4px gap). Field rows stack vertically with a 16px gap; the label is 14px/400/22 in Text-2, the control keeps the 32px Input/Select geometry above. Options, helper text, and inline validation text sit under the control and stay inside the 500px column, so a long placeholder never widens the field. Read-only versions of the same form convert to a summary list — `字段名：值` on one baseline, label in Text-3, value in Text-1, no asterisk, no disabled input boxes.

### 详情子页面填写与清空交互 [Project, 2026-11-13 用户确认]

适用于任务执行详情及后续新增的可填写详情子页面，优先于上方通用表单的 500px / 字段纵向排列规则。抽屉、普通弹窗及列表筛选沿用各自规范。

- **字段布局。** 每个字段采用标签在上、控件在下的完整单元，多个字段单元在区块内横向排列。输入框、选择器、日期等控件固定宽度 **400px**，字段单元间距 16px。空间不足时整个字段单元换行，窄屏下以 `max-width: 100%` 收缩，标签和控件保持对应关系，禁止页面整体横向溢出。任务类型行采用类型选项、计划结束日期、模板横向排布，窄屏下按相同原则换行。
- **字段名称。** 所有填写字段和只读字段名称右侧显示冒号，中文使用「：」、英文使用「:」，通过共享字段标签和全局标点规则生成。必填星号位于标签左侧。标题、操作按钮、表头及任务类型的勾选选项名称不追加冒号。
- **清空操作。** 可编辑输入框、选择器和日期控件有值时均支持【×】清空，使用 Arco `allow-clear`。无值、禁用或只读状态不提供可操作的清空入口。清空后恢复占位文案并更新绑定状态，不自动恢复旧值，清空必填项后在提交校验中提示。清空操作支持键盘路径和可访问名称，不能触发提交或跳转。
- **级联字段。** 品牌初始为空。选择品牌后启用车系，选择车系后启用车型。变更或清空品牌同时清空车系和车型，变更或清空车系同时清空车型，并立即更新下级禁用状态。下级只能选择当前上级对应的有效选项。
- **任务类型联动。** 未勾选类型时，该行日期与模板禁用。勾选后两项启用且必填，清空其中任一项均不得通过提交校验。草稿允许保留未完成内容。
- **验收。** 在桌面和窄屏、中文和英文下检查控件实际宽度、横向排布与换行、字段冒号、已选值清空、级联重置、禁用态及必填错误。构建通过不代替实际路由验证。

**Field label colon [Project, 2026-11-06 user decision — global].** Every field name ends with a colon on its right, in **all** field surfaces: add/edit drawers, add/edit dialogs, filter strips, filter popovers, sign-in form, and read-only detail rows. With a required marker the row reads `*姓名：` (asterisk left, colon immediately after the name); with a label-above layout the colon still terminates the label line. Scope is field names only — **not** panel/drawer/dialog titles, table column headers, button text, pagination text ("跳至"), checkbox/radio option names, or the option rows inside 列设置 / 筛选条件设置 popovers. A colon on one of those is a defect.

Implementation contract (one place, no per-page copies): `:root` defines `--app-field-colon: '：'` and `html[lang^='en']` overrides it to `':'`; `src/styles/global.css` renders it once through `.app-field-label::after` and `.app-detail-label::after`. Field labels carry the shared `.app-field-label` class (filter labels keep their page class alongside it); read-only rows use the existing `.app-detail-label`. An `a-form-item` label uses its `#label` slot with a `.app-field-label` span so the colon sits flush against the name. Do **not** add a colon to any i18n value or template string, and do **not** enable Arco's `colon` prop — it always writes a half-width `:` preceded by a space and cannot follow the locale. Labels are plain inline text flow: a flex label with `gap` turns the `::after` pseudo-element into a separate flex item and leaves a visible gap before the colon; use `display: block` plus a margin on the asterisk instead. Verify by reading the computed `::after` content and the label's rendered text in `zh-CN` and `en-US`, in an open add drawer, an edit dialog, a filter strip, and a detail drawer.

**Mandatory-part headers [Project].** When a page carries several parts that must *all* be completed before submission, the parts stay as tabs (one part per tab, never stacked into one pane) and each tab title states its own obligation: asterisk + part name + `已配置 x/总` progress chip + the count of unresolved issues. No separate progress strip is rendered above the tabs (2026-11-01 user decision: the strip was removed; each tab title already carries the progress chip, and an item-navigation column anchors the first tab).

**Deferred validation copy [Project].** Field- and row-level validation text appears only after the user attempts a save or publish (`publishChecked` / `submitted`), never on first paint — an untouched form must not render a wall of red.

### Select 选择器

**Purpose [Stated].** Selects one or more values from a set of options; used in forms and data filtering.

**Anatomy [Stated]:** 文本标签字段 (label) · 星号 (required asterisk, **to the left of the label**) · 选择器 (trigger) · 下拉面板 (panel — a container for all options whose height may be controlled by option count).

**Scrolling rule [Stated].** When options overflow and must scroll, **show 50% of the last visible menu item's height** so the scrollability is visible.

**Measured geometry.** Trigger: height 32px, radius 2px, padding 8px, gap 8px — identical to Input, with the same `#DDDDDD` → Theme-6 focus border (teal `#0DB9C6` since 2026-11-05) and `#F2F3F5` disabled fill. The `item/selectOption` and `item/multiOption` outer boxes measure **32px without a divider** and **39px with the divider**. Their 22px text line is not the menu item's outer height; do not compress the clickable row to 24px. Keep the variant's spacing and divider treatment when implementing the menu.

**Measured menu item states:**

| State | Fill |
|---|---|
| normal 默认 | transparent |
| hover 悬停 | `#F2F3F5` |
| click 点击 | `#E7E7E7` |
| select 选中 | **`#E6F3FF`** |
| disabled | `#EEEEEE` with `#DDDDDD` border |

**Variants:** 单选选择器 (single), 多选选择器 (multiple), 分割线分组选择器 (grouped with divider) · axes `多选` · `分割线` · `前置图标` · `展开` · `填充` · `禁用` — off/on · `数量` = 1–6 · `状态` = normal 默认 / hover 悬停 / 聚焦 / 点击 / 选中.

Trigger states are specified both empty and filled: Normal · Hover · Focus · Select · Disabled, plus filed/Normal · filed/Hover · filed/Focus.

### Filter control surface rule [Project]

Filter inputs and Select triggers in list query areas use the white business surface `Fill-7 #FFFFFF` through the semantic token `--app-surface`. They must not inherit `Fill-2`, `Fill-3`, or another gray fill in normal, hover, focus, or filled states. The disabled state is the exception and uses the specified neutral disabled fill `Fill-2 #F2F3F5`. New filter controls must carry the shared `app-filter-control` class so the Arco wrapper and its internal Select trigger receive the same surface rule; page-local raw HEX overrides are not allowed. A page canvas may remain `Fill-1 #F7F8FA`, and a table header may remain `Fill-2 #F2F3F5`; neither changes the filter-control requirement.

**[Project] Filter Select "全部" placeholder color — 2026-11-09 user decision.** When a filter Select shows its "全部" placeholder (no value selected), the placeholder text renders in the body text color (`--color-text-1`), not Arco's default Text-3 gray. The rule lives once in `global.css` on `.app-filter-control .arco-select-view-input::placeholder` so every list page and drawer filter follows it; the former Task-Center-drawer local override was removed in favor of this shared rule. Input placeholders (请输入…) keep Arco's gray hint color — the black rule applies to the "全部" Select placeholder only.

**[Project] Filter geometry.** In desktop list query areas, each filter input or Select trigger is `200px` wide and `32px` high. The control may shrink to the available grid track without exceeding the 200px target; at the narrow breakpoint it may become fluid (`width: 100%`). Keep the label visible and preserve the white surface rule above. **The date-range picker follows the same 200px width** (2026-10-29 user decision: the earlier 260px range-picker deviation is retired globally — all `filter-field--range` variants use the 200px unit like every other filter control). **No exceptions: long-option Selects (e.g. rule-management 标准库/问题库/安全需求) also stay at 200px** (2026-10-29 second user decision — an earlier same-day adaptive-width exception up to 640px was implemented and then withdrawn; long option values are handled by the dropdown panel, not by widening the trigger). **The dropdown panel itself adapts** (2026-10-29 third decision, clarifying the second): the popup does not shrink to the 200px trigger width — it grows to show the longest option on one line with no ellipsis (Arco `trigger-props` `autoFitPopupWidth: false` + `autoFitPopupMinWidth: true` + the shared `rule-source-dropdown` content class in `global.css`, 200px floor, `min(720px, 100vw - 48px)` ceiling). Those three source Selects are also `allow-search` so a keyword filters the options. **Under the 2026-11-09 restacking decision the field-name label sits above this 200px control with a 4px gap (Filter strip packing); the control geometry itself is unchanged.**

**[Project] Filter strip packing ("栅栏") — 2026-11-09 user restacking decision (supersedes the 2026-10-25 horizontal-grid rule).** In a list query area each filter renders as one **vertical label-above-control unit**: a `12px`/`20px` left-aligned field-name label (`.app-field-label`, colon from `--app-field-colon`) on the first row, then the `200px` × `32px` control on the second row, with a **`4px` gap** between them. The unit is a single `200px` grid track with `justify-items: start`, so the label and control share the same left edge and the unit hugs its content with no blank gap to the left of the label. Units and the trailing action group wrap on a **uniform 16px row and column gap**; everything is **left-aligned**, with no `margin-left: auto`, no equal-width stretched tracks, and no ragged blanks. The query (查询, primary), reset (重置, neutral outline) and filter-settings (32px icon-only `IconFilter`) buttons follow **immediately after the last filter unit with the same 16px gap** (wrapping to the next row only when the row is full). 查询 and 重置 both keep their leading icons; if one carries an icon, the other must too. At the narrow breakpoint each unit takes a full row and its control becomes fluid (`width: 100%`). **Retired on 2026-11-09:** the inline `max-content` label + 8px gap + `200px` control grid, right-aligned labels, and the clause "stacking a label above its control is a defect" — those now describe a defect. This is a global rule: **every list page with a query area adopts it**, not only newly built screens; older horizontal filter strips are migration debt until reworked.

**[Project] Filter label colon — 2026-11-06 user decision.** A filter label is a field name, so it carries the same global trailing colon as an add/edit form (`操作时间：`), rendered by `.app-field-label` from `--app-field-colon` — see Form field layout. The colon belongs to the field-name label above the control, never to the control placeholder; it does not change the 4px label-control gap or the 200px control width. The 2026-11-09 restacking retires the earlier references to an 8px inner gap and a `max-content` label column. Labels in a filter popover follow the same rule; checkbox option rows in the settings popovers do not. A filter label is `12px`/`400`/`20px`, left-aligned, and never right-aligned against the control.

**[Project] Jump-in filter params — 跨页带参筛选（2026-10-27 user decision）.** When a page is opened with filter parameters in the URL (e.g. `?clause=`, `?keyword=`, `?template=` from another page's link), the parameter must be written **directly into the matching filter control** (both the draft value and the applied value) and the query must run immediately — the control visibly carries the condition, and the result list, count, and pagination reflect it like any manually applied filter. The page **must not** render a separate "applied condition + clear" chip/label row (e.g. 「关联条款 6.1.1 的材料 ＋ 清除条款筛选」) for jump-in params: such detached condition rows are removed wherever they exist. If the target field has no visible filter control, add or reveal one in the filter strip instead of showing a detached label. Once consumed, the parameter is dropped from the URL and the filter lives entirely in the control: clearing the control (or pressing 重置) is the only clear affordance, and the filter persists across in-page tab switches like the other controls. First applied on 数据材料–材料清单 (`?clause=` lands in the 关联条款 select); 问卷工作台 (`?keyword=` / `?template=`) and 判定规则 (`?clause=` into the keyword control) already follow the same pattern, and no list page may reintroduce the chip-row variant.

### List settings popover — 筛选条件设置 / 列设置 [Project]

Two toolbar controls share one popover component and one interaction contract: **筛选条件设置** decides which query fields appear in the filter strip and in what order; **列设置** decides which table columns appear and in what order. Both are anchored to an icon-only 32×32 trigger, open on click, and dismiss on outside click or Escape.

**Anatomy, top to bottom.**

| Part | Rule |
| --- | --- |
| Header | None. No title row and no close button — the trigger's Tooltip carries the name, and outside-click / Escape is the only dismissal affordance. |
| Row list | Checkbox + label + drag handle (`IconDragDotVertical`, Text-4, 16px). Row min-height 36px, radius 4px, hover `Fill-2`. List scrolls at `max-height: 360px`. |
| Reorder preview | While dragging, fade the source row and tint the valid destination row with the semantic primary-light fill (`--color-primary-light-1`). Draw a 3px primary insertion line (`--app-accent`) across that row's top or bottom edge, without changing row height or pushing the list. The line shows the actual insertion boundary, not merely a hovered item. **Promoted 2026-11-01 to the project-wide row drag standard — see Row drag-and-drop reorder; that entry is authoritative where the two texts differ.** |
| Footer | A hairline `--app-divider` rule spanning the **full popover width**, then **恢复默认** as the only action: left-aligned, 12px, full-row hit area, hover tint `Fill-2`. The divider must be drawn by the footer container, not by the button's own border — an inline-flex button only paints a line as wide as its text. |

**Behavior.**

- **Live apply.** Every checkbox change, drag, or restore writes through to page state immediately. There is no draft layer, so there is no 确定 / 取消 pair; closing the popover never reverts a change.
- **Drag-only reordering in the UI.** No ↑ / ↓ buttons appear in either popover. Rows stay `draggable` with the drag handle visible, and each row exposes the keyboard equivalent `Alt+ArrowUp` / `Alt+ArrowDown` (`aria-keyshortcuts`) so ordering remains reachable without a pointer.
- **Placement preview and commit (2026-10-27 user update).** Crossing a destination row's midpoint changes the line from **before** to **after** that row; hovering below the final row's midpoint shows a bottom insertion line and allows appending. The preview updates throughout pointer movement and disappears on drag end, leave, cancellation, popover close, or completed drop. Drop commits exactly the indicated position and applies immediately. Never show a valid drop marker for an unchanged position or a move that would shift a locked row; locked rows remain fixed, including when another item crosses them.
- **恢复默认** resets both order and visibility in one step and takes effect immediately.

**Scope.**

- The 操作 column is a fixed table column. It never appears in 列设置 and cannot be hidden or reordered; it always renders as the last column.
- A module's identifying **column** row (e.g. 序号 or 操作时间) is locked visible (`disabled`) when that module requires it; fixed action columns stay outside the list. A module may also lock an essential filter (e.g. the primary keyword search). Other filters remain hideable. Locked rows are neither draggable nor valid crossing points for another row.
- **Lock the first filter condition.** In 筛选条件设置 the **first** field in strip order is locked (`disabled`) so it can never be unchecked or dragged; it stays as a permanent anchor of the filter set. The same lock applies to any essential field a module must keep visible.
- **At least one condition retained.** 筛选条件设置 and 列设置 both forbid clearing the last visible row: `setVisible` in `src/shared/components/ColumnSettingsPopover.vue` intercepts an uncheck that would leave zero visible items, so the filter strip or table never becomes empty. This guard is shared by both popovers, not re-implemented per page.

**Migration status.** 任务管理, 任务中心, 用户管理, and 角色管理 all implement this pattern in full; no list page may reintroduce the legacy filter-settings modal (title, close button, ↑/↓ buttons, 取消/确定).

### Row drag-and-drop reorder — 行拖拽排序 [Project, 2026-11-01 user decision]

The drag-reorder interaction defined by the 列设置 popover (Reorder preview and Placement preview above) is the **project-wide interaction language** for pointer-driven row reordering — it applies beyond popovers wherever rows are reordered by drag, including editor-embedded lists such as the section form editor's field blocks and option rows. One visual grammar, three mandatory parts:

| State | Rule |
| --- | --- |
| Dragging source | Fade the whole source row to `opacity: .55` and switch the cursor to `grabbing` (the drag handle itself shows `grab`). The row keeps its position, height, and content while dragging — nothing is removed from the list, and the row must stay identifiable as the one being moved. |
| Placement preview | Tint the valid destination row with `--color-primary-light-1` and draw a **3px primary insertion line** (`--app-accent`, `border-radius: 2px`, `pointer-events: none`) across that row's approached edge. Pointer above the destination row's vertical midpoint means **before**, below means **after**; when the source moves down, the commit index is `insertion − 1`. The line marks the actual insertion boundary — it must never appear for a position that would leave the order unchanged, and it disappears on drag end, leave, cancel, or completed drop. |
| Drag image | The drag snapshot must be **the whole row**, not the handle: on drag start call `dataTransfer.setDragImage(rowElement, cursorOffsetX, cursorOffsetY)`. When `draggable` sits on a 20×28 handle, the browser's default snapshot is that handle only — a small dot beside the pointer from which the user cannot tell which row is being dragged. This is the failure mode the rule exists to prevent. |

**Behavior and scope.**

- Insertion preview and commit share one computation; a drop commits exactly the indicated position and applies immediately (live write, no draft layer).
- Locked or non-reorderable rows (e.g. master-data placeholder fields) never become insertion points that would shift a locked row, matching the 列设置 locked-row rule.
- Radius of the tinted destination row follows its own surface: 4px inside popovers, 2px on business-surface lists. Colors and line geometry come only from the tokens above — no new hues, no per-page variants.
- Keyboard equivalence (`Alt+ArrowUp` / `ArrowDown`) is mandatory where the 列设置 pattern applies (see that entry); editor row lists may instead rely on drag plus their visible ↑ / ↓ buttons.
- Reference implementations: `src/shared/components/ColumnSettingsPopover.vue` (popovers) and `src/modules/sections/pages/SectionFormEditPage.vue` (editor field/option rows, 2026-11-01). Any row list that reorders by drag must match this grammar; introducing per-page drag visuals that drift from it is the regression to avoid.

### Icon-only toolbar controls [Project]

Toolbar controls that carry no visible text render as a 32×32 icon button (icon 16px, Text-3) and must keep both an accessible name (`aria-label` in the active locale) and a hover Tooltip whose content is the button name — the Tooltip supplements the name, it never replaces the accessible one. Removing the text label is allowed only when the icon is unambiguous within the toolbar context; if a hover bubble would be the only way to learn what the control does, keep the text label instead. Nested trigger components on the same element (Tooltip over a Popover trigger) are permitted as long as hover and click map to different layers.

**[Project] Trigger fill — 2026-10-26 user decision (supersedes the 2026-10-25 grey fill).** Icon-only toolbar triggers (筛选条件设置 and 列设置) use the **non-emphasized button surface**: `Fill-7 #FFFFFF` fill, 1px `Border-3 #DDDDDD` border, body-color 16px icon, so the two icon triggers read as the same control family as the 查询 / 重置 / 导出 buttons that sit beside them in the same toolbar or filter strip. Hover and press keep the white fill and shift border + icon to the primary hue, focus adds the standard primary focus ring, and the disabled state uses the outline-secondary disabled pair (`#DDDDDD` border, `#CCCCCC` icon). The shared implementation is the `app-btn-neutral` class in `src/styles/global.css` combined with a page-level 32×32 icon-only sizing class; the former `#DDDDDD` trigger fill (`app-icon-trigger`) is retired, and painting these two triggers grey again is the drift. Recorded history: first applied grey on 功能台账 (2026-10-25), converted to white on 标准条款 (2026-10-26); 功能台账, 审计管理, 问卷工作台, and 问卷模板 already render the white variant, so every list page now matches this rule.

### Radio 单选框

**Purpose [Stated].** The user may select exactly one option from a group of related, mutually exclusive data. Unlike a Select, **all options are visible by default** so the user can compare — therefore keep the option count small.

**Types [Stated]:** 基础单选框 (basic) and 按钮单选框 (button-style).

**Button-radio sizes [Stated].** Three sizes, heights **40 / 32 / 24**, width hugs the text, **radius 2px**.

**States [Stated]:** 未选中 (unselected) · 已选中 (selected) · 悬停项 (hover) · 不可选 (disabled) · 选中不可点 (selected + disabled).

**Variants:** `size 尺寸` = large/medium/small · `checked 已选` · `disable 禁用` — true/false · `state 状态` = normal 默认 / hover 悬停 / select 选中 · `item 数量` = 2–8 · `position位置` = left左 / mid中 / right右 (position within a button group).

**[Derived]** Basic-radio control size is 16px against 14px/400/22 label text; the button-radio group shares the Button size ladder but keeps radius 2px.

> **Incomplete in source.** The size sentence ends mid-clause: 「宽度根据文本内容自适应（基于」 — the parenthetical naming what the width is based on was never finished. The three heights (40/32/24) and the hug-width behavior are unambiguous; the unstated basis is presumed to be the Button padding ladder, which the measurements match. Confirm with design if a button-radio group ever renders at a width the Button spec does not predict.

### Checkbox 多选框

**Purpose [Stated].** The user may select one or more items from a group. Typical uses: filtering or batch operations over page/menu data, and terms-and-conditions acceptance.

**States [Stated]:** 多选未选 (unchecked) · 多选已选 (checked) · 部分选中 (indeterminate) · 多选悬停 (hover) · 未选不可点 · 已选不可点 · 半选不可点 (each disabled form).

**Variants:** `checked 已选` · `disable 禁用` · `indeterminate 部分选择` — true/false · `state 状态` = normal默认 / hover悬停 · `布局` = 水平 (horizontal) / 垂直 (vertical) · `item数量` = 2–8.

**Measured layout [Derived].** Control **16px**, label **14px**, horizontal group gap **24px**, vertical group gap **12px**.

**[Project] Permission matrix (角色管理 · 操作权限).** The role form's permission table is a headerless `15% / 20% / 65%` grid (一级功能 / 二级功能 / 操作权限; the header row exists only for screen readers) carrying plain checkboxes:

- **Same-level leaf nodes merge into one cell** — second-level items with no third-level children share one cell, and likewise all third-level items under one second-level item; chips run horizontally and wrap when they overflow. A cell with nothing to show renders an em dash.
- **The first column (一级功能) carries a select-all checkbox** for the whole branch: checked when every second- and third-level node under the group is checked, **indeterminate** when only part is, and clearing it removes the entire branch. Its accessible name is the group name through the standard toggle aria-label.
- **Cascade:** checking a second-level item checks all of its thirds; checking any third checks its parent second automatically; clearing a third keeps its siblings.
- **No grey fills in the matrix.** All cells — including the first column — share the white card surface (`--app-surface`); rows are separated by the hairline divider only. A tinted first column is a defect.
- The readonly detail view keeps the same matrix with every checkbox disabled; state is computed from the stored `checkedIds`, never hard-coded.

### DatePicker 日期选择器

**Purpose [Stated].** Selects a specific date or a date range.

**Types [Stated]:** 基本类型 (basic — 日期选择 date / 月份选择 month / 年份选择 year) · 范围选择器 (range) · 日期时间选择 (datetime). Range selection is specified as "先选择开始日期时间" — the start is chosen first.

**Trigger states [Derived].** Identical to Input: height 32px, radius 2px, border `#DDDDDD`, focus Theme-6 (teal `#0DB9C6` since 2026-11-05), disabled fill `#F2F3F5`. Placeholders: 请选择日期 / 请选择月份 / 请选择年份.

**Variants:** `类型` = date 日期 / dateRange 日期区间 / datetimesRange 日期时间区间 / 年份 / 月份 / 日期时间 · `状态` = normal 默认 / hover 悬浮 / focus 聚焦 · `纬度` = 年 / 月 · plus per-cell axes `选中 active` · `选中开始` · `选中结束` · `范围` · `hightlight` · `此刻` · `预设范围` · `额外 additional` · `上一个` / `下一个` · `禁用`.

**[Derived]** The panel year header is 14px/600/22; month labels (一月…十二月) are 14px/400/22. A range renders a distinct start cell, end cell, and in-range highlight — three separate states that must all be implemented.

### TimePicker 时间选择器

**Purpose [Stated].** Selects a specific time or a time range.

**Types [Stated]:** 基本类型 (basic) and 范围选择 (range, with 开始时间 / 结束时间 fields).

**[Derived]** Trigger matches Input geometry with placeholder 请选择时间. The panel lists two-digit time units at 14px/400/**line-height 20**, with the selected unit at weight 500. The panel footer provides 当前时间 (now) and 确定 (confirm). Trigger states: Normal 默认 / Hover 悬停 / Focus 聚焦.

### Switch 开关

**Purpose [Stated].** A control for two mutually exclusive options — turning an option on or off.

**Measured sizes:**

| Size | Track height | Track radius | Inset |
|---|---|---|---|
| large 大 | **24px** | full (32) | 4px |
| medium 中 | **20px** | full (32) | 3px |
| small 小 | **16px** | full (32) | 2px |

**Variants:** `size 尺寸` = large/medium/small · `checked 开关` = true/false · `disabled` = true/false · `loading加载` = true/false · `label标签` = none / text 文字.

**States [Stated]:** 默认 (default) · 禁用 (disabled) · **加载中（不可点击）** — the loading state is explicitly non-clickable.

**[Derived]** The optional inline label is 12px/400/20 and sits inside the track; its presence increases the leading padding.

**[Project]** Use Switch only where the change takes effect immediately. Settings that apply on Save belong in staged form state, not a Switch.

### Table 表格

**Purpose [Stated].** Displays multiple rows of like-structured data for organizing, comparing, and analysing, with search, filter, and sort operations. Comprises **表头 (header), 数据行 (rows), and 表尾 (footer)**.

**Specified column configurations [Stated].** The source ships ten table archetypes, which define the supported structural cases:

| Configuration | Meaning |
|---|---|
| 三列 | 3 columns |
| 三列+可选 | 3 columns + row selection |
| 四列+拖拽 | 4 columns + drag reorder |
| 5列+拓展 | 5 columns + expandable row |
| 6列 / 7列 / 8列 | 6 / 7 / 8 columns |
| 8列+固定首列 | 8 columns, first column fixed |
| 8列+尾部固定 | 8 columns, last column fixed |
| 8列+首尾部固定 | 8 columns, first and last fixed |

**Header cell [Derived; font weight superseded by the project rule below].** Text 14px/400/22, fill `#F6F7F9` in the light theme and the semantic dark-theme fill token in the dark theme. Header affordances are separate component sets, each with on/off states: `.sorter` (`排序` = 默认 / 升序 / 降序), `.filter`, `.search`, `.expand`.

**Content cell [Derived].** Text 14px/400/22 on `#FFFFFF`. The content-cell set defines which payloads a cell may carry, each independently toggleable: `text` · `icon` · `icon+text` · `text+tag` · `tag` · `link` (可跳转文字链接) · `switch`. Actions are a dedicated `table-cell/action` set carrying 1–3 text buttons (管理 / 编辑 / 删除).

**[Project] Data-list text weight — 2026-11-07 user decision.** All text within a data list uses regular weight (400): column headers and field names, parameter values, row text, links, and text inside row icons or badges. Do not emphasize individual fields or values with bold. This project rule supersedes the earlier 600-weight table-header example and the table-header use of the 14px/600 typography role; it applies to future list pages as well as existing lists when edited.

**[Project] Row action overflow — 前 2 个直显 + 「…」（2026-11-02 user decision）.** When a row has more than two actions, only the **first two text links** render directly (by convention 详情 and 编辑); every further action moves into a hover-triggered「…」dropdown — a 24px `IconMore` mini button (`更多操作` accessible name + title), `position="br"`, popup container `body`, shared `content-class="row-more-dropdown"` (global.css: 104px min-width, 4px inset, 4px radius, hover fill, destructive option in danger color). Order follows frequency: 详情、编辑 →（草稿）发布 → 复制 → 删除 (danger). Conditional actions (e.g. 发布 on drafts only) enter the dropdown at the front; they never promote the direct links beyond two. The rule applies to every business list with more than two row actions; the overflow dropdown is the single overflow mechanism — never a third visible link.

**Exception [Project, 2026-11-13 user decision].** 标签管理列表 (`/tags`) 的「详情 / 编辑 / 删除」三个行操作全部直显且不渲染「…」下拉，由用户裁决覆盖本条规则；这是目前唯一登记在册的例外，其它业务列表仍须遵守上述溢出约定（见「标签管理列表 — 2026-11-13 user decision」）。

**[Project] Enterprise list presentation.** For the default business-list pattern, use a white table surface with no outer border, no zebra striping, and one subtle horizontal divider between rows. Keep the header on the same white surface unless a module explicitly requires the measured `Fill-2` header variant. Actions are text links/buttons using the primary semantic color; destructive actions use the danger semantic color. Horizontal overflow belongs to the table region, not the page shell.

**Row controls [Derived].** The `操作` axis on the first column defines the leading control: `checkbox` · `radio` · `drag` · `expand` · `n/a`. A row has `悬停` and `激活` states; the expand control has two levels (`展开` = 1 / 2).

**Footer [Derived].** The table footer can use the Pagination component, with total count / page size / page buttons / jumper as applicable. The pagination arrow's `type=left/right` means previous/next direction, **not** footer alignment.

**[Project]** Define a stable `row-key` (never the page index), field meaning/type/unit, width limits, alignment, truncation and full-view behaviour, server sort/filter keys, and row-action permissions. Distinguish `0`, `false`, `''`, `null`, and forbidden values. Amounts align right with currency and precision; dates show the time zone. Fixed columns must preserve identity and critical actions. Cross-page selection distinguishes selected IDs from "all records matching the query", shows page and total counts, and documents its reset policy. The server rechecks each item in a bulk action and reports partial success. Verify keyboard, screen reader, expanded rows, and fixed-column geometry before enabling virtual scrolling.

**[Project] Compact tables inside a panel.** Keep the panel's 16px content inset and add a cell inset (at least 8px; 12px on the outermost cells) so first/last headers, values, and row actions do not sit against the panel edge. When a table must scroll horizontally, scroll the table inside that inset rather than removing its outer cell padding. This is a project composition rule, not a measured Figma cell dimension.

**[Project] Models list refinement.** The default list has no outer border or zebra striping; every data row, including the last row, retains a subtle bottom divider. The first field is plain text by default and becomes the primary-color text on hover/focus; clicking it opens the row's detail/edit entry. The action column header and cell content are left-aligned. Row actions are text links, never icon-only controls, with a fixed 12px gap.

**[Project] Rule-management cell display (2026-10-29 user decisions, three same-day reversals).** On the rule list, 规则名称 / 标准库 / 问题库 / 安全需求 cells **wrap to full display** (no ellipsis, row height grows with content). 规则说明 and the short text columns keep the single-line ellipsis. The single-line truncation is carried by Arco `column.ellipsis` (dynamic `arco-table-text-ellipsis` on `.arco-table-td-content`), never by a custom static-class span in a cell slot: Arco keys body cells `td-${index}`, so toggling columns in 列设置 reuses Td instances, and Vue's compiled slot vnodes (patchFlag TEXT-only) update the text but not a static class — a later-enabled column inherits the previous column's class and wraps wrong. Plain-text slots plus the Arco dynamic class patch correctly.

**[Project] Multi-line clamping inside a modal table (2026-11-01).** When a cell must show 2–3 lines and then ellipsis, the clamp lives on an **inner** `<span>`: `.picker-clamp { display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; -webkit-line-clamp:n }`. `-webkit-line-clamp` only takes effect with `display:-webkit-box`, and putting that on the `<td>` replaces `display:table-cell`, collapsing the cell box so every column visually merges into the first one. Never place `-webkit-box`, `flex`, or `grid` on a `<td>`; size and clip through the child element and keep the cell itself a table cell.

**[Project] Filter field composition — 2026-11-09 user decision.** In desktop query areas each field is a **stacked, left-aligned group**: a `12px` field-name label with the global colon on top and a `200px` white-surface control directly below, separated by a **4px** gap. The earlier right-aligned two-column label/control group with an 8px gap is retired. Input and select controls target 200px width and use a white surface in the light theme, including hover and focus states unless focus styling requires the semantic primary border. The group must hug its content rather than reserve an empty right-side area; at the narrow breakpoint it becomes full-width. The filter-settings trigger is the same 32px icon-only `IconFilter` button pattern used by Task Center, with a localized accessible name and visible hover/focus state, and sits directly after the last field on the shared 16px gutter.

**[Project] Column settings popover.** Column settings open in a popover anchored below the toolbar trigger, never a centered modal. The popover contains only the field list and an optional “restore defaults” action; the title, explanatory paragraph, arrow buttons, Cancel, and Confirm controls are not rendered as visible content. Checkbox changes and drag-and-drop reordering apply immediately. The first field is visible by default, cannot be unchecked, and cannot be moved below another field. The popover is a reusable shared component and its list, checkbox labels, restore action, and dialog label are localized.

### 任务管理列表 — 2026-11-12 user decision [Project]

任务管理 (`/projects`) 列表由「筛选条件区 + 数据列表区」两块独立白色业务面板组成（与分项管理同构）；「新建任务 / 编辑任务 / 复制任务」复刻「功能数据安全合规自评」工作台-新建任务抽屉，统一走路由或局部复制态驱动的抽屉。

- **数据列（15 项）.** 任务编号、任务名称、任务类型、品牌、车系、车型、优先级、任务状态、负责人、创建人（默认不显）、创建时间、截止时间、实际结束日期、更新人（默认不显）、更新时间（默认不显）。首列任务编号锁定可见且不可移动、恒为首列并冻结；操作列固定末列冻结右、不进列设置。默认显 12 列，创建人 / 更新人 / 更新时间默认隐藏，由列设置按需展开。表头背景 = Fill-2（`--app-table-header`，亮色 `#F6F7F9` / 暗色 `var(--color-fill-2)`），数据行白底、无外框、无斑马纹、行间单线；表头与数据均 400 字重，表头 50px、数据行 50px、12px 内边距。
- **筛选条件（15 项）.** 与数据列一一对应的可选查询字段，首项任务编号锁定不可取消 / 拖拽；创建人 / 更新人 / 更新时间默认隐藏。创建人 / 创建时间 / 更新人 / 更新时间由系统自动填充且只读，不出现在新建 / 编辑抽屉的可编辑区。
- **状态机（7 态）与行操作.** 任务状态与行操作严格对应：详情恒显；执行仅「待处理」；编辑仅「待提交 / 已撤回」；复制除「已撤回」外均显且恒置末位。顺序固定为 详情 →（执行 | 编辑）→ 复制：

| 任务状态 | 行操作 |
|---|---|
| 待处理 pending | 详情 · 执行 · 复制 |
| 待提交 submitting | 详情 · 编辑 · 复制 |
| 进行中 active | 详情 · 复制 |
| 审批中 reviewing | 详情 · 复制 |
| 已完成 completed | 详情 · 复制 |
| 已撤回 withdrawn | 详情 · 编辑 |
| 已作废 voided | 详情 · 复制 |

- **分项类型任务状态派生（需求4 四条规则）.** 任务类型 = `section`（分项）时，父任务状态**不**存于自身、由子项审批状态实时派生——行标签、操作列、排序、筛选、详情全部读派生值（唯一数据源 `deriveSectionStatus(subTasks)`）：子项都通过 → 已完成；无驳回且都在审批中且无进行中 → 审批中；有驳回且有通过（不论是否还有进行中）→ 进行中；其余（如全未开始）→ 待处理。
- **新建 / 编辑 / 复制抽屉.** 「新建任务」按钮打开 Medium 800px 抽屉：任务名称（必填 ≤50、全局唯一）/ 任务描述（≤200）/ 优先级单选（默认中）/ 截止时间（到日）/ 附件（≤5·≤20MB，doc/xls/pdf/png/jpg）/ 任务编排（必选，选中后缩略流程预览 + 编辑编排入口）。编辑复用同一抽屉（按 `:edit-source` 预填、唯一校验排除自身）；复制按 `:copy-source` 预填并在任务名称后加「（副本）」。抽屉由路由（/projects/new、/projects/:id/edit）或局部复制态驱动开合，关闭后按来源回退路由或清除复制源，未保存修改触发放弃确认。车型相关参数留任务执行阶段，不在本抽屉编辑。

### 分项管理列表 — 2026-11-12 user decision [Project]

分项管理 (`/sections`) 是「任务管理」之下的一级菜单（见 Sidebar module icon semantics）。列表按参考稿拆成两块独立白色业务面板：筛选条件区 + 数据列表区。

- **筛选条件区.** 9 个可选查询字段，弹层顺序即筛选行顺序：项目编号、项目名称、优先级、法规编号、任务类型、状态、开始日期、计划结束日期、实际结束日期。**默认只显示 项目编号 / 项目名称 / 法规编号 / 状态 四个**；优先级、任务类型、开始日期、计划结束日期、实际结束日期默认隐藏，由「筛选设置」按需展开。字段隐藏时同时清掉草稿与已应用条件，避免不可见条件继续过滤。字段布局一律走 Filter strip packing 的上下结构、200px 控件与查询 / 重置 / 筛选设置按钮组。
- **数据列表工具栏.** **左上角是带文字的「导出」按钮，右上角是 32×32 的列设置图标**（`IconSettings`），两者分列两端；本页不使用「标题 + 右侧操作组」的通用工具栏形态。列设置决定 9 个业务列的显隐与顺序，首列项目编号锁定可见，操作列恒为最后一列且不进弹层。
- **列与排序.** 列序按参考稿：项目编号、项目名称、优先级、法规编号、状态、任务类型、开始日期、计划结束日期、实际结束日期、操作。**9 个业务列全部带升序 / 降序图标**；分页只把当前页切片交给表格，因此排序必须在数据层对完整筛选结果重排，Arco 与数据层共用同一个比较函数并使用受控 `sortOrder`，列设置导致的 columns 重算与翻页都不得丢失排序。空值（未填写的实际结束日期）恒排末尾，不随升降序翻转。优先级 / 状态用语义状态标签，颜色按 `statusRole` 解析。
- **行操作.** 「详情」（由「查看」改名）、「编辑」两个文字链接直显；第三个动作「审批」按 Row action overflow 收进 hover 触发的「…」下拉。「详情」跳转 `/sections/:id` 子页面（见下方分项详情条款）；「编辑」「审批」仍**仅占位**，业务逻辑待后续开发，不得伪造保存 / 审核结果。
- **分页与导出.** 右下角使用共享 `AppPagination`（默认每页 10 条）。导出按 Batch export baseline 作用于当前已应用筛选结果与当前可见列，确认弹窗后生成 `分项管理_YYYY-MM-DD.xlsx` 并登记到导入导出下载任务（模块 key `sections`）。

### 分项详情子页面 — 2026-11-12 user decision [Project]

点击列表「详情」进入 `/sections/:id`，可直接载入、刷新与后退；id 不存在时显示「分项不存在」空态。页面由四个独立白色业务面板组成：

1. **顶部操作栏.** 左侧 32×32「<」返回按钮 + 面包屑（分项管理 / 分项详情），右侧操作功能**若无则不渲染**，不得放占位按钮或状态 Tag。颜色按 Breadcrumb 的详情子页面契约：返回控件与上级项默认 Text-3、hover 主色（返回控件另加 Fill-2 悬停底），当前页 Text-1 / 600 且不是链接。
2. **基础信息.** 项目编号、项目名称、品牌、车系、车型、优先级、负责人，走共享 `.app-detail-list` 行式只读字段（标签带全局冒号），优先级用语义状态标签。品牌 / 车系 / 车型 / 负责人从项目管理主数据按项目编号关联，不复制第二份。
3. **项目内容.** 开始日期、计划结束日期、任务类型。任务类型按参考稿逐行列出 车型配置 / 技术资料 / 测试记录 / 证书 / 报告，每行以**纯文本**呈现 目标时间 / 执行人 / 审核人 / 模板 四项参数：不渲染 checkbox、日期选择器、下拉等任何表单控件；空值统一「—」；模板参数只属于车型配置。
4. **任务信息.** 只读表格，列 = 法规编号 / 技术资料模板 / 技术资料是否外部审核 / 测试记录模板，表头与单元格 400 字重、无外框、行间单线，横向溢出留在表格容器。

### 标签管理列表 — 2026-11-13 user decision [Project]

标签管理 (`/tags`) 沿用「筛选条件区 + 数据列表区」两块白色业务面板、12px 间距的列表骨架。

- **筛选条件 / 列设置.** 业务字段全集固定为 4 项：标签名称、标签描述、创建人、创建日期；筛选条件设置与列设置共用 `ColumnSettingsPopover`，首项「标签名称」锁定可见且不可拖拽，默认 4 项全显。筛选区走 Filter strip packing（字段名称在上、200px 控件在下、4px 间距、16px 栅栏），查询 / 重置 / 32px `IconFilter` 按钮组紧跟最后一项；创建人用下拉、创建日期用日期选择器，其余用文本输入。隐藏筛选字段时同步清掉草稿与已应用条件。
- **数据列表.** 4 个业务列全部支持升降序，排序在「过滤后、分页前」的数据层完成，受控 `sortOrder` 与 Arco 共用同一个 `compareRows`；列设置隐藏当前排序列时清空排序状态。首列锁定可见，操作列恒为末列、不进弹层、固定右侧。左上角是「新建标签」主按钮，右上角是 32×32 `IconSettings` 列设置图标，右下角为共享 `AppPagination`。标签名称按 2026-11-13 参考稿以 chip 呈现：**文字取所选色的同色相可读阶（`-fg`），背景取该色的淡阶（`-bg`）**，圆角 2px、14px/400/22、4px×8px 内边距；列表单元格与只读详情的标签名称共用同一 chip，标签颜色的只读值仍为 10px 色点 + 颜色名。前景/淡底两类色值同样只在 `tokens.project.json` 亮/暗 block 中定义，颜色永不作为唯一线索。
- **新建 / 编辑 / 详情弹窗.** 三种模式共用一个 560px 居中 `a-modal`（表单弹窗在 X / 取消 / Escape 时立即关闭，不做放弃二次确认）：标签名称必填 ≤20 字、字数计数器在输入组件内右侧；标签颜色为 6 色预设色板（蓝 / 绿 / 橙 / 红 / 紫 / 青，默认蓝），色值只在 `tokens.project.json` 的亮/暗语义变量中定义，页面不得写裸 HEX；标签描述选填 ≤200 字。创建人、创建日期由系统写入时补齐，**不出现在弹窗的任何字段**（含只读详情）；详情模式走 `.app-detail-list` 行式只读字段。
- **行操作.** 三个文字链接「详情」「编辑」「删除」全部直显，**不渲染「…」溢出按钮**（2026-11-13 用户裁决）：本页是通用 Row action overflow 规则的项目级例外，仅适用于标签管理列表。删除用 danger 语义色文字链接，点击后走统一 `ConfirmDialog`（warning 图标 + 副标题）二次确认，确认后才删除并提示结果。

### 模版管理列表 — 2026-11-13 user decision [Project]

模版管理 (`/templates`) 的配置态与使用记录态共用同一页面骨架。配置态的 5 个类型 tab（车型配置 / 技术资料 / 测试记录 / 报告 / 证书）按以下契约与使用记录态对齐；本页不使用「标题 + 右侧操作组」的通用工具栏形态。

- **类型 tab 归位.** 5 个类型 tab 移入筛选条件面板并独占首行，不再单独占一块白面板；面板内字段与按钮组统一走 Filter strip packing 的上下结构、200px 控件与 16px 栅栏。Tabs 的 hover / 选中态仍只由 `global.css` 的 Tabs 分节提供，页面不得写局部颜色或字重覆盖。
- **筛选条件.** 配置态 6 个可选查询字段，弹层顺序即筛选行顺序：模版名称、状态、版本号、模版描述、创建时间、更新时间；使用记录态为 模版名称、模版类型、版本号、项目编号、使用人、使用时间。两态首项「模版名称」锁定可见且不可拖拽，默认全显，隐藏字段同步清掉草稿与已应用条件。查询 / 重置 / 32px `IconFilter` 按钮组紧跟最后一个字段；状态 / 版本号 / 模版类型用下拉，日期字段用日期选择器，其余用文本输入。
- **数据列表工具栏.** 去掉「模版配置 / 使用记录 + 共 N 条」标题与计数文案。左上角是带文字的操作按钮（配置态「新增模版」primary，使用记录态「导出」neutral），右上角是 32×32 `IconSettings` 列设置图标，两者分列两端（同 分项管理列表 / 标签管理列表 基线）。
- **列与排序.** 每个视图 6 个业务列全部支持升序 / 降序，比较值取显示文本（状态走语义标签文案），用 `localeCompare(locale, { numeric: true, sensitivity: 'base' })` 随语言做自然数序排序；排序在「过滤后、分页前」的数据层完成，Arco 与数据层共用同一比较函数并使用受控 `sortOrder`，列设置重算与翻页都不丢方向。首列「模版名称」锁定可见，操作列恒最后且不进列设置；隐藏当前排序列时清除排序状态。
- **行操作与表格.** 「详情」直显，配置态草稿行多一个「编辑」，每行不超过两个动作，因此不触发 Row action overflow；文字按钮用主色、400 字重、12px 间距，状态列走 `AppStatusTag` + `statusRole`。表格白底、无外框、无斑马纹、行间单线，表头 50px / Fill-2、数据行 50px / 12px 内边距，两态共用同一套样式；横向溢出留在表格容器，右下角使用共享 `AppPagination`。
- **tab 切换与空态.** 同一列表页内切换类型 tab 保留已应用筛选（Jump-in filter params），仅重置页码；切换到使用记录是另一个业务视图，重置两侧查询。无结果时按有无已应用条件区分「暂无匹配模版」与「暂无匹配记录」。
- **数据边界.** 使用记录由模板主数据派生，编辑模板不改变历史使用痕迹；配置态每个类型 7 条，描述 / 版本号 / 状态 / 创建与更新时间各有差异，供筛选、排序与分页验收。导出沿用 Batch export baseline，只作用于使用记录当前已应用筛选结果与当前可见列。

### 项目归档 — 2026-11-13 user decision [Project]

`/archive` 的一次性调整共九项。其中第 1 项是 **Full-site spacing implementation 的唯一横向例外**，其余八项复用既有共享规则，不得推广成第二套实现。

1. **双面板贴紧.** 左侧目录与右侧内容仍是两块**各自独立**的白色圆角面板（各自读 `--mt-ds-control-radius`），但 `gap: 0`——直接相邻，没有灰色画布缝隙，也没有共用容器。左栏带 **1px 描边分界线**（`border-right: 1px solid var(--app-divider)`，即 OpenData 车型车辆内容区使用的 `--color-border-2`），贴合状态下由这条线承担两栏分界，不引入任何间距；≤900px 时同一条线切换为 `border-bottom` 且 `border-right: 0`（2026-11-13 追加裁决）。整块高度固定 `calc(100dvh - 56px - var(--app-page-gutter) - var(--app-page-gutter))`，底边只留 shell 的 16px gutter。右侧面板是纵向 flex：工具栏 / 筛选条件 / 列表工具 / 分页固定高度，只有 `.table-region` 内部滚动，分页器始终可见。≤900px 堆叠态改回 `height: auto`、目录 `max-height: 280px` 并以 1px 分隔线分界。验证值：1440×900 与 1280×800 下 `horizontalGap = 0`、`bottomGap = 16`；两块 `border-radius = 2px`。
2. **表格密度退役.** 移除 `IconLineHeight` 密度切换与 `:size` 绑定，表格固定 medium；列表工具栏不再承载密度控件。
3. **表头背景.** 表头读 `--app-table-header`（亮 `#F6F7F9` Fill-2 / 暗 `var(--color-fill-2)`），50px 表头 / 50px 数据行、14px/400、无外框、无斑马纹、行间单线、行 hover 用 `--color-fill-1`。
4. **筛选条件.** 4 个可选查询字段且**默认全显**：交付物名称 / 关联活动 / 交付日期 / 责任人；首项交付物名称锁定可见不可取消，隐藏字段同步清掉草稿与已应用条件。字段一律走 Filter strip packing 的上下结构与 200px 控件。
5. **筛选设置.** 重置按钮右侧是 32×32 `IconFilter` **筛选设置**（不是列设置），控制第 4 项字段的显隐与顺序。
6. **列设置.** 32×32 `IconSettings` 固定在**数据列表工具栏右上角**，与筛选设置分处两个区域；弹层控制 4 个业务列，首列锁定，操作列恒为最后一列且不进弹层。
7. **在线预览.** 行操作「预览文件」调用第三方 `@vue-office` 组件族按扩展名分派：pdf → `@vue-office/pdf`、docx/doc → `@vue-office/docx`、xlsx/xls → `@vue-office/excel`，txt/json 等走原生文本渲染；三个插件用 `defineAsyncComponent` 按需加载，不进首屏包，构建产物为独立 chunk。弹窗自带加载 / 失败重试 / 不支持格式状态。档案服务尚未接入，文件内容由 `src/modules/archive/data/preview.ts` 按扩展名在浏览器内生成合法文件（PDF 含 xref、DOCX 为最小 OOXML、XLSX 由 exceljs 生成）；页面与文案不出现实现阶段说明，接入后端后只需替换文件地址来源。
8. **下载走导入导出.** 行操作「下载」与预览弹窗内的下载统一调用 `useTaskCenterStore.addDownloadTask`（模块 key `archive`，文件名即交付物名），随后 `open('download')` 打开「导入导出–下载任务」；不再直接触发本地 Blob 下载或文本替身。`taskCenter.modules.archive` 提供双语模块名。
9. **排序.** 排序在**过滤后、分页前**的数据层完成，用 `Intl.Collator(locale, { numeric: true, sensitivity: 'base' })`；Arco 列统一 `sorter: () => 0`，只负责排序图标与方向，不覆盖数据层顺序。列设置隐藏当前排序列时同步清除排序状态。

验证口径：headless DOM / `getComputedStyle` / `getBoundingClientRect`，四种预览格式均 `rendered=true` 且 0 pageerror / 0 failed request，zh-CN 与 en-US、亮色与暗色、1440 / 1280 / 375px 全部实测——**不使用截图**。

### Tag 标签

> The source's purpose copy for Tag, Tooltip, and Badge is duplicated from Table; use the component variants here rather than that copy. See Defects found in the source.

**Measured sizes:**

| Size | Height | Padding H | Padding V | Text |
|---|---|---|---|---|
| large 大尺寸 | **32px** | 12px | 4px | 16px/400/24 |
| medium 中尺寸 | **24px** | 8px | 1px | 14px/400/22 |
| small 小尺寸 | **20px** | 4px | — | 12px/400/20 |

**Radius:** 2px for every size.

> The Tag prose reverses the size/height order. Use the measured table above; the source defect is recorded once under Source coverage.

**Variants:** `variant 类型` = dark 深色 / light 亮色 / outline 描边 / light-outline 描边亮色 · `theme 主题` = default 默认 / primary 主要色 / success 成功色 / warning 警告色 / danger 危险色 · `size 尺寸` · `icon 图标` · `closable 关闭` · `disabled 禁用`.

The four variants are a complete cross-product with the five themes: `dark` is a solid semantic fill with white text, `light` a pale fill with semantic text, `outline` a semantic border on transparent, `light-outline` a pale fill **and** semantic border.

**[Project]** Map a business enum centrally to text, optional icon, and semantic color. Status must stay legible without color — pair every tag with its text label.

### Tooltip 文字提示

**Type [Stated]:** 基础用法 — a tooltip carries **text content only** (文字提示仅展示文本内容). Anything richer belongs in a Popover or Popconfirm.

**Variants:** `placement 位置` — eight positions: top-left / top-center / top-right · bottom-left / bottom-center / bottom-right · left-center · right-center.

**[Derived] Measured:** the bubble is **`#FFFFFF`**, radius **4px** (`corners-2`), with a 10×6px arrow in the same white, carrying the Level-2 shadow. It is a light surface, not a dark one. Text 14px/400/22.

### Tree 树结构

**Purpose [Stated].** For folders, category directories, organizational structures, and other deeply nested content, a tree shows the hierarchy clearly and supports expand, collapse, and select.

**Types [Stated]:** 基础树结构 / 基础树 (basic) and 可功能操作树 (with actions).

**Depth [Stated].** Five levels are specified: 一级树 through 五级树/最底层 (the deepest level).

**States [Stated]:** Normal · Hover · Active · Disabled.

**Variants:** `数量` = 1–8 · `⬑二级数量` = 1–6 / n/a · `子集` (has children) · `展开` · `悬停` · `禁用` · `高亮` · `操作` — each off/on.

**[Derived]** Node text is 14px/400/22; hover and active reuse the navigation fills (`#F7F8FA` / `#E6F3FF`). Drag feedback uses the Level-3 shadow, per the elevation page's stated use ("组件 hover 状态使用，例如表格和树拖动").

### Descriptions 描述列表

**Purpose [Stated].** Displays a group of multiple read-only fields; typical on a detail page.

**Types [Stated]:** 基础样式 (basic) · 上下排列样式 (stacked label above value) · 带边框样式 (bordered).

**[Derived]** Labels are 14–16px/400 in `Text-4 #666666`; values are 14–16px/400–500 in `Text-5/6`. The basic style writes the label with a trailing colon (`标题一：`). Real-world sample fields in the source — 法定负责人, 统一社会信用代码, 成立日期, 核准日期, 营业期限, 经验范围 — indicate this component's intended use for registry/company detail panes.

**[Project] Colon implementation — 2026-11-06 user decision.** The trailing colon is no longer limited to the basic Descriptions style: it applies to **every** field label in the product, including these read-only rows, and is rendered once by `.app-detail-label::after` from `--app-field-colon` (`：` / `:`) in `src/styles/global.css`. No label value in `i18n.ts` contains a colon. See Form field layout for the global contract and exclusions.

**[Project]** Use Descriptions for read-only facts rather than a disabled form that only looks editable.

**[Project] Read-only detail drawers use the label-value row list (2026-10-26 user decision).** Inside read-only detail drawers (功能详情, 审计详情, and later non-editing panels), read-only facts no longer render as the bordered Descriptions table. Each field is one row of the shared `.app-detail-list` (implemented once in `src/styles/global.css`): a label column (14px, Text-2, minimum 112px wide, sizing to the longest label) + a left-aligned value column (14px, Text-1) with a **16px gap between label and value** and a **10px vertical gap between consecutive field rows** (22px text line inside the row), and **no cell borders**. Status/role/action-type/result keep their Tag / dot rendering inside the value column (e.g. 功能状态 renders as a colored Tag). The bordered Descriptions table itself remains sanctioned outside drawers where a denser matrix is genuinely needed; a detail drawer reintroducing the bordered table is a defect from this date on. Since the 2026-11-06 colon decision, the label column also carries the trailing `：` / `:` from `.app-detail-label::after`; it is part of the label's measured width, not extra padding, and the 16px label-to-value gap is unchanged.

### Empty 空状态

**Purpose [Stated].** Represents the state where the current scenario has no corresponding data.

**Specified empty states [Stated].** Eight distinct illustrations and messages — these are the sanctioned set, and the distinction between them is normative:

| State | Message |
|---|---|
| No data | 暂无数据 |
| No search result | 搜索不到相关内容 |
| Page lost | 404错误，页面丢失 (illustrated `404` / `ERROR`) |
| No files | 暂无文件 |
| No notifications | 暂无消息通知 |
| Network error | 网络异常 |
| Under construction | 系统建设中 |
| No permission | 暂无权限 |

**[Project]** "No data", "no match", "network error", and "no permission" are four different states with different recovery actions — never collapse them into one blank panel. Caption text is 20px/400/28.

### Badge 徽标

**Styles [Stated]:** 基础样式 (basic) · 红点样式 (dot) · 红点数字样式 (dot with number, e.g. `99+`) · 创新样式 (feature badge, e.g. `NEW`).

**Variants:** `dot 红点` = yes / no.

**[Derived]** Badge text is 12px/400/20; the host content label is 14px/400/22.

### Dialog 对话框

**Purpose [Stated].** A temporary window used when the overall task flow should not be interrupted, but information must be shown or a response obtained — a dialog opens in the page to carry that information and its actions.

**Measured geometry:**

| Property | Value |
|---|---|
| Width (information dialog) | **456px fixed** (固定456px宽度) |
| Width (content dialog) | **560px**, or 自适应 for the basic content type |
| Radius | **4px** (`corners-2`) |
| Fill | `#FFFFFF` |
| Padding | 20px (unchanged; a floating dialog keeps its measured inset) |
| Header-to-body gap | **24px** — revised from the source's measured 40px, which was sized for a 20px title. A 16px/24 title leaves 40px reading as an empty band |
| Shadow | Level 3 |

**[Project] Width by dialog family — 2026-11-06.** The 456px "information dialog" figure above describes a short plain-message dialog. The project now has three families with distinct widths: **confirmation dialogs** (二次确认 / 提示 / 告警 / 成功, `.app-confirm-dialog`) use **560px** with a **fixed `height: 250px`** (2026-11-08 decision, superseding the earlier 320px minimum), no titled header, and the `X` pinned to the top-right corner; **department form dialogs** (`.department-dialog`) use **640px** with `min-height: 320px`, a titled 48px header and a bordered footer; other **content dialogs** keep 560px or 自适应. Do not read the 456px row as applying to confirmation dialogs — the unified `ConfirmDialog` component is the authority for that family.

**[Project] Why the header gap changed.** The 40px figure was measured against a 20px module title. With the panel title at 16px/600/24 (Typography · Title roles and vertical rhythm), 40px is 1.67× the title's line box and the header no longer reads as attached to its body. 24px equals one title line box, so the gap reads as breathing room rather than an empty band, and it stays a 4px multiple. Do not spend the reclaimed space by enlarging the title; spend it on content.

**Types [Stated]:** 基础信息对话框 (basic information) · 有图标信息对话框 (with icon) · 可关闭信息对话框 (closable) · plus 信息类 (information) vs 基础类 (basic/content) groups with a dedicated 内容区 (content region).

**Variants:** `theme 主题` = default 默认 / info 信息 / success 成功 / warning 警告 / error 错误 · `closeBtn 关闭按钮` = on / off.

**[Derived]** Title 16px/600/24; body copy 14px/400/22; footer actions are 取消 (secondary) then 确定 (primary), right-aligned.

**[Project] Title alignment — left (2026-10-23).** The Figma Dialog page does not specify header title alignment, and the Arco default (`titleAlign: center`) centers the title in the 48px header — measured on a 456px information dialog, the text sat 196px from each edge. The recorded product decision is that a dialog **title is left-aligned**: it starts on the same 20px inset as the body copy and footer, so title, message, and actions share one left edge, and the title keeps a 24px right reserve so a long label never runs under the close button (12px icon at the 20px inset). The 16px/600/24 title type and the right-aligned footer actions are unchanged. The rule is implemented once in `src/styles/global.css` (`.arco-modal .arco-modal-header .arco-modal-title`, specificity above Arco's `title-align-*` variants) so every `a-modal` dialog follows it regardless of stylesheet order. Drawers and popovers are not covered by this rule.
**[Project] Dismissal on X / 取消 — 2026-11-06 user decision.** A centered `a-modal` carrying an add/edit form closes **immediately** when the user clicks the header `X`, the 取消 footer button, or presses Escape: no second confirm-and-discard dialog, no dirty-tracking state, and no “当前有未保存的修改，确定要放弃吗？” prompt. Unsaved input is discarded and the form resets on the next open. A short centered dialog is a lightweight task surface, so a two-step exit costs more than the draft it protects. Do not reintroduce a discard modal nested inside a dialog. The confirm-and-discard guard described under Drawer applies to drawers and child routes only.

**[Project] Department dialog action block and height — 2026-11-06 user decision.** The 添加部门 / 添加子部门 / 编辑部门 dialogs (部门管理页 and 用户管理 → 组织架构) share one shell class `.department-dialog` and three measured rules. **(1) Copy:** the primary footer action is **确定 / Confirm**, not 保存 / Save; 保存 stays on the add-user drawer (`UserFormDrawer`) where it belongs. **(2) Action block:** 取消 (neutral outline) + 确定 (primary) render in Arco's `.arco-modal-footer` — a distinct region with a `1px var(--app-divider)` **upper border** — never as an unbordered `<footer>` floating in the body. Use Arco's `okText` / `cancelText` / `okLoading` / `@ok` / `@cancel` props (or the `#footer` slot), not `:footer="false"`. **(3) Geometry:** `min-height: 320px`; header 48px, body `padding: 24px 20px` (24px header-to-body gap, 24px body-to-divider gap), footer `padding: 16px 20px 20px` (16px divider-to-button, 20px button-to-bottom). The shell is `inline-flex; flex-direction: column` so the body takes `flex: 1` and the footer pins to the bottom at the 320px minimum, while the dialog **grows with content** rather than scrolling internally at the minimum. `inline-flex` (not `flex`) is required: Arco centers the dialog with `vertical-align: middle` in an inline formatting context, and a block-level flex container would break that. Implementation lives once in `src/styles/global.css` because `a-modal` uses `inheritAttrs: false` and teleports its container to `body`, so page-scoped CSS cannot reach the header/body/footer.

**[Project] Confirmation dialogs — unified four-part structure — 2026-11-06 user decision.** Every **二次确认 / 提示 / 告警 / 成功** dialog (delete confirmations, discard-unsaved-change guards, blocked/forbidden notices, export notices, reset-password confirmations) uses one shared component `src/shared/components/ConfirmDialog.vue` and one shell class `.app-confirm-dialog` owned by the shared component. The user-supplied reference boards (four variants: 提示, 问号确认, 问号确认+副标题, 放弃修改) define an identical **four-part format: state icon → title → optional subtitle → bottom action block**. No page may hand-roll another confirmation `a-modal`, use `:footer="false"` with an in-body `<footer>`, or call `Modal.confirm()` — those four competing implementations were the defects this rule removes. Confirmation dialogs and **form** dialogs are two different surfaces: the form dialog (`.department-dialog`) keeps a 48px titled header and a footer with an upper border; a confirmation dialog has **no header text, no header divider, and no footer upper border** — the white space itself separates the three regions.

**Measured geometry (from the reference boards, 2× export → CSS px):**

| Property | Value |
|---|---|
| Width | **560px** (project content-dialog width; replaces the old 456px information-dialog figure for this surface) |
| Radius / fill | `4px` / `#FFFFFF`, Level 3 shadow |
| Height | **fixed 250px** (2026-11-08 decision; the earlier 320px minimum that grew with content is retired), from `--mt-ds-confirm-height`. `inline-flex; flex-direction: column`; body `flex: 1` with `min-height: 0` and `overflow-y: auto` pins the footer to the bottom and scrolls long copy **inside** the body instead of growing the shell |
| Header | 48px, **text-free**, only the `X` (`--color-text-1`) **pinned to the top-right corner** — 32×32 control at 20px from the right edge / 8px from the top, `justify-content: flex-end`, **no `border-bottom`** |
| Body | `padding: 24px 20px`, `display: flex; align-items: center` — the whole icon/title/subtitle group is vertically centered within the fixed 250px shell; **within** the group, the icon is bound to the title's first line, not to the group's centre (2026-11-08 decision) |
| State icon | **20×20 outlined** circle glyph, `gap: 24px` to the text column, `align-items: flex-start` on the group and a **20px × 24px icon slot** (`--mt-ds-confirm-icon` × `--mt-ds-line-title`) so the glyph's centre equals the **title line's centre** — identical with 0, 1 or 2 subtitle lines and with a wrapped title |
| Title | 16px/600/24, `--color-text-1`, left-aligned, wraps rather than clips |
| Subtitle | optional, 14px/400/22, `--app-confirm-desc` (`#999999` light; `--color-text-3` dark), 8px below the title; multiple lines are 4px apart |
| Footer | `padding: 16px 20px 20px`, right-aligned, **no `border-top`**, 12px between buttons |
| Actions | 取消 (neutral outline `app-btn-neutral`) then 确定 (primary), or a single 我知道了 (primary) for pure notices |

**Icon semantics.** `icon` is `question` (default, `IconQuestionCircle`, 需确认) · `info` (`IconInfoCircle`, 纯提示) · `warning` (`IconExclamationCircle`) · `success` (`IconCheckCircle`) · `danger` (`IconCloseCircle`). Outlined, **not** filled: the reference boards show a hollow orange ring. `question` / `info` / `warning` use `--app-confirm-icon` = `#FF6B00` (a dedicated token: Arco's `--warning-6` resolves to `#FF7D00` in this theme and reads too yellow against the reference boards; dark mode falls back to `--app-color-warning`); `success` uses `--success-6`, `danger` uses `--danger-6`. The primary action is always the theme primary (`#0DB9C6`) with white text — **do not use a red `status="danger"` primary button** in a confirmation dialog, even for destructive actions; the reference boards use the theme color for 确认删除 and 放弃 alike.

**Copy and behaviour.** All button labels are i18n (`designSystem.confirm` / `designSystem.cancel` / `designSystem.acknowledge` as component defaults; business copy supplied by the caller via `t(...)`), symmetric in `zh-CN` / `en-US`. The header `X`, Escape, mask click, and 取消 all resolve to `update:visible=false`; 确定 resolves to `confirm` and the caller owns closing. `dismissible=false` plus `cancelDisabled` / `okLoading` freeze the dialog during an in-flight async operation (export is the baseline). The caller keeps visible true after a failed operation and provides a retry path, then closes only after success. Centered **form** dialogs still close immediately with no discard prompt; the discard guard itself now renders through this same component on drawers and child routes. Implemented once; consumed by `DeleteConfirmModal`, `UserManagementPage` (blocked / department delete / reset password / export), `DepartmentsPage`, `UserFormDrawer`, `RolesPage`, `AuditManagementPage`, and `WorkflowPage` (one instance driving delete / discard / template-delete through `askConfirm`).

**[Project] Fixed height and close-control placement — 2026-11-08 user decision.** Every dialog from this family renders at **exactly 250px**; do not reintroduce `min-height`, content-driven growth, or a page-level height override. The value is one generated token (`--mt-ds-confirm-height`) consumed once in the shared component, so all 12+ call sites change together. Header (48px) and footer are `flex: none`; the body is `flex: 1 1 auto; min-height: 0; overflow-y: auto`, so a long subtitle scrolls within the body rather than stretching the dialog. The `X` **must sit in the top-right corner**: because the close control lives in the `#title` slot, the global left-alignment rule `.arco-modal .arco-modal-header .arco-modal-title` (`justify-content: flex-start; padding-right: 24px`) would otherwise push it to the top-left. Override it with the more specific `.app-confirm-dialog .arco-modal .arco-modal-header .arco-modal-title { justify-content: flex-end; padding-right: 0 }`. Verify computed top/right offsets (8px / 20px), not just the presence of an `X`. When `dismissible=false` (in-flight async operation) the control is intentionally absent until the operation settles. Form dialogs keep Arco's own top-right close button and their 320px minimum — do not apply this rule to them.

**[Project] Icon/title horizontal alignment — 2026-11-08 user decision.** In this family the **icon and title share one horizontal line**; the icon must never be vertically centred against the taller `title + subtitle` block. The defect was measurable: `.app-confirm-main { align-items: center }` put the icon centre at the copy column's centre, so with 0 / 1 / 2 subtitle lines the icon sat `0px / 15px / 28px` **below** the title centre. Implement it once in `src/shared/components/ConfirmDialog.vue`: the group is `display: flex; align-items: flex-start`, the icon is wrapped in a `flex: none` slot of `width: var(--mt-ds-confirm-icon)` (20px) and `height: var(--mt-ds-line-title)` (24px) with `align-items: center`, and the title plus subtitle lines remain in `.app-confirm-copy` so subtitle rows keep the title's left edge. The `.arco-modal-body` still centres the complete group vertically inside the 250px shell — only the **internal** alignment changed. The glyph itself is sized once by `--mt-ds-confirm-icon` through `font-size` (Arco icons render at `1em`) — do not reintroduce a hardcoded `:size="20"` prop that could drift from the slot. Do not fix this with a magic `margin-top` or by moving subtitle lines out of the copy column; a wrapped title must keep the icon on its first line. Verify computed centre deltas, 20px icon size, 24px gap and subtitle left edges in real dialogs with and without subtitles (`scripts/design-browser.mjs`), not just the presence of an icon. This rule applies to confirmation dialogs only; form dialogs have no state icon.

### Drawer 抽屉

**Purpose [Stated].** Opened by clicking an adjacent control; a floating panel that slides in from the screen edge — also called a half-screen modal.

**Measured sizes [Stated]:**

| Size | Width |
|---|---|
| Default | **500px** |
| Medium 中号 | **800px** |
| Large 大号 | **1000px** |

**Structure [Stated]:** 标题名称和关闭按钮 (title + close) in a **56px** header; body; and 操作按钮区，固定底部 — **the action area is fixed to the bottom**, not scrolled with the content.

**[Derived]** Fill `#FFFFFF`; title 16px/600; footer carries 取消 and 确定.

**[Project]** A Drawer holding unsaved input must not close silently on mask click or Escape. Define one vertical scroll owner for the body; the fixed footer must reserve its own space rather than overlay the last field.

**[Project] Business-drawer surface and grouping — 2026-10-25 user decision.** A business drawer (form/detail/import-style panels, e.g. 功能台账) renders on the page canvas `Fill-1 #F7F8FA` (`--mt-fill-1`, dark theme follows the token) instead of a full-white panel; the 56px header and the fixed bottom action bar stay on the white business surface (`--app-surface`), as does every **content block**: the body is a vertical stack with 16px padding and 16px gaps, and each logical block is wrapped in its own white card with 16px padding and 2px radius — in the 添加功能 drawer, **区块A = 基本信息** and **区块B = 子功能与控制器** are separate white cards, each sitting **16px from the body's top/left/right edges, 16px apart from each other, and 16px above the bottom action bar** (the import drawer packs its dropzone, the `#F8FBFF` 注意事项 sub-block, and the template link into one white card). Editable controls inside the drawer keep the white input surface; disabled (non-editable) controls keep the neutral gray `Fill-2 #F2F3F5` fill — a gray *editable* control is a defect (same rule as Inputs). Title 16px/600/24 in the white header; the footer keeps 取消 (neutral outline) + 确定 (primary), right-aligned. Inline utility buttons inside a block (e.g. 添加子功能) hug their content width and align to the block's start edge — never stretch to the block width.

**[Project] Drawer form-control detail — 2026-10-26 user decision.** Apply the global editable/disabled surface contract above to every input and selector in a business drawer, including open, hover, focus, error, filled and empty states. Editable controls use `--app-surface` (white in light mode) with a 1px `--app-control-border` outline; focus uses the semantic primary border, and validation errors change the border rather than painting the field gray or red. A text input with a specified maximum length shows the live `0/n` counter **inside its right edge**, with enough room that placeholder or entered text does not overlap it; this drawer-specific placement overrides the generic Input example whose auxiliary counter sits below the field. Selectors without a character limit do not show a fabricated counter. When an editable value is empty, show a concise locale-aware action placeholder such as `请输入平台名称` / `请选择所属部门`; it remains a hint, not a substitute for the visible label or validation message. A preselected value is not empty and should render as its value instead. Disabled controls alone use the neutral gray `Fill-2` fill (`--color-fill-2` in the implemented theme) with the neutral control border, and cannot be edited; a page-level white-surface override must not win over the disabled style. Read-only facts in a detail drawer use `a-descriptions` instead of disguising an editable control as disabled. Verify computed fills, borders, placeholder/counter spacing, and both locales in the actual open drawer.

**[Project] 自定义编号 · 分段式编号条 — 2026-11-11 user decision.** When a business module has a user-configured numbering rule that contains a variable segment, the create form renders the number field as one horizontal **segmented code bar** instead of a plain input with a separate preview below it. Each fixed segment (固定字符 / 固定年份 / 流水号) is a static read-only chip: neutral `Fill-2` fill, 1px neutral control border, muted text, centered. The single 可变字符 segment is the only editable control: it keeps the white input surface with the **neutral 1px control border in its default state (no highlight)**; only when the input receives focus does the border switch to the semantic-primary (theme accent) with a double-weight outline, which is the highlighted state shown in the reference screenshot — a gray *editable* segment remains a defect under the surface contract above. The placeholder keeps a **12px inset on both sides** (the Arco wrapper padding) so it never touches the border; do not zero out the wrapper padding on this composite control. The configured separator sits between segments; segments are 32px tall, wrap on narrow screens and never overflow the drawer. The field label carries a red left-side `*` because the variable segment is mandatory; the editable input is also `aria-required`, and saving with an empty or non-alphanumeric value is blocked. Read-only chips are static text, never disabled inputs disguised as read-only facts. If a rule declares more than one variable segment, only the **first** stays editable; the rest mirror its value as read-only chips, so the bar never shows several inputs bound to the same model. As a compact composite control, this editable segment is the one drawer input that omits the live `0/n` counter described above; its 20-character limit is enforced on input only. Verify the computed chip/input fills, **default vs focused border color**, the placeholder inset from the border, star, separator text, placeholder in both locales, and the saved number in the actual open drawer.

**[Project] 问题库主抽屉宽度 — 2026-11-04 user decision.** The 问题库 page's single drawer (新建 / 复制 / 编辑 / 详情 share one `a-drawer`) uses the **Medium 800px** width (`min(800px, 100vw)`), replacing the earlier `min(1200px, 100vw)`. All four modes keep the same width — no per-mode resizing — and the 800px body still fits the 题目编排 table without horizontal overflow (734px table, two 257px text areas). Other drawers keep their own widths: 批量导入 560px, 来源详情 / 规则详情 / 新建任务 already 800px.

**[Project] Dismissal and motion.** Read-only drawers (detail, import upload, and later non-editing panels) close on mask click and Escape; editing drawers with unsaved input keep the confirm-and-discard guard and do not close on mask click. Every drawer slides out to the right with a **linear** timing function (Arco's `slide-right-drawer-leave-active` gets `transition-timing-function: linear`), matching the task-center drawer. This interaction is recorded here on 2026-10-25 by user decision; subsequent non-editing drawers adopt it by default. The 2026-11-06 user decision fixes its scope: the guard is limited to editing drawers and add/edit child routes, fires only on genuinely dirty forms, and never applies to centered dialogs (see Dialog).

### Batch import — 功能台账-批量导入 baseline [Project, 2026-10-26]

**[Project] Result panel naming — 2026-11-10 user decision.** The result drawer title is **导入导出**, with **导入数据** and **导出数据** tabs. Import and export feedback must use these current names.

The cached Figma source does not define a uniform batch-import workflow. Use the 功能台账 import drawer as the **project baseline** for later business-module imports, adapting field rules and file limits to each module's approved contract. This is a user-approved project pattern, not a Figma-measured component and not evidence that other modules already implement it.

- Keep the upload/drop target, the light-theme-color (`var(--app-primary-light-bg)`, `#DFF7F9`) 注意事项 sub-block in light mode, and the template-download command in one white drawer content block as specified above. In dark mode the notes use the dark theme color token (`#123B41`) with readable theme text. The upload target has a dashed semantic control border, centered folder icon, filename/instruction, and a **highlighted primary 上传文件 action**. Preserve the surrounding 16px inset, theme-aware surfaces, visible keyboard focus, and a fixed footer.
- Before selection, the instruction must say that users can **click to upload or drag a file here**. The target supports pointer, keyboard, and drag-and-drop. Once a file is selected, show its actual name **inside** the target, replace the primary action with **重新上传**, and do not duplicate the filename below the target. Long names wrap without clipping. A replacement clears the previous parsed result before validation; invalid files retain a visible error and a retry path. Disable duplicate submission while processing.
- Pre-generate a downloadable template when the import drawer opens so its download command can initiate the file synchronously from a user click. Show the link's loading state while preparing; on failure keep a retry path and give a specific error rather than claiming success. Name the file `当前业务模块导入模版.xlsx` without extra separators; for this module it is **`功能台账导入模版.xlsx`**. The workbook must round-trip through the same parser used by import.
- 功能台账注意事项第 5 条 reads: “子功能与控制器用竖线分隔，多个子功能换行输入，按顺序一一对应”. The existing workbook retains separate 子功能 and 控制器 columns: multiple values in each column use `|` followed by a line break, matched by position. Existing single-line pipe-separated workbooks remain accepted. Other modules must document their own row schema rather than copying this business-specific rule.
- **Submission → 导入导出 handoff [Project, 2026-10-29].** The fixed footer's 确定 (primary) submits the whole workbook with **partial-success semantics**: rows that match an existing business ID (e.g. 功能 ID) update that record; failed rows never block successful rows. While submitting, duplicate submission is disabled. On success the drawer closes, a success `Message` appears, the list reloads, and the **导入导出 opens on the 导入数据 tab** showing the created/updated/failed counts. When any row failed, an error workbook is attached to the task as **`当前业务模块_导入错误数据_<日期时间>.xlsx`** (功能台账: `功能台账_导入错误数据_YYYY-MM-DD_HHmmss.xlsx`, generated from the same `stampText(date, 'datetime')` helper used for the task stamp). The in-drawer immediate “下载错误数据” command must use the **same timestamped name** — an un-timestamped duplicate of the same artifact is a defect. On submit failure keep the drawer open with a retry path.

### Batch export — 导出确认弹窗 → 导入导出-导出数据 baseline [Project, 2026-10-29]

The cached Figma source does not define a uniform export workflow. The 功能台账 and 数据材料 export chain (确认弹窗 → 导入导出-导出数据) is the **project baseline** for business-module list exports. This is a user-approved project pattern, not a Figma-measured component; the chain is shared, while each module defines its own column set and file format.

- **Toolbar trigger.** The list toolbar places a labeled neutral button (`app-btn-neutral`, text 导出 with the download icon, text 导入 with the upload icon) in the right-hand action group beside the primary 新建 button — labeled text buttons, never icon-only (the icon-only rule covers filter/settings-class compact controls only).
- **Pre-condition.** Export always runs against the **currently applied filter result**, not the raw store. When the filtered result is empty, an info `Message` says so and no confirmation dialog opens.
- **Confirmation dialog.** Render the shared `ConfirmDialog` (`.app-confirm-dialog`, 560px / **fixed 250px height**, X top-right) per the Dialog section's unified confirmation rule: `icon="info"`, title 导出提示, and the two left-aligned lines passed as the `description` array — line 1 states the scope (“本次将导出所选时间范围内的所有数据” or the module's equivalent), line 2 reads “导出结果可以在「导入导出-导出数据」中查看和下载”. 取消 (neutral) stays enabled; 确认导出 (primary) shows loading while the task is being created, duplicate triggers are disabled, and `dismissible=false` prevents mask / X / Escape from confirming an in-flight export. Do not hand-roll a 456px `a-modal` for this step.
- **Confirm action.** Build the workbook from the applied result (export may append read-only columns such as 评估状态/启停/创建人/创建时间 beyond the import schema), then hand it to the **导入导出 as an export record**, show a success `Message`, and open 导入导出 on the 导出数据 tab. On failure keep the dialog open with a retry path.
- **File naming.** `当前业务模块_日期.扩展名` with no extra separators around the underscore — 功能台账 exports `功能台账_YYYY-MM-DD.xlsx` (Excel), 数据材料 exports `数据材料_YYYY-MM-DD.csv` (UTF-8 CSV). The date is the client-local calendar date, matching the timestamp helpers used by the import task stamps.

### Alert 警告

**Purpose [Stated].** A warning prompt presenting information that needs attention. It is a **non-floating, static** presentation: always visible, never auto-dismissing, and the user may click to close it.

**Measured geometry:**

| Property | Value |
|---|---|
| Height (title only) | **48px** |
| Height (title + description) | **78px** |
| Radius | **4px** |
| Padding | 20px horizontal, 13px vertical |
| Gap | 8px |

**Measured theme fills:**

| Theme | Fill |
|---|---|
| 提示 info | `#E6F3FF` |
| 成功 success | `#DCF5DE` |
| 警告 warning | `#FFF4E6` |
| 错误 error | `#FFECE8` |

**Types [Stated]:** 基础样式 · 可关闭的提示 (closable) · 有跳转的提示 (with link) · 有辅助性文字 (with description) · 有图标 (with icon).

**Variants:** `主题` = 提示/成功/警告/错误 · `图标` · `关闭` · `描述文案` · `操作` — yes/no · `自定义操作` = none / text (e.g. 不再提醒, 相关操作).

**[Derived]** Title 14px/600/22, description 14px/400/22. Alert carries **no shadow** — it is in-flow, not floating.

### Message 全局提示

**Purpose [Stated].** Lightweight **global** feedback on a user action.

**Measured geometry:** height **38px**, radius **4px**, fill `#FFFFFF`, padding 20px horizontal / 8px vertical, gap 8px, Level-3 shadow.

**Variants:** `theme 主题` = info 默认 / success 成功 / warning 警告 / wrong 错误 / **loading 等待**.

Unlike Alert, Message is a white floating surface with a semantic **icon** rather than a semantic background fill. The `loading` theme has no Alert equivalent and is the correct choice for "等待反馈" (awaiting response).

### Popconfirm 气泡确认框

**Purpose [Stated].** For secondary confirmation of actions **that will not cause serious consequences**. It pops over the clicked element. **It has no mask** — clicking outside closes it.

**Measured geometry:** width **334px fixed** (334px固定宽度), **20px fixed spacing** (20px固定间距), radius 4px, Level-2 shadow.

**Types [Stated]:** 基础对话框 (basic) and 有图标对话框 (with icon).

**[Derived]** Title 16px/600/24; description 14px/400/22; footer 取消 then 确定 using small buttons.

**Boundary.** Popconfirm is explicitly scoped to low-risk confirmation. A destructive or irreversible action requires a Dialog that names the target and its impact.

## Page patterns

### Login route — current project exception [Project]

The Figma Landing Page remains `进行中`; it is **not** a binding screen specification. `src/modules/auth/pages/LoginPage.vue` and `src/styles/global.css` contain the current split-panel layout and responsive breakpoints. Those implementation details are not repeated as global design rules here; review them against the completed Figma screen when one is issued.

The following values are **route-specific implementation deviations**, not Figma approvals and not defaults for business routes. Product/design must accept them as a recorded exception before release.

| Deviation | Spec value | Login value | Rationale |
|---|---|---|---|
| Input height | 32px | **52px** (48px ≤ 640px) | Two fields on an otherwise empty page; touch-comfortable target at the product's front door |
| Submit button height | 40px max (large) | **52px** (48px ≤ 640px) | Matches the input height so the column reads as one stack |
| Title size | Standalone hero scale (24px) | **28px** | Page is the whole screen, not a module within a shell |

All other applicable typography, color, validation, and focus rules remain in force. The local artwork is `src/assets/login-bg.svg`; any replacement must recheck the white headline's contrast on the **rendered image**, including its scrim and fallback fill. The auth store is still a **mock**, not a production identity provider: do not print credentials or present a mock login as real authorization. An independently accessible preview needs an identifiable non-production scope (see Product copy). Sign-in acceptance belongs to the auth module: verify keyboard order, retained values after failure, duplicate-submit prevention, redirect validation, and the 1100px/640px transitions before release.

### Composition [Project]

```text
Application shell (Pattern 2 — top + side)
  Header 56px            global identity / tenant / user actions
  Sider 205px            flush left and bottom, margin 0, height = viewport − 56px (sticky), one group expanded; collapses to a 64px icon rail
  Content 自适应         white page panel on the Fill-1 page canvas (whole-page background; the shell owns the 16px gutters); 16px between modules
    Toolbar / query controls / business content (no page title or subtitle)
    Scope / summary → query / filter → toolbar / bulk commands
    Table, detail, form, approval, configuration, or analysis
    Pagination / auxiliary state
```

- **List:** keep common conditions visible and house advanced conditions by usage; applied filters are removable and query semantics are declared in shareable URL parameters. Draft filter changes do not silently affect results. Group refresh, density, columns, and export. Distinguish first load, local refresh, no data, no match, failure, forbidden, and stale replies.
- **Detail / create / edit:** object name, ID, status, impact, and key actions stay visible. Use Descriptions for read-only facts. Dialog for few fields, Drawer to preserve context, a route for long, multi-step, or shareable work. Restore list filters, page, and necessary scroll position on return.
- **Approval / configuration:** show the original request, before/after values, attachments, risk, comment, history, and irreversible impact. Distinguish an immediate Switch from a staged Save. On a concurrent version conflict offer refresh / compare / retry; never silently overwrite.
- **Analysis:** show measurement definition, time range, refresh time, unit, and latency. Provide a visible data table when comparison or exact-value inspection is part of the requirement; otherwise use an accessible chart summary and keyboard-accessible values without adding an unsolicited "view chart data" control.

One page-level primary action. Use spacing before adding framed containers; never nest cards.

### Section list and child-route composition [Project, 2026-10-26]

For a two-Tab section workspace such as 基础信息, the **first-level route** follows the 问卷工作台 layout: the Tab strip sits above its content, and each Tab owns two sibling `div` regions, not nested cards. The first white region contains the query form (label/control units and actions follow Filter control surface rule); the second white region contains the list heading, actions, table/empty state, and pagination. Both use a 16px inset and the approved 12px inter-module gap (2026-11-05) on the Fill-1 page canvas. Changing Tabs switches the visible panel and keeps its filters tied to that panel. The first-level list does not need a breadcrumb because the shell navigation and Tab identify it.

The **new / edit / detail child route** follows the 新建问卷 composition: a separate shareable Vue route, a white sticky top operation band beneath the 56px shell header with the parent link/current context and return plus save/other permitted actions; below it, separate white content groups with 16px insets and 12px gaps (2026-11-05). Keep the object identifier, current status, and material context visible. For a read-only detail, use Descriptions rather than disabled input controls. A new/edit page protects unsaved changes on route exit and browser close; save errors retain user input, and preview must not masquerade as publication or confirmed backend data. This composition does not require a second application shell or apply to every business route.

### Rule version config composition [Project, 2026-11-01 user decision]

`规则配置 → 新建/编辑规则` uses one sticky operation band (breadcrumb on the left, 取消 + 保存草稿 / 提交发布 on the right) over two content groups: **基本信息**, then a single group titled **规则配置**. The three former Tabs (触发条件 / 需求条目 / 分区分配) are retired — the clause is the unit of work, so every clause card carries all of its own configuration.

```text
White group「规则配置」
  divider → 16px → two columns, 16px gap
    条目导航 240px, sticky (top 112px)        clause list (flex 1)
      章级 group banner (6.1 … 6.5 …)          clause card × n, 16px apart
                                                  ├ 触发规则   ── 高级表达式 switch (header, right)
                                                  ├ 需求条目   ── + 添加安全需求
                                                  ├ 测试方法   ── 只读回显（来自「测试方法」映射模块）
                                                  └ 分区分配   ── 分区表单 → 字段位
```

- **Spacing.** The 「规则配置」 header row sits **16px** above both the 条目导航 column and the first 章级 banner (`.cfg-columns` margin; no divider line since Round I); the same 16px governs clause cards inside a chapter. Do not add a second inner container — spacing, not framing, separates the groups.
- **Sub-block order is fixed** (触发规则 → 需求条目 → 测试方法 → 分区分配) and identical in every clause card, so the same field sits at the same position across 38 clauses. Each block header carries its own counter and actions; 高级表达式 is the only control in the 触发规则 header, aligned right.
- **Navigation active state** reports *the chapter currently being edited*, not a clicked link: the 章级 whose banner has passed a 120px threshold is highlighted (accent text, `arcoblue-1` fill, 600 weight, `aria-current`). It updates while scrolling, including during the sticky measurement pass. A chapter with zero configured clauses keeps its dimmed `0/n` badge and is never disabled.
- **Advanced expression has three states.** Empty input may open and close freely with no hint at all. Invalid input shows the readable-form line in danger red (「表达式语法错误，可读式待修正」) and refuses to close, with a warning toast naming the constraint; the text the user typed is preserved. Valid input shows the readable form in secondary text and closes normally. Never surface an error line for an untouched field.
- **Question-tree nesting is reversible (2026-11-04):** leaf rows inside a child group carry both 「设为子级」(merge into the adjacent neighbour, existing rule) and 「取消子级」 — the latter moves that question back into the parent level, inserted right after the group it leaves; when the group drops to a single child it auto-dissolves and floats that child up (existing collapse semantics). Top-level leaf rows never show 「取消子级」 (they are already at the highest level). The two actions are exact inverses and both re-serialize the expression immediately.
- **Group headers carry no divider and no asterisk** (Round I, 2026-11-02): the 基本信息 and 规则配置 title rows are plain heading rows — no bottom border, and the 规则配置 title does not repeat the required mark. Spacing below the header is the 16px column gap, nothing else. Required marks live on the field labels only.
- **Empty-state pattern**: when a sub-block is gated, the action button sits **left of the gate hint** inside one row — 触发规则 shows 【+ 添加问题】(disabled until 基本信息「问题库」has a source, hint 「请先在基本信息中选择「问题库」来源」); 需求条目 shows 【+ 添加安全需求】 left of 「请先在基本信息中选择「安全需求」来源」. Once the source is chosen the hint disappears and the original empty text (「未配置触发规则…」) returns.
- **规则配置 gating by 标准库 (2026-11-02):** the whole two-column block (条目导航 + clause cards) renders **only after** 基本信息「标准库」has a source — clause data comes from the standard library, so with no source the panel shows one centered `a-empty` (`.cfg-rules-empty`, 48px vertical padding) reading 「请先在基本信息中选择「标准库」来源」 and nothing else below the 基本信息 group.
- **Source changes ask for confirmation (2026-11-02):** the three source selects are controlled (`:model-value` + `@change`); changing one **while dependent data exists** opens a 420px confirm modal (「确认更换来源」/「确认更换」): 问题库 → clears every clause's trigger rules; 安全需求 → clears every clause's linked requirement items; 标准库 → clears all per-clause configuration (trigger rules, requirement items, section assignments; test methods re-echo from the new source via the existing watch). Cancel keeps the old value (the select never moved). With nothing configured the change applies directly with no modal.
- **Source gating is progressive.** 需求条目 stays disabled until 基本信息「安全需求」has a source; 分区分配 opens with an empty 分区表单 reading 「请选择分区表单」and 字段位 disabled until a form is chosen, and both selects are 500px wide; **测试方法 is no longer a basic-info field and no longer user-configured per clause** (2026-11-02 decision: clause ↔ Chapter-9 mapping is maintained on this platform in the standalone「测试方法」module). Per clause, the 测试方法 block is a **read-only echo**: before 基本信息「标准库」has a source it shows the secondary-text hint 「请先在基本信息中选择「标准库」来源」; once chosen, the mapping-module value per clause fills in automatically — no interaction, no reset/clear controls. A new rule therefore starts empty everywhere a user must choose.
- **Selected 安全需求 rows** show `SR-###` plus the source cell text, clamped to four lines. One spreadsheet cell in 需求数据·安全需求 is one entry (38 entries), not one row per sentence inside the cell — counts, dedupe, and the 64-item downstream identity all follow the cell, never the sentence.
- **添加需求条目弹窗 lists all 139 entries (2026-11-02 second decision):** the picker's data source is the **full** set of `RF-…-DEV/DOC<n>` entries parsed from the 需求筛选 sheet's column E (139 entries, all 38 clauses covered) — not just the current clause's entries — and the user picks freely for the triggering clause. **No source-note line is shown above the type switch** (2026-11-04 user decision: the 数据来源 text, its `sourceNote` i18n key and the `.srpicker-source` style were removed); the code column shows the full `RF-<条款>-DEV/DOC<n>` id (128px column) so entries stay distinguishable across clauses. Echo is by stored id: reopening the picker restores checked state and the 「已选择 {count} 条」 tally accumulates across both type tabs. The tally is rendered **once only, in the bottom pagination bar** — the duplicate count at the right end of the filter row was removed on 2026-11-04 from both this picker and the 选择问题弹窗; the remaining `<b>` carries `aria-live="polite"` so screen readers still announce changes. confirm rewrites the clause's list in candidate order (Device → Document) and preserves any legacy (non-RF) refs that have no candidate row.
- **已选行标识是完整 RF id (2026-11-02 fix):** `srRefOf` returns the **full id** (`RF-<条款>-DEV/DOC<n>`) for RF entries — never the group-local sequence (`DEV-1`) — because the selected-row list dedupes by code and group-local codes from different clauses would collapse cross-clause selections (50 picked → ~10 shown). Dedupe by code remains only for legacy `'条目号-摘要'` refs that merge into the same cell entry.

### Test-method mapping module [Project, 2026-11-02 user decision]

**「测试方法」is a standalone top-level menu** (sidebar order: 数据材料 → 测试方法 → 规则配置 — the raw material is maintained before the rules that consume it), route `/rules/test-methods`, one page, no tabs. It maintains the 38-clause ↔ Chapter-9 test-method mapping that used to live in 天枢's 标准库 but belongs to this platform, sourced from the GB 44464 standard document (same values as the 需求数据 workbook's 「第9章段落」+「测试方法」columns).

- **Table**: 原生 table 风格 a-table (`.tm-table`), five columns — 条款号 (110px, tabular) / 条款主题 (300px) / 第9章 (96px, reverse-looked-up from the method options) / 测试方法 (440px, inline `a-select allow-search`, 400px wide) / 操作 (120px, 「恢复默认」a-link). Shared `app-pagination` with the five pageSize tiers [10, 20, 50, 100, 200]; total count reads 「共 38 条条款」.
- **Header** shows the note sentence (mapping basis + effective-scope explanation) and 「{count} 条已调整」 only when count > 0 (`v-if`, so 0 renders nothing), plus 「全部恢复默认」 with a 420px confirm modal.
- **Row semantics**: each row's select lists all 38 method options; saving fires a success toast and persists to `test-method-mappings:v1` (full 38-key record; invalid values are rejected and re-rendered from storage). 「恢复默认」 is **disabled while the row equals the standard default**; after a row is adjusted it re-enables and restores that one clause. 「全部恢复默认」 persists the full default mapping.
- **Effective scope**: edits take effect for rules created *afterwards*. Saved rules keep a snapshot (`RuleVersion.testMethods`) captured at save time and are never overwritten by later mapping edits — the rule-config page refills its echo from the snapshot on edit/copy and from the current mapping only on a brand-new rule once 基本信息「标准库」is chosen. The 规则列表 drops its 测试方法 column and filter; the rule detail keeps the 测试方法 column in the clause table (snapshot-first, static fallback) but its 基本信息 has no 测试方法 row.

## Charts [Project]

**Library: ECharts [Project implementation].** `echarts` is installed and used by the current dashboard. Its approval history is not recorded in the Figma cache; keep this choice for existing charts, and review any new chart requirements with product/design. Use explicit per-chart imports (`echarts/core` plus the needed charts, components, and the canvas renderer) rather than the full bundle; register the Metritag theme once in the chart module. Do not add a second charting library for one feature.

The Figma source contains **no chart specification** — everything here is a project decision built on the Metritag palette.

### Metric card anatomy [Project]

The KPI card on the overview page has four fixed slots. Sizes come from the type scale and the icon rendered-size table; nothing on the card is off-scale.

| Slot | Spec |
|---|---|
| Metric label (指标字段) | **14/600/22**, `Text-2` — deliberately grey so the value owns the card's emphasis |
| Info icon after the label | **16px**, `Text-3`, `cursor: help`, wrapped in a tooltip that carries the field description; the icon is decoration for the affordance, the tooltip is the content |
| Metric value | **24/600/32**, `Text-1`, tabular numerals, single line |
| Change indicator | **12/400/20**, `Text-2`, sits **10px** below the value; the directional arrow uses 语义色 with the Chinese market mapping — up = `Danger` red, down = `Success` green — and never carries the meaning alone |
| Trend graphic (sparkline / mini-bars / progress) | `min(45%, 160px)` wide, **absolutely positioned at the card's bottom-right content inset** — its bottom edge is flush with the change text's bottom edge, and it never contributes to the card's height |

**Vertical rhythm.** The card height is content-driven (自适应) — there is no fixed min-height; equal heights inside a row come from grid stretch, not from a reserved size. The change text sits **10px** below the value as a fixed distance — not a floating one; 10px is a user-approved exception to the 4px increment rule (Spacing · Size increment), scoped to this card and not reusable as a generic spacing value. The label-to-value distance stays 8px. The trend graphic is out of the flow: it is pinned to the card's bottom-right content inset, so its bottom edge stays flush with the change text's bottom edge regardless of card height, and it must never be stretched to fill space — keep the sparkline's aspect ratio and let the card height be whatever the text stack needs. On ≤480px viewports the trend returns to normal flow and spans the full card width below the change text. Keep values short: the value is `nowrap` and the trend occupies the right 45% of the card, so an overlong value can run under the trend; truncate or shorten the data rather than wrapping.

The label stays grey even though it is 600-weight: weight signals structure, colour signals emphasis, and on this card emphasis belongs to the value. Do not promote the label to `Text-1` or enlarge it to 16px — that competes with the value and flattens the card's hierarchy.

### Metric-card mini trends [Project]

The small, read-only trend inside a KPI card is a compact visual cue, not a full ECharts plot. A data-driven SVG is appropriate here; the full-size analytical chart still uses ECharts. For the line variant, the current project overview reference (237×83, ratio approximately 2.86:1) uses a **smooth cubic curve** rather than a straight-segment polyline, closing the area to the bottom baseline. Its light area is a vertical `Theme-6` 18%-opacity to `Theme-1` 22%-opacity gradient with a 2.5px rounded `Theme-6` stroke. This is a **project example, not a Figma-approved chart rule**; review it with the module owner before generalizing. Dark mode follows corresponding tokens rather than a hardcoded light fill. Each SVG on a page needs its own gradient ID.

Keep the aspect ratio when the card resizes; do not stretch the path or clip peaks. The line and shaded area are secondary to the metric value and must not introduce axes, point markers, controls, or a data-detail panel. Preserve a concise accessible name for the trend, and do not use red/green area colors as an implicit success/failure signal. Bar and progress miniatures retain their respective established forms.

### Series palette

Eight categorical colors, ordered. Each reaches at least 3:1 against its canvas (graphical-object threshold) and is distinguishable from its neighbours. Assign **by position in the series order**, not by meaning. **2026-11-05:** series 1 light is re-anchored to the teal ramp's contrast-safe `Theme-8 #0A6E7C` (5.94:1 on white) because the previous `#005BF5` slot carried the superseded blue primary; the dark slot stays `#6FA5FF` until charts ship in dark mode.

| # | Light | Dark |
|---|---|---|
| 1 | `#0A6E7C` | `#6FA5FF` |
| 2 | `#0E7C8A` | `#1DE4F3` |
| 3 | `#C25400` | `#FF9A4D` |
| 4 | `#8B5CF6` | `#B18AFF` |
| 5 | `#00913A` | `#3FD15F` |
| 6 | `#E5308C` | `#FF6FB0` |
| 7 | `#7A4E00` | `#D9A441` |
| 8 | `#5B7083` | `#A8B2C0` |

Light-mode series 2, 3, and 5 are **deliberately darker** than the corresponding brand tokens (`Subsidiary-6`, `Warn-6`, `Success-6`), which sit at 1.56–2.94:1 on white and are illegible as thin chart marks. Do not "restore" them to the brand values.

**Semantic separation rule.** Series colors describe categories, not outcomes. A categorical series must never be read as success/warning/error. When a chart genuinely encodes outcome — a pass/fail bar, an error-rate line — use the functional tokens explicitly and label them; do not leave it to palette position.

### Sequential and diverging

**2026-11-05 primary update:** both ramps are re-anchored on the teal Theme ramp.

- **Sequential** (one measure, low→high): interpolate `#DFF7F9 → #0DB9C6 → #0A6E7C` in light; `#123B41 → #2BD0DC → #B8F4F8` in dark.
- **Diverging** (a meaningful midpoint): `#D40000 → #F2F3F5 → #0DB9C6` in light; `#FF6A5E → #3C4049 → #2BD0DC` in dark. Anchor the neutral at the real zero or baseline, never at the data midpoint.

### Chart typography and chrome

| Element | Value |
|---|---|
| Chart title | 16px/600/24, `Text-6` |
| Axis label, legend, tooltip body | 12px/400/20, `Text-4` |
| Value label on a mark | 12px/400/20, `Text-5` |
| Axis line and ticks | `Border-3 #DDDDDD` (dark: `--mt-d-border-3`) |
| Grid line | `Border-1 #EEEEEE` (dark: `--mt-d-border-1`) |
| Tooltip surface | `#FFFFFF`, radius 4px, Level-2 shadow (dark: `--mt-d-bg-popup`) |

Grid lines are decorative and exempt from 3:1; axis lines that carry meaning are not.

### Required metadata [Project]

Every production chart declares, visibly or one interaction away: **metric definition · time window · unit · baseline or target · last refresh time · data latency · how missing and outlier values are handled · drill-down destination**. A chart without a stated window and unit is not shippable.

### Accessibility

- Every chart needs a concise accessible summary and keyboard-reachable values. Provide a visible, keyboard-reachable table of the same data when the requirement calls for chart data detail, precise comparison, or export; do not add a data-detail toggle by default to a visual overview.
- Do not encode a distinction by color alone: pair color with shape, dash pattern, direct labels, or ordering.
- Keep series color assignment **stable across renders and filters** so a series does not change color when the data reshapes.
- Tooltips must be reachable by keyboard focus, not hover only.
- For bar/line charts, hovering a mark or its category axis reveals a tooltip with the category and numeric value(s), including all series at that category. Keep the tooltip within the chart's visible bounds and verify mouse and keyboard paths.
- Resize the ECharts instance with its container (including full-screen and panel-width changes); do not stretch a fixed-viewBox chart or scale its canvas with CSS. Axis text and circular point symbols must retain their native proportions at each supported width.
- Respect `prefers-reduced-motion`: disable the initial animation and transitions when set.

### Implementation

The current registration lives in `src/design/charts/theme.ts`; the categorical palette and typography tables above are the design contract, not a second implementation file. Load chart code only on routes that need it, resize with the container, dispose on unmount, and verify theme changes and large datasets with real chart views. Do not copy an example theme from this document into a competing registration.

## Imagery [Project]

Enterprise imagery shows a real workflow, state, or data relationship — never decoration. Empty states pair a restrained illustration with a recovery action, using the eight sanctioned Empty states. For chart metadata, semantic colors, and accessible values, use the single contract under Charts; do not maintain another copy here. Upload and preview define type, size, progress, failure, retry, access, and removal. No decorative hero images, gradients, or ornamental 3D.

## Responsive and scroll ownership

- The cached Figma source recommends **1280px to 1920px** design canvases with **1440px** as reference. The approved Figure 1 / Figure 2 update supersedes its fixed-content example: **both content regions are fluid with 16px outer margins**, including above 1920px unless a new maximum width is explicitly approved.
- The supported browser minimum is **open DS-04**, not inferred from the 1280px artboard. Product and QA must record per-route support (login vs business routes), input method, minimum viewport, and the outcome below it. A narrow login fallback does not promise full mobile business workflows.
- The old Figma menu component includes a **64px collapsed variant only for regular navigation with icons**; the 205px page shell originally named no collapsed width or breakpoint. That gap is now closed by **Sidebar collapse** under the page layout patterns: navigation sidebars collapse 205px ⇄ 64px, remember the choice per shell, and fall back to the stacked layout below 901px. Stack fields or move secondary actions only when the approved narrow layout remains functional. A wide data table may scroll in its own region while identity and key actions remain reachable.
- Define **one** vertical scroll owner per region. The Drawer's fixed footer and the Dialog's fixed 24px header gap must reserve their own space; a sticky footer must not overlay the last field.
- Test the Figma reference widths (1280/1440/1920px) and the approved browser floor separately. If claiming WCAG 2.2 AA, include 400% zoom / 320 CSS px equivalent reflow checks on form, navigation, and overlays; document justified two-dimensional scrolling only for content such as wide tables, not the whole page. Prevent clipping, overlap, and jumps at 100%, 200%, and the required zoomed state.

**[Project] Sticky rail nav (条目导航 / 分组导航, 2026-11-01).** Long clause or item lists carry a left rail nav that (a) starts flush with the top of the adjacent content column and (b) sticks below the module top bar once the page scrolls onto it — never occluded, never clipped away. Two implementation constraints apply:

- The rail is `position: sticky` with `top` = top-bar height + 8px gap, `align-self: flex-start` inside a `display:flex; align-items:stretch` row, and a solid `--app-surface` background plus `z-index` so list content scrolls behind it rather than through it.
- Arco tabs kill sticky at three nested wrappers: `.arco-tabs` (`overflow:hidden; position:relative`), `.arco-tabs-content`, and `.arco-tabs-content-item-active`. A nav inside a tabbed panel needs `overflow: visible` restored on all three through `:deep()`. Inactive panes keep their own `height:0; overflow:hidden` clipping, so nothing bleeds through. The untabbed step page already relies on this nav, which is why its sticky rail worked before the tabbed config page did.
- Anchor jumps use `scroll-margin-top` equal to the same offset, so a jumped-to block is not hidden behind the bar.

## Accessibility and interaction states [Project]

Target WCAG 2.2 AA, subject to the project's accessibility owners: normal text at least 4.5:1, large text and meaningful non-text boundaries at least 3:1, with manual checks beyond automation.

### Measured contrast and resolutions [Project]

The ratios below describe selected Figma light-mode pairings. Passing ratios do not certify a whole page; failing ratios are **unresolved release issues**, except where the element is genuinely inactive and the applicable criterion exempts it. Keep the measured Figma colors in the source tables, and record any accessibility-driven implementation change as a project/design decision rather than attributing it to Figma.

**Passing — use freely**

| Pairing | Ratio |
|---|---|
| `Text-4 #666666` on `#FFFFFF` | 5.74:1 |
| `Text-5 #333333` on `#FFFFFF` | 12.63:1 |
| `Text-6 #1A1C20` on `#FFFFFF` | 17.06:1 |
| `Text-4 #666666` on page `#F7F8FA` | 5.40:1 |
| `Theme-6 #0DB9C6` on `#FFFFFF` | 2.39:1 — moved to the failing table below (2026-11-05 primary update) |
| `Error #D40000` on `#FFFFFF` | 5.53:1 |
| White on primary-active `#0044CB` | 7.81:1 |
| White on danger `#D40000` | 5.53:1 |

**Failing or conditional — do not infer compliance from the default state**

| Pairing | Ratio | Resolution |
|---|---|---|
| `Theme-6 #0DB9C6` on `#FFFFFF` | 2.39:1 | **2026-11-05 primary update.** Teal as text/graphic on white fails AA. Use `Theme-7 #0A9AAB` (3.37:1, AA large only) or `Theme-8 #0A6E7C` (5.94:1, AA) for teal text on white. See the Contrast note under Theme color. |
| White on `Theme-6 #0DB9C6` | 2.39:1 | **2026-11-05 primary update.** White on solid teal fails AA. On solid `Theme-6` fills use dark-teal `#0A3A40` (5.18:1). Components rendered via the Arco adapter follow the mapped ramp; verify rendered buttons after the adapter change. |
| `Text-3 #999999` on `#FFFFFF` | 2.85:1 | Figma records this color for placeholder/hint text, but a visible label does **not** exempt readable placeholder text from contrast. When the placeholder contains an example or instruction, use a tested text color such as `Text-4` and keep the visible label. Reserve the source value for genuinely non-informational ornament, not functional copy. |
| `Text-3 #999999` on `#F7F8FA` | 2.68:1 | Same issue on the page canvas; use a tested stronger text role for any readable content. |
| `Text-2 #CCCCCC` on `#FFFFFF` | 1.61:1 | **Disabled text only.** WCAG exempts disabled controls, so this is compliant — but disabled state must additionally be conveyed by `aria-disabled`/`disabled` and by non-color means. |
| `Success #00B42A` as text/icon on `#FFFFFF` | 2.78:1 | Fails ordinary text and a meaningful non-text icon/dot at the project's 3:1 target. Use a tested darker semantic role for meaning-bearing marks; a pale `light` tag with dark text is an alternative. Do not assume a green icon becomes compliant merely because words appear beside it. |
| `Warn #FF6B00` as text/icon on `#FFFFFF` | 2.86:1 | Same issue for warning text and meaningful marks. Choose a tested contrast-safe role or pair a sufficiently contrasting shape and label; check the actual surface. |
| White on primary-hover `#2D7EF7` | 3.86:1 | Superseded pairing (blue era). For the 2026-11-05 teal ramp, solid-fill hover uses `Theme-5 #22C4CF` with dark-teal `#0A3A40` text per the Theme color Contrast note; do not claim any state passes without computing the rendered pair. |
| White on emphasize-disabled `#B8DBFD` / `#F6BCB3` | 1.44:1 / 1.65:1 | Disabled exemption applies. **Mandatory companion rule:** a disabled button must carry the `disabled` attribute so assistive technology announces it, and where the reason is not obvious, a tooltip or adjacent text must state it. Never rely on the pale fill alone. |
| `Border-2 #FFE696` radio/checkbox accent | — | **Never the sole selection signal.** Selection must also be carried by the control's checked glyph and by the accessible checked state. |

**Standing rules**
- Status is never conveyed by color alone — every semantic color pairs with text, an icon, or a glyph.
- A functional color at `-6` is a palette role, not automatic permission to use it for text or a meaning-bearing icon; test each foreground/background pairing. `Error #D40000` passes against white; the 2026-11-05 `Theme-6 #0DB9C6` does **not** (2.39:1) — see the Theme color Contrast note for the sanctioned darker teal text roles.
- When a required pairing is not listed here, compute it before shipping; do not assume.

**Keyboard focus [Project, not specified by the Figma state matrices].** Preserve the source's selected, hover, and active states, but add a distinct `:focus-visible` treatment for keyboard operation. Start with a 2px outline and 2px offset using a semantic focus token; resolve its color per adjacent surface and theme so the indicator remains visible at the 3:1 non-text target. Do not rely on a hover fill, placeholder color, or box shadow alone. Test focus on buttons, inputs, menus, table actions, pagination, and overlays at normal and zoomed/reflow widths before calling the treatment accepted.

**Pointer targets [Project].** Keep the Figma visual size (for example, a 20px small Tag), but verify a 24×24 CSS px interactive target or an applicable spacing/equivalent-target exception for close icons, pagination arrows, compact row actions, and other pointer controls. The hit area is not necessarily the artwork size. Confirm that enlargement does not overlap adjacent controls or obstruct keyboard focus.

| State | Visible treatment | Recovery / acceptance |
|---|---|---|
| Initial | Title, scope, defaults, permission coherent | Direct load and reload restore a valid state |
| Hover / focus | Visible mouse and keyboard affordance | Predictable Tab order; help does not cover controls |
| Disabled / read-only | Distinct semantics and a discoverable reason | Not grey alone |
| Initial loading / partial refresh | Stable skeleton or local spinner | No large jump; a stale reply cannot win |
| Empty / no match | One of the eight sanctioned Empty states | Create or clear filters; an error is not an empty |
| Field error / request error | Local cause with the draft retained | Focus the first error; retry where safe; distinguish 401/403/404/5xx |
| Forbidden | 暂无权限, separate from no data | UI and API both deny, with a return or request-access path |
| Submitting / success | Loading, no duplicate submit, verified result | Announce success only after the server confirms |
| Cancel / close | Dirty-state decision | Mask, Escape, X, tab, and route share one policy |
| Long job | Progress, ID, result, retry | Result traceable after reload |

Give every input a visible label or programmatic name; associate help and error text; give icon-only buttons an action name; never make status color-only. Keyboard paths cover menu, search, pagination, date, bulk actions, and overlays; focus enters an overlay and returns to its trigger. Charts have text or table alternatives. Respect reduced-motion preferences for non-essential motion.

## Vue/Arco integration [Project]

`AGENTS.md` owns the Vue stack, bootstrapping, routing, domain state, request behaviour, and verification workflow. The current implementation lives in `src/app/providers.ts`, `src/design/tokens.css`, and `src/styles/global.css`; do not treat an older snippet in a design document as executable project setup. Map Metritag primitives to Arco once through the semantic layer in Colors, then inspect computed styles rather than assuming the override worked. Do not mutate internal component-service properties as a theme configuration shortcut.

Design review of the adapter covers medium controls (32px), 2px/4px radii, focus visibility, table header fill, disabled states, overlay shadows, and menu selection. A typecheck or build cannot establish those visual results. Use the domain PRD for field dictionaries, units, validation, permissions, time zone, and business-state rules.

### Component selection

| Task | Arco Vue choice | Boundary |
|---|---|---|
| Structured comparison and bulk operations | `a-table` | `a-list` for unstructured entries; `a-descriptions` for one read-only object |
| Input and validation | `a-form` + `a-form-item` | No hand-built label/error semantics |
| Short blocking choice | `a-modal` → Dialog spec | Drawer or route for long content |
| Low-risk inline confirmation | `a-popconfirm` → Popconfirm spec | Dialog for destructive or irreversible actions |
| Context-preserving detail/edit | `a-drawer` → Drawer spec (500/800/1000px) | Route for deep navigation or long workflows |
| Exclusive / multiple choice | `a-radio-group` / `a-checkbox-group` | Searchable `a-select` for large option sets |
| Immediate binary effect | `a-switch` | Staged form state for settings applied on Save |
| Hierarchy | `a-tree`, `a-tree-select`, `a-cascader` | Never invent hierarchy where none exists |
| Dates and time | `a-date-picker`, `a-time-picker` | Agree on precision and time zones first |
| Short help | `a-tooltip` → Tooltip spec (text only) | `a-popover` for rich help; critical rules stay visible |
| Transient / persistent / actionable feedback | `Message` / `a-alert` / `Notification` | Do not triple-report one failure |
| Data visualization | ECharts with the `metritag` theme | Accessible summary and keyboard values; add a visible table when data detail is required |

Implementation foundation: Metritag semantic tokens → Arco. Composition reuse order: existing shared composition → existing domain component → composition of adapted Arco primitives → approved deep customization. Require multiple use cases and a stable API before promoting a wrapper. No copied library source, `node_modules` patch, or broad `.arco-*` override.

**Unspecified component fallback [Project].** Figma has named pages and variants for the components inventoried under Source coverage, not every Arco control or every keyboard/async state. For an unlisted component or state, first use the nearest Metritag semantic token and the existing project pattern; retain Arco's accessible mechanics and default geometry only where no Metritag rule conflicts. Record the missing case and seek a design decision before promoting a new global token or claiming it is a Figma value. The `:focus-visible` contract above is such a project fallback, not a measured Figma variant.

### Form handoff [Project]

The module PRD owns each field's label, order, unit, defaults, required/read-only/permission state, null/empty semantics, validation and error copy, masking, and API/export meaning. Design specifies how labels, help, errors, loading, and disabled states appear; `AGENTS.md` owns Vue/Arco binding and request mechanics. The handoff must cover first-error focus, retained values after failure, duplicate-submit prevention, and unsaved changes across overlays and routes. A typed mock submission must not be announced as a backend-confirmed save. Avoid copying illustrative form code from a design specification into production.

**[Project] Label binding (2026-11-06).** The PRD supplies the colon-free field name; the trailing colon is applied by the shared `.app-field-label` / `.app-detail-label` classes and `--app-field-colon`. An `a-form-item` uses a `#label` slot carrying `.app-field-label`, never Arco's `colon` prop. Every new field surface — drawer, dialog, filter, sign-in, or detail row — must pick up the shared class rather than a page-local punctuation rule; the release checklist verifies computed `::after` content in both locales.

### Operational boundary

`AGENTS.md` owns authorization, tenant isolation, request cancellation/idempotency, data mocking, code quality, and performance testing. This document owns the **visible** distinction among forbidden (`暂无权限`), empty (`暂无数据`), no-match, loading, failure, and confirmed success. Backend authorization remains final; visual hiding is not access control. Product copy defines how independently accessible previews disclose mock behaviour.

## Project defaults [Project]

The Figma source does not settle these product choices. **Pending** is not an approval or a universal default; apply the scope and gate in the first section before treating a row as a release promise.

| Decision | Default | Note |
|---|---|---|
| Minimum supported browser width | **Pending DS-04** | Figma states a **1280px minimum design canvas**, not a browser-support contract; approve the floor per route and verify zoom/reflow separately. |
| Maximum content growth for Figures 1/2 | **Fluid; no fixed cap specified** | The 2026-10-22 layout update supersedes the older cached 1920px content-freeze rule for these two page shells. |
| Mobile business routes | **Not committed** | The login route has a narrow-width fallback, but that is not a mobile support promise for tables, drawers, bulk actions, or long forms. Approve their strategy separately. |
| RTL | **Not supported** | No RTL locale is planned. Revisit only with an explicit requirement. |
| Multi-tenant | **Product/PRD decision pending** | If tenants exist, switching must invalidate prior views, selections, caches, and responses; do not infer tenancy from a design mockup. |
| Accessibility target | **WCAG 2.2 AA project goal** | DS-03 and the DS-04 reflow scope must close; failing Figma pairings are not accepted exceptions. |
| Theme | **Light default; dark implemented as a project extension** | Dark production scope is pending DS-05; system-following behaviour is not implemented. |
| Charting | **ECharts in the current dashboard** | Registered `metritag` / `metritag-dark` themes; not a Figma-specified library. |
| Density | **Default** | Per the measured 32px control height. A dense variant needs approval. |
| Time zone | **Declare explicitly per project** | Storage, transport, and display zones; range endpoints; DST. Not inferable. |

### Status roles and domain ownership [Project]

The design system owns how `success / warning / danger / neutral / info` **look** in light and dark themes. A module PRD and its domain code own each business enum, visible Chinese label, allowed transition, and role mapping. Do not force unrelated domains into one global enum dictionary or invent a display label from a color. `src/design/status.ts` currently contains four colour-named sample entries; it is not evidence that every product state has an approved mapping.

A legible text label is already a non-colour cue. Add an icon or shape when it helps scanning, distinguishes similar labels, or meets a specific accessibility need; do not require one for every Tag. Choose a contrast-safe variant for the actual surface: `Success #00B42A` and `Warn #FF6B00` fail as text on white, so use a tested pale-fill/dark-text or darker semantic treatment. An unmapped status must not become a blank cell: show a safe neutral fallback and expose the unmapped code to diagnostics without leaking sensitive values to end users.

Product owns field dictionaries, state machines, permissions, and the status-to-label mapping. Design owns role-to-appearance. Frontend owns the implementation and verifies the mapping with each domain's representative states.

## Acceptance

### Page specification template

Record per route: route name · Figma node/variant and source version · applicable layout pattern · product-owned field/state dictionary · design tokens and any approved deviation · measured Figma states versus project/PRD states · approved browser/theme scope · keyboard and pointer path · mock or API provenance · open DS gate IDs · evidence and acceptance owner. `AGENTS.md` separately specifies route, permission, request, and build checks.

### Release checklist

- [ ] Each applied rule links to a Figma node/version, an approved project extension, or a named PRD requirement; any source gap is scoped under DS-01.
- [ ] The semantic token table matches the computed styles on the affected route in light and, where supported, dark; DS-02 is closed. No page-local HEX silently overrides a shared role.
- [ ] Figma-measured geometry and states are checked separately from keyboard focus, loading, validation, empty, and failure states added by project/PRD rules. Exceptions name their owner and evidence.
- [ ] For Figure 1 / Figure 2 page shells, verify a 56px full-width header, fluid content with **16px computed outer margins on all four sides** (header ↔ content, sidebar/left edge ↔ content, content ↔ right edge, content ↔ page bottom), and, for Figure 2, a flush-left 205px sidebar with **12px between content modules**. Both shells must read `--app-page-gutter` for the 16px gutter; a page root may not add its own outer margin. Do not use the old fixed 1200px column, a 16px module gap, or the 240px navigation-component sample as the shell width.
- [ ] On every business route, verify each pair of adjacent sibling blocks inside the content region measures **12px** with `getComputedStyle` / `getBoundingClientRect` — including vertical stacks, horizontal siblings such as the 项目归档 two-column layout, detail/edit child routes, the design-system example page and the message-center header → list gap — while the 16px panel inset and in-panel spacing stay unchanged. Repeat at 1440 / 1280 / 375px, in light and dark, `zh-CN` and `en-US`, with the 205px and 64px sidebar states and the ≤900px stacked fallback (16px header → menu → content and 16px left / right / bottom). Headless DOM assertions only — no screenshots (2026-11-12 decision). The 项目归档 directory ↔ content pair is the approved `0px` exception (2026-11-13 decision); all other sibling pairs stay at 12px.
- [ ] For a collapsible Pattern 2 sidebar, verify the 205px/64px states and their transition, the toggle's `aria-expanded` and 收起侧栏/展开侧栏 name, the icon-plus-tooltip fallback for hidden labels, the remembered state after refresh and direct child-route entry, and the ≤900px stacked fallback with the toggle hidden.
- [ ] For a Pattern 2 sidebar, measure the bottom edge against the viewport bottom in both the expanded and collapsed states, at the top of the page and after scrolling a long page to the end: the gap must be 0 in every case, and the sidebar must stay pinned rather than scroll away with the content.
- [ ] For a Pattern 2 sidebar with groups, verify at most one group is expanded at a time: initial load opens only the active page's group, activating a second group collapses the first, re-activating the open group closes it, and navigating into a child of a collapsed group moves the expansion there. Check `aria-expanded` on the group trigger matches what is visible.
- [ ] Every Pattern 2 sidebar comes from the shared sidebar component — a shell that hand-rolls its own is a defect, not a variant. Compare two shells side by side and confirm identical row height (40px), left inset (20px), icon (16px) and text (14px/22px) sizes, hover/active colours, 205/64px widths, 44px toggle and a 0px bottom gap; an action item (no route, no children) renders as a button that never takes the active state.
- [ ] Typography roles are not mixed: 16px/600/24 for every card, dialog, drawer, and section title, and no 20px panel title; panel content sits at a 16px inset with 12px below its title block. Shell business pages render no page title and no subtitle in the content area (2026-10-24 decision).
- [ ] Every field name in add/edit drawers, dialogs, filter strips, filter popovers, the sign-in form, and read-only detail rows ends with exactly one colon: computed `::after` is `：` in `zh-CN` and `:` in `en-US`, no i18n label value or Arco `colon` prop supplies a second one, and titles / column headers / button text / checkbox options carry none (2026-11-06 decision).
- [ ] Hovering any tab changes **only its text colour**: computed `background-color` of the tab cell and of `.arco-tabs-tab-title::before` (line type) matches the normal state with no `Fill-2` patch, `color` becomes `--primary-5`, `font-weight` stays 400, and an active tab hovered directly keeps `--primary-6` / 500 plus its ink bar (2026-11-12 decision). Verify normal / hover-inactive / hover-active / post-switch on 模板配置, 车型详情, 测试记录详情 and 导入导出抽屉 in light and dark, `zh-CN` and `en-US`; no page-local tab hover override survives.
- [ ] Each of the six first-level sidebar modules has a **distinct** Arco glyph matched to its business object (工作台 `dashboard` / 任务管理 `calendar` / 任务执行 `check-square` / 项目归档 `archive` / 模版管理 `layout` / 标签管理 `tags`); no generic `folder` glyph survives, both locales render the same mapping, the 64px collapsed rail still shows one 16px icon per entry, and the active icon inherits the primary `currentColor` in light and dark (2026-11-12 decision).
- [ ] Dismissal follows the 2026-11-06 surface rule: centered add/edit dialogs close immediately on `X` / 取消 / Escape with no second discard prompt even when dirty; editing drawers and add/edit child routes show the confirm-and-discard dialog only when the form is actually dirty, and stay open when the user chooses to keep editing. Verify both dirty and untouched paths on each affected surface.
- [ ] Both 编辑 / 添加子部门 dialogs show 取消 (neutral outline) + **确定** in a footer block with a computed `border-top`, measured `min-height: 320px`, 24px / 24px / 16px+20px header-content-footer spacing, and a footer pinned to the bottom; adding content grows the dialog instead of clipping it. 保存 remains only on the add-user drawer (2026-11-06 decision).
- [ ] Every 二次确认 / 提示 / 告警 dialog comes from `ConfirmDialog` with the four-part format: 20px outlined status icon (orange `#FF6B00` for question/info/warning), 16px/600/24 title, optional 14px `#999999` subtitle, right-aligned 取消 (neutral) + 确定 (theme primary) or a single 我知道了. Computed shell is 560px wide, **exactly 250px tall with no `min-height` escape** (2026-11-08 decision), header 48px with **no** `border-bottom` and the X **pinned to the top-right corner** (20px from right / 8px from top), body `24px 20px` vertically centered and scrollable, footer `16px 20px 20px` with **no** `border-top`, 24px icon-to-text gap and 12px button gap. The state icon's computed vertical centre equals the title's (Δ < 1px) with 0, 1 and 2 subtitle lines, and the subtitle keeps the title's left edge (2026-11-08 decision). Verify no inline `a-modal` confirmation, in-body `<footer>`, `Modal.confirm()`, or red danger primary button survives; confirm `dismissible=false` freezes an in-flight export and a failed operation retains visible=true with a retry path (2026-11-06 and 2026-11-08 decisions).
- [ ] Affected text, meaningful icons/borders, hover, focus, placeholder, and status states meet the accessibility target on their actual surfaces; DS-03 is closed. Small close/arrow/action targets meet the pointer-target rule or document its exception.
- [ ] The approved DS-04 route matrix is tested at its browser floor and the 1280/1440/1920px design references; claimed AA reflow is checked at 400% zoom / 320 CSS px equivalent. Table-only horizontal scrolling is scoped, and focused controls are not obscured by overlays or sticky footers.
- [ ] If dark mode is in scope, DS-05 is closed with state, contrast, overlay, chart, and first-paint evidence. Light-mode approval does not approve dark.
- [ ] Empty, no-match, failure, forbidden, and confirmed success are visually distinct with usable recovery; independently accessible mock previews do not masquerade as live backends.
- [ ] Charts, when present, expose metric, window, unit, refresh/latency, stable series meaning, keyboard-reachable values, and a visible table when precise comparison is required.
- [ ] Store desktop/narrow screenshots, measured contrast and hit-area results, keyboard path, open/closed gate IDs, reviewer, and date. Engineering route/build/API tests follow `AGENTS.md`; passing them alone is not design acceptance.

## Design change control [Project]

1. **Acquire** a complete Figma revision and record its file key, version, modified date, page/node IDs, and export completeness. A changed page title or a cached screenshot alone is not a token diff.
2. **Classify** each difference as Figma-stated, measured/derived, project extension, or module PRD; list impacted aliases, components, themes, routes, and accessibility pairings. Keep a migration/rollback note for renamed tokens and icon components.
3. **Decide** conflicting or missing cases with product, design, and accessibility owners. Record an exception's affected scope, reason, approver, date, and expiry/review point; no local CSS override becomes a silent global rule.
4. **Implement and verify** the one semantic token mapping, component states, keyboard/pointer paths, narrow and zoomed layout, and both approved themes. Close the relevant DS gates only with evidence; update this document and the code in the same reviewed change when the implementation contract changes.

## Source coverage

The cached Figma page index lists **37 pages**. The 28 named specification pages below were consulted, but the cached response is **not a complete export of every nested node**. A page appearing in this inventory proves its presence, not exhaustive coverage of all its variants. Do not claim 100% synchronization until the gaps in the evidence table are closed.

- **基础样式** — Colors 色彩 · Fonts 字体 · Effect Styles 效果样式
- **通用** — Layout 布局 · Navigation 导航 · Icon 图标 · Button 按钮 · Breadcrumb 面包屑 · Pagination 分页
- **数据录入** — Input 输入框 · Select 选择器 · Radio 单选框 · Checkbox 多选框 · DatePicker 日期选择器 · TimePicker 时间选择器 · Switch 开关
- **数据展示** — Table 表格 · Tag 标签 · Tooltip 文字提示 · Tree 树结构 · Descriptions 描述列表 · Empty 空状态 · Badge 徽标
- **消息提醒** — Dialog 对话框 · Alert 警告 · Message 全局提示 · Popconfirm 气泡确认框 · Drawer 抽屉
- **典型页面** — Landing Page 登陆页 (marked 进行中; recorded as non-binding)

Also consulted: 封面 (system name and cover version) and 更新日志 (changelog version). The six remaining pages are titled section dividers (`🎨 基础样式`, `🗒 通用`, `🗒 数据录入`, `🗒 数据展示`, `🗒 消息提醒`, `🗒 典型页面`); their titles do not establish component rules. The `🎨 基础样式` divider's subtree is not in the cached node files, so its contents are not asserted empty.

The cached page titles do not mark a page as deprecated or historical. Landing Page is explicitly `进行中`, so it is non-binding. The cover's `v0.1.0` and the changelog's `版本 1.0.0` conflict as release labels; design should identify the authoritative version before this document uses either as its own release number.

### Evidence and open coverage

| Cache scope | Verified state | Needed to close the gap |
|---|---|---|
| `/tmp/figsync/top.json` | Valid JSON with the 37-page index and source version/modified timestamp | Recheck against the live Figma file when declaring a later revision current |
| `/tmp/figsync/n_colors.json`, `n_fonts.json`, `n_effects.json` and most `nodes/pNN.json` | Valid node snapshots for the named foundations and component pages | Spot-check nested states and node/style IDs when a rule is changed |
| `/tmp/figsync/full.json` and `nodes/p22.json` (Table) | Truncated, invalid JSON; **not** full-file or full-Table evidence | Re-export a complete, parseable snapshot; reconcile against the valid `p22_d2.json` and `t22_*` partial Table extracts |
| `/tmp/figsync/variables_local.json` | API returned 403; variable inventory unavailable, including any dark-mode variables | Obtain authorized variable data and check the file's light/dark style modes before claiming a complete palette or its absence |

The cached node/style references are useful for measured examples, but do not prove that **only one** variable binding exists across the full Figma file. Do not treat a missing node in a truncated response as absence. Retain Figma's measured values where the evidence is clear; tag any unverified exactness as pending instead of replacing it with an Arco default.

`/tmp/figsync` is transient audit evidence, not a durable design repository. Preserve a complete, versioned export in an approved location before depending on these exact paths for a later release audit.

### Corrected interpretation of measured components

| Page | Earlier reading | Cache-backed interpretation |
|---|---|---|
| Select 选择器 | Menu option outer height 24px | `item/selectOption` and `item/multiOption` are 32px, or 39px with a divider; 22px is text line height |
| Pagination 分页 | `type=left/right` means whole-control alignment | It belongs to `item/page arrow btn` and means previous/next arrow direction |
| Layout 布局 (historical cache) | 64px side gutter around a fixed 1200px column | The old 1440px example centred 1200px with 120px side margins; 64px measured header height. **Superseded for the two page shells by Figures 1/2: 56px header, fluid content with 16px margin, and 205px flush-left sidebar in Figure 2.** |

### Defects found in the source

Recorded here so they are corrected upstream rather than silently absorbed. In every case this document carries the **measured** value.

| Page | Defect | Resolution here |
|---|---|---|
| Tag 标签 | Prose says heights are 「20、24、32」 for 大、中、小 — labels and numbers in opposite order | Measured: large 32 / medium 24 / small 20 |
| Tag · Tooltip · Badge | All three carry the **Table** component's description verbatim (copy-paste never replaced) | Purpose statements derived from measured variants and actual use |
| Radio 单选框 | Size sentence truncated mid-clause: 「宽度根据文本内容自适应（基于」 | Heights 40/32/24 and hug-width documented; unstated basis flagged |
| Input 输入框 | Variant values misspelled `naomal` / `narmal` 默认 | Documented as `normal 默认` |
| Dialog 对话框 | Theme value misspelled `iinfo 信息` | Documented as `info 信息` |
| Button 按钮 | Icon-type value cased `prefixicon` against `suffixIcon` | Documented as `prefixIcon` |
| DatePicker | An unnamed placeholder variant `类型=类型3` | Excluded; the six named types are documented |
| Navigation | `state 状态=collapsedMenu` appears as a state value rather than a structural axis | Documented structurally, as a flyout |

**Project extensions beyond the Figma source**, marked in place: the implemented dark theme mapping `[Project-Dark]`, accessibility resolutions and pending deviations, charting, the proposed icon distribution, project defaults, and Vue/Arco implementation contracts `[Project]`. Their presence in this document does not make them Figma-authored or automatically approved for every product.
