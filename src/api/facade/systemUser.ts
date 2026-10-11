import type { Role, UserInput } from '../generated/admin/data-contracts';
import { rolesApi } from '../generated/admin/Role';
import { usersApi } from '../generated/admin/User';

export type UserEditorData = UserInput & { roleIds: string[] };

export async function getUserEditor(id: string) {
  const user = await usersApi.getUserById(id);
  return { ...user, roleIds: user.roles.map((role) => role.id) };
}

export async function saveUserEditor(data: UserEditorData, roles: Role[]) {
  // 选项分页未包含的已有角色仍需保留，不能在编辑保存时静默丢失。
  const selectedRoles = await Promise.all(
    data.roleIds.map((id) => roles.find((role) => role.id === id) || rolesApi.getRoleById(id)),
  );
  const payload: UserInput = {
    username: data.username.trim(),
    realName: data.realName.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim(),
    gender: data.gender,
    status: data.status,
    bio: data.bio?.trim(),
    roles: selectedRoles,
  };
  return data.id ? usersApi.updateUser(data.id, payload) : usersApi.createUser(payload);
}
