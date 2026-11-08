import { createI18n } from 'vue-i18n';
import { DEFAULT_LOCALE, readStoredLocale } from './locale';

// 语言相关的常量与校验都在 ./locale，这里只做转出，保持旧引用路径可用
export { LOCALE_KEY } from './locale';

/**
 * 平台初始框架文案表：只包含当前仍在使用的平台级能力与保留模块（审计管理）。
 * 新增/删除文案时须同时维护 zh-CN 与 en-US，pnpm i18n:check 会校验两侧对称。
 */
const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-CN': {
      account: { center: '个人中心', title: '账号信息', username: '用户名称', name: '用户姓名', department: '所在部门', roles: '所属角色', audit: '审计管理', logout: '退出登录' },
      tags: {"title": "标签管理", "name": "标签名称", "description": "标签描述", "date": "创建日期", "creator": "创建人", "actions": "操作", "search": "搜索", "reset": "重置", "new": "新建标签", "edit": "编辑标签", "view": "查看", "delete": "删除", "save": "保存草稿", "cancel": "取消", "empty": "暂无匹配标签", "required": "请输入标签名称", "duplicate": "标签名称已存在", "saved": "已保存草稿", "remove": "确认删除该标签？", "warning": "删除后无法恢复，请确认是否继续。", "leave": "放弃尚未保存的修改？"},
      testing: {
  "title": "测试记录",
  "taskManagement": "任务管理",
  "technical": "技术资料",
  "records": "测试记录列表",
  "project": "项目编号",
  "name": "项目名称",
  "regulation": "法规编号",
  "priority": "优先级",
  "status": "状态",
  "start": "开始日期",
  "end": "计划结束日期",
  "actual": "实际结束日期",
  "owner": "执行人",
  "reviewer": "审核人",
  "template": "模板编号",
  "version": "版本号",
  "actions": "操作",
  "search": "搜索",
  "reset": "重置",
  "view": "查看",
  "edit": "编辑",
  "review": "审核",
  "export": "导出 CSV",
  "more": "更多操作",
  "gate": "需先完成该项目的车型配置任务",
  "editUnavailable": "当前状态不支持编辑",
  "reviewUnavailable": "仅审核中的记录可进行审核",
  "empty": "暂无匹配的测试记录",
  "emptyItems": "暂无匹配的配置项",
  "back": "返回列表",
  "save": "保存草稿",
  "submit": "提交审核",
  "base": "基础信息",
  "templateInfo": "模板信息",
  "model": "车型配置",
  "individual": "逐项填写",
  "batch": "批量填写",
  "number": "编号",
  "item": "配置项",
  "format": "配置项格式",
  "tag": "标签",
  "fill": "填写",
  "itemStatus": "填写状态",
  "reference": "引用技术资料",
  "referenceHint": "引用值仅在来源技术资料已完成后同步，当前为只读",
  "parameter": "参数",
  "result": "结果",
  "addRow": "添加行",
  "removeRow": "删除行",
  "orderedHint": "每行一个有序编号，如 1. 准备、2. 测量",
  "richHint": "支持加粗、斜体与多行内容",
  "bold": "加粗",
  "italic": "斜体",
  "value": "条目值",
  "required": "请完成必填项并检查数值、表格和有序编号格式",
  "invalidValue": "请填写有效的条目值，表格的参数和结果均需填写",
  "saved": "记录已更新",
  "saveError": "操作失败，输入已保留，请重试",
  "conclusion": "审核结论",
  "opinion": "审核意见",
  "reviewRequired": "请选择审核结论并填写审核意见",
  "confirmReview": "确认审核",
  "history": "审核记录",
  "noHistory": "暂无审核记录",
  "timeZone": "北京时间 UTC+8",
  "missing": "测试记录或页面不存在",
  "close": "关闭",
  "apply": "应用到当前草稿",
  "statuses": {
    "notStarted": "未开始",
    "inProgress": "进行中",
    "pending": "待提交",
    "reviewing": "审核中",
    "rejected": "驳回",
    "completed": "已完成",
    "paused": "已暂停"
  },
  "formats": {
    "number": "数字",
    "ordered": "有序编号",
    "table": "表格",
    "rich": "富文本",
    "text": "文本"
  },
  "priorities": {
    "urgent": "紧急",
    "high": "优先",
    "normal": "常规"
  },
  "tags": {
    "required": "必填",
    "optional": "选填"
  },
  "items": {
    "testProject": "试验项目",
    "testMethod": "试验方法",
    "measurement": "测量值",
    "conditions": "试验条件",
    "sequence": "试验步骤",
    "technicalMass": "整备质量（kg）"
  },
  "results": {
    "passed": "通过",
    "rejected": "驳回"
  },
  "confirm": {
    "leave": "有未保存的修改，确定离开？",
    "drawer": "确定放弃此条目尚未应用的修改？",
    "submit": "确认提交测试记录审核？",
    "review": "确认保存本次审核结论？"
  }
},
 templates: {"title": "模版管理", "config": "模版配置", "usage": "使用记录", "name": "模版名称", "description": "模版描述", "version": "版本号", "created": "创建时间", "updated": "更新时间", "status": "状态", "actions": "操作", "new": "新增模版", "edit": "编辑", "view": "详情", "save": "保存草稿", "cancel": "取消", "search": "搜索", "reset": "重置", "all": "全部", "vehicle": "车型配置", "technical": "技术资料", "testing": "测试记录", "report": "报告", "certificate": "证书", "region": "适用区域", "country": "适用国家", "vehicleType": "适用车辆类型", "draft": "未开始", "reviewing": "审核中", "completed": "已完成", "rejected": "驳回", "project": "项目编号", "projectName": "项目名称", "used": "使用时间", "user": "使用人", "type": "模版类型", "entries": "配置信息", "item": "配置项", "format": "配置项格式", "note": "备注", "add": "新增配置项", "remove": "删除", "text": "文本", "number": "数字", "table": "表格", "rich": "富文本", "required": "请填写模版名称、版本号及配置项名称", "saved": "已保存草稿", "leave": "放弃尚未保存的修改？", "back": "返回", "empty": "暂无匹配记录"},
reports: {"tasks": "任务管理", "title": "报告", "keyword": "关键词", "status": "状态", "search": "查询", "reset": "重置", "id": "报告编号", "project": "项目编号", "name": "项目名称", "regulation": "法规编号", "owner": "执行人", "reviewer": "审核人", "actions": "操作", "view": "查看", "edit": "填写", "review": "审核", "export": "导出", "empty": "暂无匹配报告", "back": "返回列表", "base": "基础信息", "content": "报告内容", "summary": "报告说明", "technical": "引用技术资料", "testing": "引用测试记录", "reference": "引用值（只读）", "gate": "需先完成车型配置任务", "save": "保存草稿", "submit": "提交审核", "opinion": "审核意见", "approve": "通过", "reject": "驳回", "history": "审核记录", "noHistory": "暂无审核记录", "required": "请填写报告说明", "opinionRequired": "请填写审核意见", "saved": "操作已完成", "leave": "存在未保存修改，确定离开？", "confirmSubmit": "确认提交此报告审核？", "pending": "待提交", "reviewing": "审核中", "completed": "已完成", "rejected": "已驳回", "template": "导出模板", "standard": "报告标准版 · v1.0", "format": "PDF · A4 纵向（浏览器打印）", "filename": "文件名", "preview": "预览并打印", "exportNote": "系统预设模板只读；打开浏览器打印后可另存为 PDF。", "cancel": "取消", "missing": "报告不存在", "start": "开始日期", "end": "计划结束日期", "actual": "实际结束日期"},
archive: {"title": "项目归档", "directory": "目录", "projectSearch": "搜索项目", "name": "交付物名称", "activity": "关联活动", "date": "交付日期", "owner": "责任人", "actions": "操作", "search": "搜索", "reset": "重置", "preview": "预览文件", "download": "下载", "empty": "暂无匹配交付物", "noProjects": "暂无匹配项目", "count": "{count} 个交付物", "columns": "列设置", "restore": "恢复默认", "show": "显示列", "density": "表格密度", "normal": "标准", "compact": "紧凑", "close": "关闭", "downloadError": "下载失败，请重试", "all": "全部活动"},
"vehicle": {"northAmerica": "北美洲", "southAmerica": "南美洲", "africa": "非洲", "oceania": "大洋洲", "usa": "美国", "brazil": "巴西", "egypt": "埃及", "australia": "澳大利亚", "fold": "合并相同配置", "expand": "全部展开","title": "车型配置", "search": "搜索项目编号或名称", "all": "全部状态", "pending": "待提交", "reviewing": "审核中", "completed": "已完成", "rejected": "驳回", "id": "项目编号", "name": "项目名称", "priority": "优先级", "start": "开始日期", "end": "计划结束日期", "actual": "实际结束日期", "action": "操作", "edit": "编辑", "detail": "详情", "review": "审核", "export": "导出", "back": "返回列表", "save": "保存草稿", "submit": "提交审核", "saved": "已保存", "required": "请填写全部必填字段", "basic": "车型配置", "items": "配置信息", "region": "适用区域", "country": "适用国家", "type": "适用车辆类型", "template": "模板名称", "reviewer": "审核人", "executor": "执行人", "version": "版本号", "note": "说明", "attachment": "附件（DOC、DOCX、PDF）", "add": "新增条目", "addColumn": "新增配置项", "remove": "删除", "item": "条目名称", "format": "格式", "tag": "标签", "value": "配置项", "text": "文本", "number": "数字", "ordered": "有序编号", "table": "表格", "rich": "富文本", "pass": "通过", "reject": "驳回", "opinion": "审核意见", "reviewRequired": "请填写审核意见", "normal": "常规", "high": "优先", "asia": "亚洲", "europe": "欧洲", "china": "中国", "germany": "德国", "car": "乘用车", "truck": "商用车", "invalidFile": "请选择 DOC、DOCX 或 PDF 文件", "unsaved": "存在未保存修改，确定离开？"},
tech: {"title": "技术资料", "back": "返回", "keyword": "关键词", "status": "状态", "search": "查询", "reset": "重置", "regulation": "法规编号", "project": "项目编号", "name": "项目名称", "owner": "执行人", "reviewer": "审核人", "actions": "操作", "view": "查看", "edit": "编辑", "review": "审核", "export": "导出", "gate": "需先完成该项目的车型配置任务", "empty": "暂无匹配资料", "base": "基础信息", "content": "资料填写", "mass": "整备质量（kg）", "opinion": "审核意见", "save": "保存草稿", "submit": "提交审核", "reject": "驳回", "pass": "通过", "history": "审核记录", "noHistory": "暂无审核记录", "required": "请输入大于零的整备质量", "opinionRequired": "请填写审核意见", "saved": "已保存", "leave": "有未保存的修改，确定离开？"},
"cert": {"title": "证书", "tasks": "任务管理", "new": "新增证书", "number": "证书编号", "issuer": "签发机构", "agency": "认证机构", "issued": "签发日期", "expires": "有效期至", "file": "证书文件", "regulations": "法规与证书", "required": "请填写证书编号、签发机构、认证机构、签发日期并上传证书", "delete": "删除证书", "deleteConfirm": "确定删除该证书？", "leave": "放弃未保存的修改？", "upload": "上传证书", "fileError": "请选择不超过 20 MB 的 PDF 文件", "unavailable": "文件尚未上传", "saved": "已保存", "project": "选择项目", "history": "审核记录"},
"sections": {"title": "分项管理", "search": "搜索", "reset": "重置", "project": "项目编号", "name": "项目名称", "law": "法规编号", "priority": "优先级", "type": "任务类型", "status": "状态", "start": "开始日期", "end": "计划结束日期", "actual": "实际结束日期", "action": "操作", "view": "查看", "edit": "编辑", "review": "审核", "export": "导出 CSV", "all": "全部", "save": "保存", "cancel": "取消", "note": "审核意见", "pass": "通过", "reject": "驳回", "required": "请填写审核意见", "saved": "修改已保存", "detail": "分项详情", "empty": "暂无匹配分项", "urgent": "紧急", "high": "优先", "normal": "常规", "technical": "技术资料", "test": "测试记录", "certificate": "证书", "report": "报告", "notStarted": "未开始", "inProgress": "进行中", "pending": "待提交", "reviewing": "审核中", "completed": "已完成", "rejected": "驳回", "paused": "已暂停"},
 "projects": {"title": "项目管理", "new": "新建项目", "edit": "编辑项目", "detail": "项目详情", "back": "返回", "save": "保存", "start": "开始", "search": "搜索", "reset": "重置", "id": "项目编号", "name": "项目名称", "brand": "品牌", "series": "车系", "model": "车型", "priority": "优先级", "owner": "负责人", "status": "状态", "tasks": "任务类型", "begin": "开始日期", "end": "计划结束日期", "actual": "实际结束日期", "actions": "操作", "view": "查看", "base": "基础信息", "content": "项目内容", "executor": "执行人", "reviewer": "审核人", "target": "目标时间", "template": "模板", "required": "请完整填写必填信息，并检查日期范围", "saved": "已保存", "missing": "项目不存在", "leave": "有未保存的修改，确定离开？", "empty": "暂无符合条件的项目", "all": "全部", "urgent": "紧急", "preferred": "优先", "normal": "常规", "pending": "未开始", "active": "进行中", "review": "审核中", "rejected": "驳回", "completed": "已完成", "paused": "已暂停", "vehicle": "车型配置", "technical": "技术资料", "testing": "测试记录", "certificate": "证书", "report": "报告"},
      designSystem: {"unsaved": "当前页面有未保存的修改，确定要放弃吗？", "abandon": "放弃", "close": "关闭","pagination": {"navigation": "列表分页", "size": "每页条数", "perPage": "{count} 条/页", "previous": "上一页", "next": "下一页", "jump": "跳至", "pages": "/{count} 页"},"language": "切换语言", "theme": "切换主题", "state": "页面状态", "states": {"ready": "正常", "empty": "空数据", "loading": "加载中", "error": "加载失败"}, "keyword": "关键词", "search": "查询", "reset": "重置", "list": "设计模式记录", "total": "共 {count} 条", "edit": "编辑", "error": "加载失败", "retry": "重试", "id": "编号", "name": "名称", "noMatch": "暂无匹配结果", "empty": "暂无数据", "detail": "详情", "saved": "已更新", "required": "请输入名称", "cancel": "取消", "save": "保存", "discard": "确定放弃修改吗？", "confirm": "确定", "acknowledge": "我知道了"},
"wb": {"title": "工作台", "projects": "项目总数", "completion": "完成率", "distribution": "项目状态分布", "materials": "资料准备度 / 审计通过率", "basis": "同一批资料的两个口径", "ready": "准备度", "pass": "通过率", "tasks": "任务状态", "types": "任务类型分布", "priority": "优先级分布", "audits": "审计状态", "regions": "法规覆盖区域", "certificates": "证书", "vehicle": "整车证书", "part": "零部件证书", "noCertificate": "暂无证书数据", "todo": "审计待办", "activity": "最近动态", "search": "搜索项目编号、名称或法规编号", "all": "全部状态", "projectId": "项目编号", "name": "项目名称", "regulation": "法规编号", "status": "状态", "date": "创建日期", "action": "操作", "review": "查看待办", "detail": "审计待办详情", "notice": "业务审核服务尚未接入；此处仅展示原型待办信息。", "empty": "暂无匹配的待办", "total": "合计", "roles": "角色分布：系统管理员 1、审计人员 1、项目主管 1", "started": "创建项目", "template": "选择模板", "filled": "填写数据", "submitted": "提交审核", "technical": "技术资料", "test": "测试", "testRecord": "测试记录", "certificate": "证书", "report": "报告", "europe": "欧洲", "asia": "亚洲", "normal": "常规", "urgent": "紧急", "high": "优先", "notStarted": "未开始", "inProgress": "进行中", "completed": "已完成", "overdue": "超期", "pending": "待提交", "reviewing": "审核中", "rejected": "驳回", "paused": "已暂停"},
      "overview": {
        "notices": {
          "system": {
            "title": "系统消息",
            "description": "系统安全巡检已完成，请查看最新检测结果。"
          },
          "overdue": {
            "title": "任务逾期",
            "description": "有任务已超过处理时限，请及时处理。"
          },
          "alert": {
            "title": "事件告警",
            "description": "监测到一条事件告警，请查看详情。"
          }
        }
      },
      "messageCenter": {
        "filter": "筛选消息类型",
        "all": "全部消息",
        "empty": "当前筛选下暂无消息"
      },
      "notices": {
        "system": "系统消息",
        "license": "许可证将于 30 日后到期，请及时续期。",
        "overdue": "任务逾期",
        "overdueDetail": "有任务已超过处理时限，请及时处理。",
        "alert": "事件告警",
        "alertDetail": "有一条 HIGH 级别告警待处理。"
      },
      "pending": {
        "description": "该功能模块正在规划中，待后续版本开放。"
      },
      "shell": {
        "appName": "系统平台",
        "navigation": "主导航",
        "theme": "主题",
        "light": "浅色",
        "dark": "深色",
        "language": "语言",
        "chinese": "简体中文",
        "english": "English",
        "notifications": "通知",
        "noNotifications": "暂无通知",
        "dismiss": "移除通知",
        "collapseSidebar": "收起侧栏",
        "expandSidebar": "展开侧栏"
      },
      "assistant": {
        "title": "AI 助手",
        "open": "打开 AI 助手",
        "close": "关闭 AI 助手",
        "send": "发送",
        "placeholder": "输入问题...",
        "welcome": "你好，有什么可以帮助你的吗？",
        "question": "今天有哪些待处理任务？",
        "tasks": "导入导出中有 3 条进行中的导入/导出任务，可在导入导出面板查看进度。",
        "unavailable": "AI 助手服务暂不可用，请稍后再试。"
      },
      "audit": {
        "listTitle": "审计记录",
        "filters": {
          "time": "操作时间",
          "actor": "操作人",
          "actionType": "操作类型",
          "module": "操作模块",
          "result": "结果",
          "keyword": "关键字",
          "keywordPlaceholder": "搜索编号、对象、摘要或操作人",
          "search": "查询",
          "reset": "重置",
          "all": "全部",
          "settings": "筛选设置",
          "show": "显示 ",
          "restore": "恢复默认"
        },
        "columns": {
          "time": "操作时间",
          "actor": "操作人",
          "module": "操作模块",
          "actionType": "操作类型",
          "target": "操作对象",
          "summary": "操作摘要",
          "result": "结果",
          "actions": "操作",
          "settings": "列设置"
        },
        "actions": {
          "detail": "详情",
          "export": "导出",
          "close": "关闭"
        },
        "results": {
          "success": "成功",
          "failure": "失败"
        },
        "actionTypes": {
          "login": "登录",
          "view": "查看",
          "create": "新建",
          "update": "修改",
          "delete": "删除",
          "import": "导入",
          "export": "导出",
          "review": "审核",
          "grant": "授权",
          "config": "配置"
        },
        "modules": {
          "account": "账号与角色",
          "grant": "功能授权",
          "audit": "审计管理",
          "message": "消息中心",
          "system": "系统设置"
        },
        "roles": {
          "admin": "管理员",
          "officer": "专员",
          "owner": "业务负责人"
        },
        "detail": {
          "title": "审计详情",
          "id": "审计编号",
          "time": "操作时间",
          "actor": "操作人",
          "module": "操作模块",
          "actionType": "操作类型",
          "target": "操作对象",
          "summary": "操作摘要",
          "result": "结果"
        },
        "table": {
          "empty": "暂无审计记录",
          "noMatch": "没有符合筛选条件的审计记录",
          "pageSize": "每页条数",
          "navigation": "审计记录分页"
        },
        "pagination": {
          "total": "共 {count} 条记录",
          "perPage": "{count} 条/页",
          "previous": "上一页",
          "next": "下一页",
          "jumpTo": "跳至",
          "totalPages": "/{count} 页"
        },
        "currentUser": "当前用户",
        "export": {
          "empty": "当前筛选没有可导出的审计记录",
          "fail": "导出失败，请重试"
        },
        "exportNotice": {
          "title": "导出提示",
          "line1": "本次将导出所选时间范围内的所有审计记录",
          "line2": "导出结果可以在「导入导出–下载任务」中查看和下载。",
          "cancel": "取消",
          "confirm": "确认导出",
          "created": "导出任务已创建，请在「导入导出–下载任务」中下载"
        }
      },
      "taskCenter": {
        "title": "导入导出",
        "tabs": {
          "import": "导入任务",
          "download": "下载任务"
        },
        "filters": {
          "module": "任务模块",
          "operator": "操作人",
          "time": "操作时间",
          "all": "全部",
          "startDate": "开始时间",
          "endDate": "结束时间",
          "search": "查询",
          "reset": "重置"
        },
        "note": "说明：导出数据在系统平台内记录最多保留 30 天，30 天后自动清除。",
        "columns": {
          "module": "模块",
          "file": "文件名称",
          "operator": "操作人",
          "time": "操作时间",
          "stage": "任务阶段",
          "actions": "操作"
        },
        "stages": {
          "processing": "处理中 {progress}%",
          "importSuccess": "总数{total}条，成功{ok}条，失败{fail}条",
          "partialFailPrefix": "总数{total}条，成功{ok}条，",
          "partialFailCount": "失败{fail}条",
          "importFailed": "导入失败",
          "exportSuccess": "导出成功",
          "exportFailed": "导出失败",
          "expired": "文件已过期，无法下载"
        },
        "actions": {
          "downloadFile": "下载文件",
          "downloadErrorData": "下载错误数据",
          "noOperation": "——"
        },
        "empty": {
          "noRecord": "暂无数据",
          "noMatch": "搜索不到相关内容"
        },
        "pagination": {
          "navigation": "导入导出分页",
          "total": "共 {count} 条记录",
          "perPage": "{count} 条/页",
          "pageSizeAria": "每页条数",
          "previous": "上一页",
          "next": "下一页",
          "jumpTo": "跳至",
          "totalPages": "/{count} 页",
          "invalidPage": "请输入有效页码"
        },
        "fileNames": {
          "import": "导入数据",
          "export": "导出",
          "importError": "导入错误数据"
        },
        "modules": {
          "account": "账号与角色",
          "grant": "功能授权",
          "audit": "审计管理",
          "message": "消息中心",
          "system": "系统设置"
        },
        "feedback": {
          "startDownload": "开始下载"
        }
      },
      "nav": {
        "audit": "审计管理",
        "accounts": "账号与角色",
        "grants": "功能授权"
      }
    },
    'en-US': {
      account: { center: 'Personal center', title: 'Account information', username: 'Username', name: 'Name', department: 'Department', roles: 'Roles', audit: 'Audit management', logout: 'Log out' },
      tags: {"title": "Tag management", "name": "Tag name", "description": "Description", "date": "Created date", "creator": "Created by", "actions": "Actions", "search": "Search", "reset": "Reset", "new": "New tag", "edit": "Edit tag", "view": "View", "delete": "Delete", "save": "Save draft", "cancel": "Cancel", "empty": "No matching tags", "required": "Enter a tag name", "duplicate": "This tag name already exists", "saved": "Draft saved", "remove": "Delete this tag?", "warning": "Deletion cannot be undone. Continue?", "leave": "Discard unsaved changes?"},
      testing: {
  "title": "Test records",
  "taskManagement": "Task management",
  "technical": "Technical materials",
  "records": "Test records",
  "project": "Project ID",
  "name": "Project name",
  "regulation": "Regulation ID",
  "priority": "Priority",
  "status": "Status",
  "start": "Start date",
  "end": "Planned end date",
  "actual": "Actual end date",
  "owner": "Executor",
  "reviewer": "Reviewer",
  "template": "Template ID",
  "version": "Version",
  "actions": "Actions",
  "search": "Search",
  "reset": "Reset",
  "view": "View",
  "edit": "Edit",
  "review": "Review",
  "export": "Export CSV",
  "more": "More actions",
  "gate": "Complete the project’s vehicle configuration first",
  "editUnavailable": "Editing is unavailable in this status",
  "reviewUnavailable": "Only records in review can be reviewed",
  "empty": "No matching test records",
  "emptyItems": "No matching configuration items",
  "back": "Back to list",
  "save": "Save draft",
  "submit": "Submit for review",
  "base": "Basic information",
  "templateInfo": "Template information",
  "model": "Vehicle configuration",
  "individual": "Individual entry",
  "batch": "Batch entry",
  "number": "Number",
  "item": "Configuration item",
  "format": "Item format",
  "tag": "Tag",
  "fill": "Fill in",
  "itemStatus": "Entry status",
  "reference": "Technical material reference",
  "referenceHint": "Read-only. Values synchronize once the source technical material is completed.",
  "parameter": "Parameter",
  "result": "Result",
  "addRow": "Add row",
  "removeRow": "Remove row",
  "orderedHint": "One numbered entry per line, e.g. 1. Preparation, 2. Measurement",
  "richHint": "Supports bold, italic and multiline content",
  "bold": "Bold",
  "italic": "Italic",
  "value": "Value",
  "required": "Complete required entries and check numeric, table and numbered-list formats",
  "invalidValue": "Enter a valid value. Both parameter and result are required in every table row.",
  "saved": "Record updated",
  "saveError": "Operation failed. Your input is retained. Please retry.",
  "conclusion": "Review conclusion",
  "opinion": "Review comments",
  "reviewRequired": "Choose a conclusion and enter review comments",
  "confirmReview": "Confirm review",
  "history": "Review history",
  "noHistory": "No review history",
  "timeZone": "Beijing time · UTC+8",
  "missing": "Test record or page not found",
  "close": "Close",
  "apply": "Apply to current draft",
  "statuses": {
    "notStarted": "Not started",
    "inProgress": "In progress",
    "pending": "Pending submission",
    "reviewing": "In review",
    "rejected": "Rejected",
    "completed": "Completed",
    "paused": "Paused"
  },
  "formats": {
    "number": "Number",
    "ordered": "Numbered list",
    "table": "Table",
    "rich": "Rich text",
    "text": "Text"
  },
  "priorities": {
    "urgent": "Urgent",
    "high": "High",
    "normal": "Standard"
  },
  "tags": {
    "required": "Required",
    "optional": "Optional"
  },
  "items": {
    "testProject": "Test project",
    "testMethod": "Test method",
    "measurement": "Measured value",
    "conditions": "Test conditions",
    "sequence": "Test steps",
    "technicalMass": "Curb mass (kg)"
  },
  "results": {
    "passed": "Passed",
    "rejected": "Rejected"
  },
  "confirm": {
    "leave": "Leave and discard unsaved changes?",
    "drawer": "Discard changes that have not been applied to this entry?",
    "submit": "Submit this test record for review?",
    "review": "Save this review conclusion?"
  }
},
 templates: {"title": "Template management", "config": "Template configuration", "usage": "Usage records", "name": "Template name", "description": "Description", "version": "Version", "created": "Created", "updated": "Updated", "status": "Status", "actions": "Actions", "new": "New template", "edit": "Edit", "view": "Details", "save": "Save draft", "cancel": "Cancel", "search": "Search", "reset": "Reset", "all": "All", "vehicle": "Vehicle configuration", "technical": "Technical documentation", "testing": "Test records", "report": "Report", "certificate": "Certificate", "region": "Region", "country": "Country", "vehicleType": "Vehicle type", "draft": "Not started", "reviewing": "In review", "completed": "Completed", "rejected": "Rejected", "project": "Project ID", "projectName": "Project name", "used": "Used at", "user": "Used by", "type": "Template type", "entries": "Configuration entries", "item": "Entry", "format": "Format", "note": "Notes", "add": "Add entry", "remove": "Delete", "text": "Text", "number": "Number", "table": "Table", "rich": "Rich text", "required": "Enter a template name, version and entry names", "saved": "Draft saved", "leave": "Discard unsaved changes?", "back": "Back", "empty": "No matching records"},
reports: {"tasks": "Task management", "title": "Reports", "keyword": "Keyword", "status": "Status", "search": "Search", "reset": "Reset", "id": "Report ID", "project": "Project ID", "name": "Project name", "regulation": "Regulation ID", "owner": "Executor", "reviewer": "Reviewer", "actions": "Actions", "view": "View", "edit": "Fill in", "review": "Review", "export": "Export", "empty": "No matching reports", "back": "Back to list", "base": "Basic information", "content": "Report content", "summary": "Report description", "technical": "Technical reference", "testing": "Test record reference", "reference": "Reference value (read-only)", "gate": "Complete vehicle configuration first", "save": "Save draft", "submit": "Submit for review", "opinion": "Review comment", "approve": "Approve", "reject": "Reject", "history": "Review history", "noHistory": "No review history", "required": "Enter a report description", "opinionRequired": "Enter a review comment", "saved": "Operation completed", "leave": "Discard unsaved changes?", "confirmSubmit": "Submit this report for review?", "pending": "Pending submission", "reviewing": "In review", "completed": "Completed", "rejected": "Rejected", "template": "Export template", "standard": "Standard report · v1.0", "format": "PDF · A4 portrait (browser print)", "filename": "File name", "preview": "Preview and print", "exportNote": "Read-only system template. Save as PDF through browser print.", "cancel": "Cancel", "missing": "Report not found", "start": "Start date", "end": "Planned end", "actual": "Actual end"},
archive: {"title": "Project archive", "directory": "Directory", "projectSearch": "Search projects", "name": "Deliverable name", "activity": "Linked activity", "date": "Delivery date", "owner": "Owner", "actions": "Actions", "search": "Search", "reset": "Reset", "preview": "Preview file", "download": "Download", "empty": "No matching deliverables", "noProjects": "No matching projects", "count": "{count} deliverables", "columns": "Column settings", "restore": "Restore defaults", "show": "Visible columns", "density": "Table density", "normal": "Default", "compact": "Compact", "close": "Close", "downloadError": "Download failed. Please retry.", "all": "All activities"},
"vehicle": {"northAmerica": "North America", "southAmerica": "South America", "africa": "Africa", "oceania": "Oceania", "usa": "United States", "brazil": "Brazil", "egypt": "Egypt", "australia": "Australia", "fold": "Merge identical configurations", "expand": "Expand all","title": "Vehicle configuration", "search": "Search project ID or name", "all": "All statuses", "pending": "Pending submission", "reviewing": "In review", "completed": "Completed", "rejected": "Rejected", "id": "Project ID", "name": "Project name", "priority": "Priority", "start": "Start date", "end": "Planned end date", "actual": "Actual end date", "action": "Actions", "edit": "Edit", "detail": "Details", "review": "Review", "export": "Export", "back": "Back to list", "save": "Save draft", "submit": "Submit for review", "saved": "Saved", "required": "Complete all required fields", "basic": "Vehicle configuration", "items": "Configuration entries", "region": "Region", "country": "Country", "type": "Vehicle type", "template": "Template", "reviewer": "Reviewer", "executor": "Executor", "version": "Version", "note": "Description", "attachment": "Attachment (DOC, DOCX, PDF)", "add": "Add entry", "addColumn": "Add configuration", "remove": "Delete", "item": "Entry name", "format": "Format", "tag": "Tag", "value": "Configuration", "text": "Text", "number": "Number", "ordered": "Ordered number", "table": "Table", "rich": "Rich text", "pass": "Approve", "reject": "Reject", "opinion": "Review opinion", "reviewRequired": "Enter a review opinion", "normal": "Normal", "high": "High", "asia": "Asia", "europe": "Europe", "china": "China", "germany": "Germany", "car": "Passenger vehicle", "truck": "Commercial vehicle", "invalidFile": "Select a DOC, DOCX or PDF file", "unsaved": "You have unsaved changes. Leave this page?"},
tech: {"title": "Technical documents", "back": "Back", "keyword": "Keyword", "status": "Status", "search": "Search", "reset": "Reset", "regulation": "Regulation ID", "project": "Project ID", "name": "Project name", "owner": "Executor", "reviewer": "Reviewer", "actions": "Actions", "view": "View", "edit": "Edit", "review": "Review", "export": "Export", "gate": "Complete vehicle configuration before editing", "empty": "No matching documents", "base": "Basic information", "content": "Document content", "mass": "Curb weight (kg)", "opinion": "Review comments", "save": "Save draft", "submit": "Submit for review", "reject": "Reject", "pass": "Approve", "history": "Review history", "noHistory": "No review history", "required": "Enter a curb weight greater than zero", "opinionRequired": "Enter review comments", "saved": "Saved", "leave": "Discard unsaved changes?"},
"cert": {"title": "Certificates", "tasks": "Task management", "new": "New certificate", "number": "Certificate number", "issuer": "Issuing body", "agency": "Certification body", "issued": "Issue date", "expires": "Valid until", "file": "Certificate file", "regulations": "Regulations and certificates", "required": "Complete certificate number, issuing and certification bodies, issue date and upload a certificate", "delete": "Delete certificate", "deleteConfirm": "Delete this certificate?", "leave": "Discard unsaved changes?", "upload": "Upload certificate", "fileError": "Choose a PDF file up to 20 MB", "unavailable": "File has not been uploaded", "saved": "Saved", "project": "Select project", "history": "Review history"},
"sections": {"title": "Item management", "search": "Search", "reset": "Reset", "project": "Project ID", "name": "Project name", "law": "Regulation ID", "priority": "Priority", "type": "Task type", "status": "Status", "start": "Start date", "end": "Planned end", "actual": "Actual end", "action": "Actions", "view": "View", "edit": "Edit", "review": "Review", "export": "Export CSV", "all": "All", "save": "Save", "cancel": "Cancel", "note": "Review comment", "pass": "Approve", "reject": "Reject", "required": "Enter a review comment", "saved": "Changes saved", "detail": "Item details", "empty": "No matching items", "urgent": "Urgent", "high": "High", "normal": "Normal", "technical": "Technical documents", "test": "Test records", "certificate": "Certificate", "report": "Report", "notStarted": "Not started", "inProgress": "In progress", "pending": "Pending submission", "reviewing": "In review", "completed": "Completed", "rejected": "Rejected", "paused": "Paused"},
 "projects": {"title": "Project management", "new": "New project", "edit": "Edit project", "detail": "Project details", "back": "Back", "save": "Save", "start": "Start", "search": "Search", "reset": "Reset", "id": "Project ID", "name": "Project name", "brand": "Brand", "series": "Series", "model": "Model", "priority": "Priority", "owner": "Owner", "status": "Status", "tasks": "Task types", "begin": "Start date", "end": "Planned end date", "actual": "Actual end date", "actions": "Actions", "view": "View", "base": "Basic information", "content": "Project content", "executor": "Executor", "reviewer": "Reviewer", "target": "Target date", "template": "Template", "required": "Complete required fields and check date ranges", "saved": "Saved", "missing": "Project not found", "leave": "Discard unsaved changes?", "empty": "No matching projects", "all": "All", "urgent": "Urgent", "preferred": "Preferred", "normal": "Normal", "pending": "Not started", "active": "In progress", "review": "In review", "rejected": "Rejected", "completed": "Completed", "paused": "Paused", "vehicle": "Vehicle configuration", "technical": "Technical documentation", "testing": "Test records", "certificate": "Certificate", "report": "Report"},
      designSystem: {"unsaved": "This page has unsaved changes. Discard them?", "abandon": "Discard", "close": "Close","pagination": {"navigation": "List pagination", "size": "Rows per page", "perPage": "{count} / page", "previous": "Previous page", "next": "Next page", "jump": "Jump to", "pages": "/{count} pages"},"language": "Switch language", "theme": "Switch theme", "state": "Page state", "states": {"ready": "Ready", "empty": "Empty", "loading": "Loading", "error": "Error"}, "keyword": "Keyword", "search": "Search", "reset": "Reset", "list": "Design pattern records", "total": "{count} records", "edit": "Edit", "error": "Loading failed", "retry": "Retry", "id": "ID", "name": "Name", "noMatch": "No matching records", "empty": "No records", "detail": "Details", "saved": "Updated", "required": "Enter a name", "cancel": "Cancel", "save": "Save", "discard": "Discard your changes?", "confirm": "Confirm", "acknowledge": "Got it"},
"wb": {"title": "Workbench", "projects": "Total projects", "completion": "Completion rate", "distribution": "Project status", "materials": "Readiness / audit pass rate", "basis": "Two measures of the same materials", "ready": "Readiness", "pass": "Pass rate", "tasks": "Task status", "types": "Task types", "priority": "Project priorities", "audits": "Audit status", "regions": "Regulatory coverage", "certificates": "Certificates", "vehicle": "Vehicle certificates", "part": "Component certificates", "noCertificate": "No certificate data", "todo": "Audit work queue", "activity": "Recent activity", "search": "Search project ID, name or regulation ID", "all": "All statuses", "projectId": "Project ID", "name": "Project name", "regulation": "Regulation ID", "status": "Status", "date": "Created on", "action": "Action", "review": "View item", "detail": "Audit item details", "notice": "Business review services are not connected. This view shows prototype information only.", "empty": "No matching items", "total": "Total", "roles": "Roles: 1 administrator, 1 auditor, 1 project manager", "started": "Created project", "template": "Selected template", "filled": "Entered data", "submitted": "Submitted for review", "technical": "Technical materials", "test": "Testing", "testRecord": "Test records", "certificate": "Certificates", "report": "Reports", "europe": "Europe", "asia": "Asia", "normal": "Standard", "urgent": "Urgent", "high": "High", "notStarted": "Not started", "inProgress": "In progress", "completed": "Completed", "overdue": "Overdue", "pending": "Pending submission", "reviewing": "In review", "rejected": "Rejected", "paused": "Paused"},
      "overview": {
        "notices": {
          "system": {
            "title": "System message",
            "description": "The security check is complete. Review the latest findings."
          },
          "overdue": {
            "title": "Overdue task",
            "description": "A task is past its deadline. Please review it."
          },
          "alert": {
            "title": "Event alert",
            "description": "An event alert was detected. View the details."
          }
        }
      },
      "messageCenter": {
        "filter": "Filter by message type",
        "all": "All messages",
        "empty": "No messages match this filter"
      },
      "notices": {
        "system": "System notice",
        "license": "The license expires in 30 days. Renew it in time.",
        "overdue": "Overdue task",
        "overdueDetail": "A task is past its deadline. Please review it.",
        "alert": "Event alert",
        "alertDetail": "A HIGH-severity alert needs attention."
      },
      "pending": {
        "description": "This module is planned and will be available in a future release."
      },
      "shell": {
        "appName": "Platform",
        "navigation": "Main navigation",
        "theme": "Theme",
        "light": "Light",
        "dark": "Dark",
        "language": "Language",
        "chinese": "简体中文",
        "english": "English",
        "notifications": "Notifications",
        "noNotifications": "No notifications",
        "dismiss": "Dismiss notification",
        "collapseSidebar": "Collapse sidebar",
        "expandSidebar": "Expand sidebar"
      },
      "assistant": {
        "title": "AI assistant",
        "open": "Open AI assistant",
        "close": "Close AI assistant",
        "send": "Send",
        "placeholder": "Ask a question...",
        "welcome": "Hello, how can I help?",
        "question": "What tasks need attention today?",
        "tasks": "Three import/export tasks are running. Check the Import / Export panel for progress.",
        "unavailable": "The AI assistant is temporarily unavailable. Try again later."
      },
      "audit": {
        "listTitle": "Audit records",
        "filters": {
          "time": "Time",
          "actor": "Operator",
          "actionType": "Action type",
          "module": "Module",
          "result": "Result",
          "keyword": "Keyword",
          "keywordPlaceholder": "Search id, target, summary or operator",
          "search": "Search",
          "reset": "Reset",
          "all": "All",
          "settings": "Filter settings",
          "show": "Show ",
          "restore": "Restore defaults"
        },
        "columns": {
          "time": "Time",
          "actor": "Operator",
          "module": "Module",
          "actionType": "Action type",
          "target": "Target",
          "summary": "Summary",
          "result": "Result",
          "actions": "Actions",
          "settings": "Column settings"
        },
        "actions": {
          "detail": "Details",
          "export": "Export",
          "close": "Close"
        },
        "results": {
          "success": "Success",
          "failure": "Failure"
        },
        "actionTypes": {
          "login": "Sign-in",
          "view": "View",
          "create": "Create",
          "update": "Update",
          "delete": "Delete",
          "import": "Import",
          "export": "Export",
          "review": "Review",
          "grant": "Grant",
          "config": "Configure"
        },
        "modules": {
          "account": "Accounts & roles",
          "grant": "Grants",
          "audit": "Audit",
          "message": "Message center",
          "system": "System settings"
        },
        "roles": {
          "admin": "Administrator",
          "officer": "Officer",
          "owner": "Business owner"
        },
        "detail": {
          "title": "Audit details",
          "id": "Record ID",
          "time": "Time",
          "actor": "Operator",
          "module": "Module",
          "actionType": "Action type",
          "target": "Target",
          "summary": "Summary",
          "result": "Result"
        },
        "table": {
          "empty": "No audit records yet",
          "noMatch": "No audit records match the current filters",
          "pageSize": "Items per page",
          "navigation": "Audit records pagination"
        },
        "pagination": {
          "total": "{count} records in total",
          "perPage": "{count} / page",
          "previous": "Previous page",
          "next": "Next page",
          "jumpTo": "Go to",
          "totalPages": "/{count} pages"
        },
        "currentUser": "Current user",
        "export": {
          "empty": "No filtered audit records to export",
          "fail": "Export failed. Try again."
        },
        "exportNotice": {
          "title": "Export notice",
          "line1": "All audit records within the selected time range will be exported.",
          "line2": "The result can be viewed and downloaded in Import / Export – Download tasks.",
          "cancel": "Cancel",
          "confirm": "Export",
          "created": "Export task created. Download it in Import / Export – Download tasks."
        }
      },
      "taskCenter": {
        "title": "Import / Export",
        "tabs": {
          "import": "Import tasks",
          "download": "Download tasks"
        },
        "filters": {
          "module": "Module",
          "operator": "Operator",
          "time": "Time",
          "all": "All",
          "startDate": "Start date",
          "endDate": "End date",
          "search": "Search",
          "reset": "Reset"
        },
        "note": "Note: Exported data is kept on the platform for at most 30 days and is removed automatically afterwards.",
        "columns": {
          "module": "Module",
          "file": "File name",
          "operator": "Operator",
          "time": "Time",
          "stage": "Stage",
          "actions": "Actions"
        },
        "stages": {
          "processing": "Processing {progress}%",
          "importSuccess": "Total {total}, succeeded {ok}, failed {fail}",
          "partialFailPrefix": "Total {total}, succeeded {ok}, ",
          "partialFailCount": "{fail} failed",
          "importFailed": "Import failed",
          "exportSuccess": "Export succeeded",
          "exportFailed": "Export failed",
          "expired": "The file has expired and cannot be downloaded"
        },
        "actions": {
          "downloadFile": "Download file",
          "downloadErrorData": "Download error data",
          "noOperation": "——"
        },
        "empty": {
          "noRecord": "No data",
          "noMatch": "No matching content found"
        },
        "pagination": {
          "navigation": "Import / Export pagination",
          "total": "{count} records in total",
          "perPage": "{count} / page",
          "pageSizeAria": "Items per page",
          "previous": "Previous page",
          "next": "Next page",
          "jumpTo": "Go to",
          "totalPages": "/{count} pages",
          "invalidPage": "Enter a valid page number"
        },
        "fileNames": {
          "import": "Import",
          "export": "Export",
          "importError": "Import errors"
        },
        "modules": {
          "account": "Accounts & roles",
          "grant": "Grants",
          "audit": "Audit",
          "message": "Message center",
          "system": "System settings"
        },
        "feedback": {
          "startDownload": "Download started"
        }
      },
      "nav": {
        "audit": "Audit",
        "accounts": "Accounts & roles",
        "grants": "Grants"
      }
    }
  },
});

export default i18n;
