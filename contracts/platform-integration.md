# OpenData 平台接口契约草案 v1

以下为 HMG 对未来 OpenData 后端的对接要求，尚未双方联调。接口路径为建议，需要平台实现时冻结。当前 HMG 业务 API 的机器可读契约见 hmg-api.openapi.json。

## 通用约定

所有平台调用使用服务认证，用户身份转发需校验签名、issuer、audience、有效期及 tenant_id。HMG 当前生产资源服务验证签名、issuer 和有效期；audience 校验需平台确定受众后补齐，未完成前不可生产开放。企业与用户从可信令牌提取，不信任浏览器传来的企业或人员姓名。

时间为 ISO-8601 UTC；ID 为不可变字符串。Idempotency-Key 与企业绑定。错误包含 code、message、traceId；分页使用 page/size/total/items。超时不能视为失败并直接创建重复资源，应按幂等键查询或重试。跨系统事件至少一次交付，消费者去重。

## 所需接口

| 服务 | 建议接口 | 请求 | 成功响应核心字段 |
|---|---|---|---|
| 身份 | GET /platform/v1/me | Bearer 用户令牌 | userId, tenantId, organizationId, displayName, permissions |
| 企业成员 | GET /platform/v1/users | keyword, page, size | items[userId, tenantId, enabled, departmentId], total |
| 车型主数据 | GET /platform/v1/vehicles/{id} | 可信企业身份 | id, tenantId, brandId, seriesId, modelId, revision |
| 法规主数据 | GET /platform/v1/regulations/{id} | 法规 ID | id, revision, status |
| 流程定义 | GET /platform/v1/workflows/{id}/versions/{version} | 固定版本 | definitionId, version, nodes, enabled |
| 流程实例 | POST /platform/v1/workflow-instances | businessId, tenantId, definitionVersion, initiatorId, correlationId | instanceId, revision, activeApprovals |
| 流程动作 | POST /platform/v1/approvals/{id}/actions | action, comment, expectedRevision, actorId | eventId, revision, nextApprovals, state |
| 文件上传准备 | POST /platform/v1/uploads | businessId, filename, size, mediaType, checksum | uploadId, uploadUrl/parts, expiresAt |
| 上传确认 | POST /platform/v1/uploads/{id}/complete | checksum, parts | fileId, size, checksum, scanStatus |
| 文件访问 | POST /platform/v1/files/{id}/access | businessId, purpose | 短时 downloadUrl/previewUrl, expiresAt |
| 消息待办 | POST /platform/v1/todos | eventId, businessId, userIds, type, link | todoId |
| 待办关闭 | POST /platform/v1/todos/{id}/complete | sourceEventId | 状态 |
| 审计 | POST /platform/v1/audit-events | eventId, actorId, tenantId, businessId, action, time | acceptedId |

文件服务需支持单文件 200MB、校验完整性及上传完成确认。附件可使用必须由 HMG 根据 fileId 再校验企业、业务归属和文件可用状态。数据库不保存文件正文。

## 平台下发与审批回调

平台下发建议使用 POST /api/v1/platform/task-dispatches，消息包含 eventId、sourceTaskId、sourceRevision、tenantId、name、workflowDefinitionVersion、ownerId。任务下发首先创建待执行主任务，车型/分项由执行阶段确定。当前交互 API create 为便于内核联调要求车型，未来下发适配单独建模，不能直接套用此请求。

审批回调必须包含 eventId、instanceId、approvalId、businessId、tenantId、actorId、decision、workflowRevision、occurredAt。只有匹配当前工作流及审批版本时才能推进业务状态，乱序或失效回调不覆盖当前状态。HMG 当前尚未提供上述接收端点。

## 正式产物与自动归档

hmg.task.completed.v1 事件包含固定审批结果及数据快照。产物服务按 aggregateId+version+产物类型去重生成。归档处理应持久化 PENDING/GENERATING/ARCHIVING/COMPLETED/FAILED，所有必需产物生成后归档。通知失败不回滚已完成审批；交由 outbox 重试。当前事件为本地数据库记录，消费者与对外发布尚未实现。
