# Store 约定

遵循 [根 AGENTS](../../AGENTS.md) 和 [本地指南入口](../../AI_GUIDE.md)。

Store 管理会话和跨页面业务状态，调用生成 API 或必要的 facade。字典等公共结果复用统一缓存，身份变化清理缓存；不自行创建 Axios、缓存作用域或重复解包响应。
