import type { SysConfigInput } from '../generated/admin/data-contracts';
import { configApi } from '../generated/admin/Config';
export type ConfigEditorData = SysConfigInput & { id?: string };
export function saveConfigEditor(data: ConfigEditorData) {
  const payload: SysConfigInput = {
    name: data.name?.trim(),
    key: data.key?.trim(),
    value: data.valueType === 'boolean' ? String(data.value === 'true') : String(data.value ?? ''),
    valueType: data.valueType,
    group: data.group,
    sort: data.sort,
    description: data.description?.trim()
  };
  return data.id ? configApi.updateConfig(data.id, payload) : configApi.createConfig(payload);
}
