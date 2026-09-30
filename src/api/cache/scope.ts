import { createCacheScope } from 'async-result-cache/vue';

// 仅保存当前登录会话的基础数据；退出登录统一清理，避免跨账号复用。
export const referenceCache = createCacheScope();
