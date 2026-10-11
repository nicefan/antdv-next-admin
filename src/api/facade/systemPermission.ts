import type { PermissionInput, LocalizedText } from '../generated/admin/data-contracts';
import { permissionsApi } from '../generated/admin/Permission';
import { getLocale } from '@/locales';
import { resolveLocalizedText } from '@/utils/localizedText';
export type PermissionEditorData = PermissionInput & { code: string };
export function localizedPermissionName(value: string): LocalizedText {
  return { 'zh-CN': value, 'en-US': value, 'ja-JP': value, 'ko-KR': value };
}
export async function getPermissionEditor(id: string, localized: boolean) {
  const permission = await permissionsApi.getPermissionById(id);
  return {
    ...permission,
    name: localized ? typeof permission.name === 'string' ? localizedPermissionName(permission.name) : permission.name : resolveLocalizedText(permission.name, getLocale()),
    status: permission.status || 'active',
    visible: permission.visible !== false,
  };
}
export function savePermissionEditor(data: PermissionEditorData) {
  const code = data.code.trim();
  const route = data.path?.trim() || '';
  const path = route && !route.startsWith('/') ? `/${route}` : route;
  const menu = data.type === 'menu';
  const payload: PermissionInput = {
    name: data.name,
    code,
    type: data.type,
    description: data.description?.trim(),
    parentId: data.parentId,
    status: data.status,
    visible: data.visible,
    sort: Number(data.sort ?? 0),
    path: menu ? path : undefined,
    component: menu ? data.component?.trim() || undefined : undefined,
    icon: menu ? data.icon?.trim() || undefined : undefined,
    resource: menu ? path : code.replace(/\.[^.]+$/, ''),
    action: menu ? 'view' : code.split('.').pop() || '*',
  };
  return data.id ? permissionsApi.updatePermission(data.id, payload) : permissionsApi.createPermission(payload);
}
