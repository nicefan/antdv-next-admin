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
