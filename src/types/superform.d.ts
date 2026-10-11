import type { TableColumnType, TableProps } from 'antdv-next';
import type { Ref } from 'vue';
import type { HeaderFilter } from '@/components/Native/Table/types';
import type CodeEditor from '@/components/Fields/CodeEditor/index.vue';
import type RemoteSelect from '@/components/Fields/RemoteSelect/index.vue';
import type I18nInput from '@/components/I18nInput/index.vue';
import type IconPicker from '@/components/IconPicker/index.vue';
import type JsonInput from '@/components/JsonInput/index.vue';

import 'superform-antdv';

declare module 'superform-antdv' {
  interface CustomFormComponentProps {
    CodeEditor: InstanceType<typeof CodeEditor>['$props'];
    RemoteSelect: InstanceType<typeof RemoteSelect>['$props'];
    RemoteTreeSelect: InstanceType<typeof RemoteSelect>['$props'];
    JsonInput: InstanceType<typeof JsonInput>['$props'];
    I18nInput: InstanceType<typeof I18nInput>['$props'];
    IconPicker: InstanceType<typeof IconPicker>['$props'];
  }
}

// 扩展属性位于原有 Schema.attrs；声明补充不会创建另一套业务协议。
declare module 'superform-antdv' {
  interface TableSchemaProps {
    tableTools?: false | string[];
    toolbarTarget?: HTMLElement | null | Ref<HTMLElement | null>;
    onReload?: () => unknown;
    onFilterChange?: TableProps['onChange'];
    onSortChange?: TableProps['onChange'];
  }
  interface UploadSchemaProps {
    dragger?: boolean;
  }
}

declare global {
  namespace SuperFormTypeRegistry {
    interface UITableComponentPropSources {
      admin: {
        Column: TableColumnType & { headerFilter?: HeaderFilter; resizable?: boolean };
      };
    }
  }
}
