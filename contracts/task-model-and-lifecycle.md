# HMG 三级任务模型与状态机

依据用户已确认的 B1—B8，2026-11-20。

## 企业与业务边界

每个企业独立组织架构。所有查询和写入以认证身份中的 tenant_id 为边界；请求体不能指定企业。企业内共享可见，执行及审批仍限制为指定人员。主任务只对应一个车型车辆；同一主任务每种分项最多一个；子项按法规加模版版本组合生成。

## 模型

- TaskAggregate：id、tenantId、requestKey、requestHash、version、payload。payload 保存主任务及完整树，使用数据库乐观锁保护原子更新。
- 主任务：名称、车型车辆 ID、固定工作流版本、执行人、工作流审批节点快照、分项。
- 分项：类型、执行人、审批人序列、子项；车型配置分项的模版版本在主任务执行配置时确定。
- 子项：法规 ID、固定模版版本 ID、执行人、审批人序列、填写参数。
- 历史记录：节点、动作、执行者、意见、服务端时间，随业务更新追加，不提供修改接口。
- OutboxEvent：事件 ID、企业、主任务、类型、快照、处理状态、尝试次数、最后错误、可用时间、创建时间；与主任务最终通过在同一事务写入。
- ArchiveArtifact：事件 ID、主任务、产物类型、stand-in 引用；dev 归档记录，按事件 ID 去重，生产需替换为平台文件服务。

首版采用聚合快照表，避免三级状态跨表更新不一致。聚合内业务结构由 Java 模型约束。后续建立模版、附件与查询读模型，必要时拆分独立表；本版不假称已建立全部模块数据库。

## 状态与动作

| 对象 | 起始状态 | 动作 | 前置条件 | 结果 |
|---|---|---|---|---|
| 主任务 | PENDING | configure | 执行人、各类型唯一；车型分项要求固定版本 | ACTIVE，开放分项配置 |
| 分项 | PENDING | configure | 指定执行人；法规和模版版本完整且组合唯一 | ACTIVE，子项 ACTIVE |
| 子项 | ACTIVE/REJECTED | save | 指定执行人 | 保存参数，状态不变 |
| 子项 | ACTIVE/REJECTED | submit | 指定执行人 | REVIEWING，第一个审批节点 |
| 任一级 | REVIEWING | approve | 当前节点审批人 | 下一审批节点或 COMPLETED |
| 任一级 | REVIEWING | reject | 当前节点审批人、非空原因 | REJECTED，保留历史 |
| 分项/主任务 | ACTIVE | 自动提交 | 下级非空且全部 COMPLETED | REVIEWING |
| 分项/主任务 | REJECTED | submit | 指定执行人，下级均通过 | 新审批轮次，从首节点开始 |
| 任一级 | ACTIVE/REJECTED/WITHDRAWN | submitDraft | 指定执行人 | SUBMITTING，前端草稿提交有真实落点 |
| 任一级 | REVIEWING/SUBMITTING | withdraw | 指定执行人、reviewStep 为 0 | WITHDRAWN，保留审批历史 |
| 主任务 | PENDING/ACTIVE/SUBMITTING/REJECTED/WITHDRAWN | void | 主任务执行人、未进入审批 | VOIDED，终态 |
| 绑定工作流的审批节点 | REVIEWING | 平台回调 | instanceId、approvalId、workflowRevision 全部匹配 | COMPLETED 或 REJECTED；不匹配返回 IGNORED |

全部下级通过时自动发起上级审批，属于 B5 未指定部分的本次实现决定。已通过子项锁定，退回上级不解锁下级。执行配置启动后不可修改法规或模版绑定。模版版本不可切换。

当前内核支持顺序审批人列表，开发环境由请求提供；正式工作流必须由平台解析签发审批节点，不接受客户端作为权威来源。撤回、作废与平台审批回调已有真实状态和权限约束；会签、条件节点及外部协同仍待平台实现后扩展，模版字段级校验已在本阶段加入。

## 事务与重复请求

创建使用企业内唯一 Idempotency-Key，内容 SHA-256 匹配时返回原记录，内容变化返回 409。并发创建触发唯一约束时返回 409，可同键重试读取原结果。写操作携带 version；过期返回 409，不覆盖新版本。审批重复请求携带旧版本返回冲突。

最终通过产生唯一 hmg.task.completed.v1 待处理事件。文件生成和归档采用 `PENDING → GENERATING → ARCHIVING → COMPLETED` 处理状态，失败进入 `FAILED`，审批通过不代表归档成功。dev 处理器按事件 ID 去重、最多重试 5 次并线性退避；`LocalArtifactGateway` 只写 stand-in 引用，不代表正式文件。生产未接平台文件服务时事件保持 PENDING，不生成正式产物。

## 实施边界

已实现三级聚合的创建、查询、执行配置、填写保存、审批及 outbox 写入；新增 submitDraft、withdraw、void 真实动作和平台下发/审批回调接收端。已接通 connected 前端模式及模版版本库。OpenData 身份/流程/文件/消息接口、文件上传和正式产物生成仍待实现；下发/回调端点尚未与实际平台消息通道联调。生产配置未接平台时拒绝业务写操作，开发替代身份仅在 dev profile 生效。

## 与现有前端的兼容关系

前端现有状态包括 pending/submitting/active/reviewing/completed/rejected/withdrawn/voided。内核已补齐 SUBMITTING/WITHDRAWN/VOIDED 及对应业务动作，`GET /api/v1/tasks/{id}/status` 以只读方式映射为前端小写代码，并提供节点级 kernelState 与 editable。该映射不是大小写别名，也不代替 actions 写入；聚合规则与前端 aggregateTaskStatus 对齐。后端内核当前不宣称覆盖全部前端模块。

首版聚合读取返回完整任务树，尚无分页列表、按分项查询和历史分页；后续按列表页接口契约扩展读模型。性能和大规模历史记录需要在读模型阶段单独验收。

## 模版版本与字段校验（2026-11-23）

新增 template_version 表，企业内 (template_id, revision) 唯一。创建即固定版本内容，仅允许幂等发布，不提供覆盖更新接口。新版本使用新的版本 ID。任务执行配置时验证发布状态、企业、任务类型及法规，保存完整 TemplateSchema 快照。旧版本任务的保存与提交使用该快照，不读取最新版本。

字段支持 TEXT、NUMBER、ORDERED、RICH、TABLE。数值采用 JSON 数值（0 是有效值），支持上下界；有序编号为正整数；文本支持长度；表格支持文本和数值列、必填单元格及未知列检查，最多 1000 行。保存允许必填项暂缺，但已有值必须符合类型和约束；提交完整检查必填项。未定义字段拒绝保存，422 返回字段路径及错误码。校验失败不修改任务版本、不追加提交记录、不推进审批。

前端已在 connected 模式接通模版版本、发布、固定版本绑定、参数填写和三级审批。现有业务页面的其他功能仍由原数据层提供，不意味着已接入全模块。
