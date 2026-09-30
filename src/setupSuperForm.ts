import superForm, { registerComponents, configure } from 'superform-antdv';
import { fieldComponents } from 'superform-antdv/components';
import { computed, defineAsyncComponent } from 'vue';

import RemoteSelect from '@/components/Fields/RemoteSelect/index.vue';
import I18nInput from '@/components/I18nInput/index.vue';
import IconPicker from '@/components/IconPicker/index.vue';
import JsonInput from '@/components/JsonInput/index.vue';
import {
  renderNativeForm,
  renderNativeTable,
  renderNativeModal,
} from '@/components/Native/Table/adapter';
import { renderNativeUpload } from '@/components/Native/Upload';
import { $t } from '@/locales';
import { appDefaultSettings } from '@/settings';
import { useAuthStore } from '@/stores/auth';
import { useDictStore } from '@/stores/dict';

export function setupSuperForm(): void {
  superForm.initialize({
    components: fieldComponents,
    overrides: {
      render: {
        form: renderNativeForm,
        table: renderNativeTable,
        modal: renderNativeModal,
        upload: renderNativeUpload,
      },
    },
  });
  // 动态标签只负责显示，输入提示使用响应式文案，避免标签函数被拼接为字符串。
  const inputPlaceholder = computed(() => $t('proForm.enterPlaceholder', { label: '' }).trim());
  const selectPlaceholder = computed(() => $t('proForm.selectPlaceholder', { label: '' }).trim());
  registerComponents({
    JsonInput,
    I18nInput,
    IconPicker,
    CodeEditor: {
      component: defineAsyncComponent(() => import('@/components/Fields/CodeEditor/index.vue')),
      model: { prop: 'modelValue', event: 'update:modelValue' },
    },
    RemoteSelect,
    RemoteTreeSelect: RemoteSelect,
  });
  configure({
    buttonRoles: () => {
      const auth = useAuthStore();
      const permissions = [...auth.userPermissions];
      // 内置按钮通过 includes 判定权限，沿用本项目 '*' 全权限规则。
      permissions.includes = (permission: string) => auth.hasPermission(permission);
      return permissions;
    },
    tableApiSetting: { currentField: 'current', sizeField: 'pageSize' },
    defaultProps: {
      Table: { size: appDefaultSettings.table.size, bordered: appDefaultSettings.table.bordered },
      Input: { placeholder: inputPlaceholder },
      InputPassword: { placeholder: inputPlaceholder },
      TextArea: { placeholder: inputPlaceholder },
      InputNumber: { placeholder: inputPlaceholder },
      Select: { placeholder: selectPlaceholder, allowClear: appDefaultSettings.select.allowClear },
      TreeSelect: { placeholder: selectPlaceholder },
      DatePicker: { valueFormat: undefined, allowClear: appDefaultSettings.datePicker.allowClear },
      DateRangePicker: {
        valueFormat: undefined,
        allowClear: appDefaultSettings.datePicker.allowClear,
      },
      TimePicker: { valueFormat: undefined },
    },
    async dictApi(name: string) {
      const dictStore = useDictStore();
      await dictStore.loadDictData();
      return dictStore.getDictOptions(name);
    },
  });
}
