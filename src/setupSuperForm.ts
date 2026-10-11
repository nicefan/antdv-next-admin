import superForm, { registerComponents, configure, enUS, zhCN } from 'superform-antdv';
import { fieldComponents } from 'superform-antdv/components';
import { defineAsyncComponent } from 'vue';

import RemoteSelect from '@/components/Fields/RemoteSelect/index.vue';
import I18nInput from '@/components/I18nInput/index.vue';
import IconPicker from '@/components/IconPicker/index.vue';
import JsonInput from '@/components/JsonInput/index.vue';
import { renderNativeForm, renderNativeTable } from '@/components/Native/Table/adapter';
import { renderNativeUpload } from '@/components/Native/Upload';
import { getLocale } from '@/locales';
import NativeModal from '@/components/Native/Modal/index.vue';
import { appDefaultSettings } from '@/settings';
import { useAuthStore } from '@/stores/auth';
import { useDictStore } from '@/stores/dict';

export function setupSuperForm(): void {
  superForm.initialize({
    components: fieldComponents,
    overrides: {
      uiComponents: {
        modal: {
          component: NativeModal,
          // 组件覆盖须显式映射 Core 的弹窗协议；原生上下文 service 继续沿用官方实现。
          adaptProps: ({ visible, 'onUpdate:visible': onVisibleChange, destroyOnClose, ...attrs }) => ({
            ...attrs,
            open: visible,
            destroyOnHidden: destroyOnClose,
            'onUpdate:open': onVisibleChange,
          }),
        },
      },
      render: {
        form: renderNativeForm,
        table: renderNativeTable,
        upload: renderNativeUpload,
      },
    },
  });
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
    locale: getLocale() === 'en-US' ? enUS : zhCN,
    defaultProps: {
      SuperTable: {
        pageTransform: ({ current, size }) => ({ current, pageSize: size }),
      },
      Table: { size: appDefaultSettings.table.size, bordered: appDefaultSettings.table.bordered },
      Select: { allowClear: appDefaultSettings.select.allowClear },
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
