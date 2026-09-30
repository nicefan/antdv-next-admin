// 兼容既有业务和 Mock 的类型入口；接口契约只有 Codegen 一处来源。
export type {
  LoginParams,
  LoginResult,
  User,
  Role,
  LocalizedText,
  Permission,
} from '@/api/generated/admin/data-contracts';
