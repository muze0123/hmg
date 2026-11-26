# HMG

HMG 是 OpenData 下的业务应用。工程采用同仓库、前后端独立构建的结构。

## 工程目录

- `frontend/`：现有 Vue 3、TypeScript、Arco 前端，保留独立 pnpm 锁文件。
- `backend/`：Java 后端任务内核、数据库迁移及集成测试。
- `contracts/`：后续维护 HTTP 接口及平台事件契约。
- `deploy/`：后续维护环境配置与部署文件。

## 前端开发

在工程根目录执行：

```bash
pnpm install:frontend
pnpm dev
pnpm verify
pnpm build
pnpm design:browser
pnpm design:audit
```

也可以进入 `frontend/` 使用原有命令。安装依赖需使用上面的 `install:frontend`，或在 `frontend/` 执行 `pnpm install --frozen-lockfile`。构建输出位于 `frontend/dist/`。部署平台的前端工作目录应设置为 `frontend`，安装命令为 `pnpm install --frozen-lockfile`，构建命令为 `pnpm build`，静态发布目录为 `dist`。现有环境变量文件应放在 `frontend/` 中，由部署系统注入真实密钥。

前端规则、设计规范、脚本及验证报告随工程位于 `frontend/`；原前端说明保留在 `frontend/README.md`。

## 后端技术方向

采用 Java 21、Spring Boot、PostgreSQL、Flyway 和 Maven，以模块化单体组织企业隔离、主任务、分项、子项、模版版本、审批及产物归档。具体依赖版本在建立后端工程时冻结。

身份、组织用户、流程、文件、消息及审计通过平台适配层接入 OpenData。现有 OpenData WarmFlow 实现作为流程对接候选，需通过接口和集成测试验证。平台后端尚未完成期间，替代服务仅用于开发测试。

已建立三级任务内核及接口契约，运行命令见 `backend/README.md`。领域模型和审批规则见 `contracts/task-model-and-lifecycle.md`，平台契约见 `contracts/platform-integration.md`。真实平台接入与正式文件生成/归档仍待后续实现（dev 仅提供 outbox 本地处理器和 stand-in 引用）。

## 任务链路接口模式

```bash
pnpm backend:dev
# 另一终端
pnpm dev:connected
```

访问前端日志中的 Local 地址，使用后端开发账号登录。先在模版配置创建并发布版本，再在任务管理创建主任务，配置分项、法规及固定模版版本，进入子项填写并提交，使用审批账号完成逐级审批。完整边界见 backend/README.md。
