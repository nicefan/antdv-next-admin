# SuperForm 使用范围

业务开发遵循 [AGENTS](../AGENTS.md)，本次改造要求见 [改造规范](./refactor-spec.md)。

| 场景 | 当前入口 |
| --- | --- |
| 登录、密码修改、系统配置、字典、部门编辑 | SuperForm / useForm |
| 用户、角色、权限和表格示例编辑 | SuperForm + NativeModal |
| 业务列表和本地列表示例 | SuperTable 原生 Schema |
| 部门、主从表示例详情 | SuperDetail，必要时加独立 DetailPanel |
| JSON、多语言、图标、代码编辑器、远程选项 | 统一注册的自定义 field |
| 上传及失败重试 | SuperForm Upload 的提交上传模式 |
| 图表、统计卡片、分栏、分步交互 | Display 与 Layout 独立组件 |

旧 Pro 目录及其表单、表格配置转换已移除。外部原生 Table 和 Modal 增强通过 Adapter overrides 注册；它们不拥有另一套业务请求或表单状态。

完整使用方式以 [本地依赖指南](../AI_GUIDE.md) 为准。类型检查与运行验证不同，实际验证记录见改造规范。
