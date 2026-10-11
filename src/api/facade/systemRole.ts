import type { Permission, RoleInput } from '../generated/admin/data-contracts';
import { permissionsApi } from '../generated/admin/Permission';
import { rolesApi } from '../generated/admin/Role';

export type RoleEditorData = RoleInput & { permissionIds: string[] };

export async function getRoleEditor(id: string) {
  const role = await rolesApi.getRoleById(id);
  return { ...role, permissionIds: role.permissions.map((permission) => permission.id) };
}

export async function saveRoleEditor(data: RoleEditorData, permissions: Map<string, Permission>) {
  const selectedPermissions = await Promise.all(
    data.permissionIds.map((id) => permissions.get(id) || permissionsApi.getPermissionById(id)),
  );
  const payload: RoleInput = {
    name: data.name.trim(),
    code: data.code.trim(),
    description: data.description?.trim(),
    permissions: selectedPermissions,
  };
  return data.id ? rolesApi.updateRole(data.id, payload) : rolesApi.createRole(payload);
}
