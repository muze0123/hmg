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

本阶段未接入真实模版、附件、工作流或消息服务。模版版本 ID 在配置后不可更改，但尚未核验外部版本真实存在，也未做动态字段校验。审批通过事件事务写入 outbox，消费者尚未实现，不会实际生成正式文件或完成归档。当前 API 是独立内核接口，尚未替换前端数据层。

验证环境访问 Maven Central 曾出现 TLS 握手失败，已通过临时 Maven 镜像设置完成构建与测试。仓库未改动全局 Maven 设置；如网络环境需要镜像，可使用 MAVEN_ARGS 指定本机 settings.xml 后执行根目录命令。

JWT 接入配置参考 Spring 官方文档：https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html

## 浏览器访问

后端根地址 `http://127.0.0.1:4321/` 认证后返回服务状态 JSON。业务页面通过另一个终端运行根目录 `pnpm dev`，访问 Vite 启动日志中显示的 Local 地址。前后端目前尚未联调，后端开发账号用于 HTTP Basic，前端登录流程仍由 OpenData 承接。
