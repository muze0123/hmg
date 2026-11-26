# HMG 后端内核

Java 21、Spring Boot 3.5.16、JPA、Flyway。生产数据库使用 PostgreSQL，dev 使用 H2 PostgreSQL 兼容模式。H2 测试不能替代 PostgreSQL 实库验收。

在工程根目录执行：

```bash
pnpm backend:test
pnpm backend:dev
pnpm backend:build
```

开发服务默认监听 127.0.0.1:4321（避开 OpenData 的 4320），可通过 `HMG_PORT` 覆盖，例如 `HMG_PORT=54321 pnpm backend:dev`。数据存于 `backend/.hmg-data/`（Maven 启动工作目录）。开发身份为 `a.executor`、`a.reviewer`、`b.executor`，统一测试密码 `development-only`。企业从受认证开发账号前缀推导，不能通过请求体覆盖。

```bash
curl -u a.executor:development-only -H 'Content-Type: application/json' -H 'Idempotency-Key: first-task' http://127.0.0.1:4321/api/v1/tasks -d '{"name":"首个任务","vehicleId":"vehicle-1","workflowVersion":"workflow-v1","reviewers":["a.reviewer"]}'
```

使用返回的 id、version 配置分项、配置子项，再通过 actions/save、submit、approve、reject 驱动流程。详见 contracts/hmg-api.openapi.json。所有后续写入必须携带最新 version。

生产启动不启用 dev profile，需要 HMG_DATABASE_URL、HMG_DATABASE_USER、HMG_DATABASE_PASSWORD、OPENDATA_ISSUER_URI。当前平台适配未实现，生产业务写入返回 503。禁止将 dev profile 暴露到生产网络。企业 claim 与 JWT audience 需要平台确认后完整验收。

已建立企业隔离的模版版本库，任务绑定已发布版本并按快照校验。connected 前端模式接入核心任务链路。审批通过事件事务写入 outbox；dev 提供本地处理器与 stand-in 产物引用，生产未接平台文件/归档服务时不处理事件，不会生成正式文件或宣称归档成功。附件、真实工作流和消息服务仍待对接。

验证环境访问 Maven Central 曾出现 TLS 握手失败，已通过临时 Maven 镜像设置完成构建与测试。仓库未改动全局 Maven 设置；如网络环境需要镜像，可使用 MAVEN_ARGS 指定本机 settings.xml 后执行根目录命令。

JWT 接入配置参考 Spring 官方文档：https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html

## 浏览器访问

后端根地址 `http://127.0.0.1:4321/` 认证后返回服务状态 JSON。业务页面通过另一个终端运行根目录 `pnpm dev`，访问 Vite 启动日志中显示的 Local 地址。connected 模式通过 HTTP Basic 登录后端开发账号；原前端模式仍由 OpenData 承接登录。

## 模版版本及前端联调

`/api/v1/template-versions` 支持创建、查询；`/{id}/publish` 发布不可修改版本。每个企业下模版编号和版本号唯一。主任务的车型模版及各子项模版必须引用已发布版本 ID；子项按绑定快照校验。

运行 `pnpm backend:dev` 后，另一终端运行 `pnpm dev:connected`。前端通过 Vite `/api/v1` 代理到 4321，使用后端开发账号在业务入口登录。可通过 HMG_API_TARGET 覆盖后端代理地址。认证信息仅保存在当前页面内存，刷新后需重新登录。

接口模式覆盖模版配置、使用记录、主任务、分项与五种子项任务的核心链路。任务创建选择工作流版本编号，开发环境审批人由请求指定；人员、车型和工作流尚未接平台目录，当前通过 ID 输入。富文本字段当前通过多行文本编辑并作为字符串保存；没有接入附件上传。正式生成和归档仍待平台文件服务；dev 只写入 stand-in 引用。

`pnpm dev` 保留原前端模式，`pnpm build:connected` 构建接口模式。生产 JWT 与平台服务尚未联调，connected 模式不能作为已完成生产接入的声明。

历史开发数据中若任务没有 templateSnapshot，不推测或自动替换其已绑定版本；此类记录仍可读取，填写和提交会被拒绝。当前可通过新建任务与已发布版本建立完整绑定，历史数据迁移需单独执行并保留原记录。

## 平台下发与审批回调

`POST /api/v1/platform/task-dispatches` 接收下发事件，`POST /api/v1/platform/approvals/callbacks` 接收审批回调。两者均按 `(tenant, eventId)` 去重，租户从认证身份推导，请求体 tenantId 必须一致。重复事件返回 `DUPLICATE`；内容相同 ID 不同不重复建单。回调仅在 instanceId、approvalId、workflowRevision 与当前审批节点全部匹配时推进状态，乱序或已决策回调返回 `IGNORED` 且不改状态。两份接口尚未与 OpenData 实际消息通道联调，生产 JWT 受众确认前不可开放。

## Outbox 与本地归档

主任务最终通过时在同一事务写入 `hmg.task.completed.v1`。dev 的 `LocalArtifactGateway` 将事件推进 `PENDING → GENERATING → ARCHIVING → COMPLETED`，并在 `archive_artifact` 保存按事件 ID 去重的 stand-in 引用；失败进入 `FAILED` 并按次数线性退避，最多 5 次，不强行完成。`/api/v1/outbox` 与 `/api/v1/outbox/process` 仅在 dev profile 暴露。生产没有网关时事件保持 PENDING，不生成正式文件。

## 状态兼容

`GET /api/v1/tasks/{id}/status` 返回只读兼容视图：内核 `SUBMITTING/WITHDRAWN/VOIDED` 映射为前端 `submitting/withdrawn/voided`，并提供节点级 `kernelState`、`status`、`editable`。这些状态有真实动作（submitDraft / withdraw / void），不是大小写别名；聚合规则与前端 `aggregateTaskStatus` 对齐。兼容层不代替业务写入，写操作仍走 actions 端点。
