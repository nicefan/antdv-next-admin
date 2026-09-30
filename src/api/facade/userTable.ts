import type { UserInput } from '@/api/generated/admin/data-contracts';

import { usersApi } from '@/api/generated/admin/User';

type UserQuery = NonNullable<Parameters<typeof usersApi.getUserList>[0]>;

function toUserInput(data: UserInput): UserInput {
  // 表格记录还包含角色、权限等展示信息，只提交当前表单负责的业务字段。
  return {
    username: data.username,
    email: data.email,
    realName: data.realName,
    phone: data.phone,
    gender: data.gender,
    status: data.status,
    bio: data.bio,
  };
}

// 适配 SuperTable 的分页及 CRUD 签名；生成目录保持纯接口职责。
export const userTableApi = {
  async query(params: Record<string, unknown>, config?: RequestConfig) {
    const query: UserQuery = {
      current: Number(params.current ?? 1),
      pageSize: Number(params.pageSize ?? 10),
      username: params.username ? String(params.username) : undefined,
      email: params.email ? String(params.email) : undefined,
      status: params.status ? String(params.status) : undefined,
      gender: params.gender
        ? (Array.isArray(params.gender) ? params.gender : [params.gender]).map(String)
        : undefined,
    };
    const result = await usersApi.getUserList(query, config);
    return {
      records: result.list,
      total: result.total,
      current: result.current,
      size: result.pageSize,
    };
  },
  info: (id: string) => usersApi.getUserById(id),
  save: (data: UserInput) => usersApi.createUser(toUserInput(data)),
  update(data: UserInput & { id: string }) {
    return usersApi.updateUser(data.id, toUserInput(data));
  },
  delete: (ids: string[]) => Promise.all(ids.map((id) => usersApi.deleteUser(id))),
};
