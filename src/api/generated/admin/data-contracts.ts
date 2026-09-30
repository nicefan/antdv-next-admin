/* eslint-disable */
/* tslint:disable */
export interface LoginParams {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResult {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  avatar: string;
  phone: string;
  gender?: "male" | "female";
  birthDate?: string;
  bio?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export type LocalizedText = Record<string, string>;
export interface Permission {
  id: string;
  name: string | LocalizedText;
  code: string;
  description: string;
  resource: string;
  action: string;
  type: "menu" | "button" | "api";
  parentId?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  status?: "active" | "inactive";
  visible?: boolean;
  children?: Permission[];
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null | null;
  leader?: string;
  phone?: string;
  email?: string;
  sort: number;
  status: "enabled" | "disabled";
  remark?: string;
  createTime: string;
  updateTime: string;
  children?: Department[];
}

export interface DeptQueryParams {
  name?: string;
  status?: "enabled" | "disabled";
}

export interface DictType {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "enabled" | "disabled";
  createTime: string;
  updateTime: string;
}

export interface DictData {
  id: string;
  typeCode: string;
  label: string;
  value: string;
  sort: number;
  status: "enabled" | "disabled";
  remark?: string;
  createTime: string;
  updateTime: string;
}

export type DictGroup = Record<string, DictData[]>;
export interface DictQueryParams {
  typeCode?: string;
  label?: string;
  value?: string;
  status?: "enabled" | "disabled";
  page?: number;
  pageSize?: number;
}

export interface DictTypeQueryParams {
  name?: string;
  code?: string;
  status?: "enabled" | "disabled";
  page?: number;
  pageSize?: number;
}

export interface SysConfig {
  id: string;
  name: string;
  key: string;
  value: string;
  valueType: "string" | "number" | "boolean" | "json";
  group: string;
  description?: string;
  builtIn: boolean;
  sort: number;
  createTime: string;
  updateTime: string;
}

export interface SysConfigQueryParams {
  name?: string;
  key?: string;
  group?: string;
  page?: number;
  pageSize?: number;
}

export interface SysFile {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  ext: string;
  storage: "local" | "oss" | "cos";
  uploader: string;
  remark?: string;
  createTime: string;
}

export interface SysFileQueryParams {
  name?: string;
  ext?: string;
  storage?: string;
  page?: number;
  pageSize?: number;
}

export interface OperationLog {
  id: string;
  username: string;
  module: string;
  action: "login" | "logout" | "create" | "update" | "delete" | "export" | "import" | "other";
  description: string;
  method: string;
  url: string;
  ip: string;
  browser: string;
  os: string;
  status: "success" | "fail";
  errorMsg?: string;
  duration: number;
  createTime: string;
}

export interface LoginLog {
  id: string;
  username: string;
  ip: string;
  browser: string;
  os: string;
  status: "success" | "fail";
  message: string;
  createTime: string;
}

export interface OperationLogQueryParams {
  username?: string;
  module?: string;
  action?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface LoginLogQueryParams {
  username?: string;
  ip?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface UserInput {
  id?: string;
  username: string;
  email: string;
  realName: string;
  avatar?: string;
  phone?: string;
  gender?: "male" | "female";
  birthDate?: string;
  bio?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  roles?: Role[];
  permissions?: Permission[];
  roleIds?: string[];
}

export interface RoleInput {
  id?: string;
  name: string;
  code: string;
  description?: string;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
  permissionIds?: string[];
}

export interface PermissionInput {
  id?: string;
  name?: string | LocalizedText;
  code?: string;
  description?: string;
  resource?: string;
  action?: string;
  type?: "menu" | "button" | "api";
  parentId?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  status?: "active" | "inactive";
  visible?: boolean;
  children?: Permission[];
}

export interface DepartmentInput {
  id?: string;
  name?: string;
  parentId?: string | null | null;
  leader?: string;
  phone?: string;
  email?: string;
  sort?: number;
  status?: "enabled" | "disabled";
  remark?: string;
  createTime?: string;
  updateTime?: string;
  children?: Department[];
}

export interface DictTypeInput {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: "enabled" | "disabled";
  createTime?: string;
  updateTime?: string;
}

export interface DictDataInput {
  id?: string;
  typeCode?: string;
  label?: string;
  value?: string;
  sort?: number;
  status?: "enabled" | "disabled";
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface SysConfigInput {
  id?: string;
  name?: string;
  key?: string;
  value?: string;
  valueType?: "string" | "number" | "boolean" | "json";
  group?: string;
  description?: string;
  builtIn?: boolean;
  sort?: number;
  createTime?: string;
  updateTime?: string;
}

export interface UserPage {
  list: User[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface RolePage {
  list: Role[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface DictTypePage {
  list: DictType[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface DictDataPage {
  list: DictData[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface SysConfigPage {
  list: SysConfig[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface SysFilePage {
  list: SysFile[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface OperationLogPage {
  list: OperationLog[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface LoginLogPage {
  list: LoginLog[];
  total: number;
  current?: number;
  page?: number;
  pageSize: number;
}

export interface UserQuery {
  current?: number;
  pageSize?: number;
  username?: string;
  email?: string;
  status?: string;
  gender?: string[];
  sorter?: Record<string, any>;
}

export interface RoleQuery {
  current?: number;
  pageSize?: number;
  name?: string;
  code?: string;
}

export interface PermissionQuery {
  name?: string;
  code?: string;
  type?: string;
}
