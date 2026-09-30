<template>
  <div class="page-container">
    <div class="card">
      <h2>{{ $t('form.title') }}</h2>
      <p class="mb-lg">{{ $t('exampleForm.description') }}</p>

      <SuperForm
        ref="formRef"
        :schema="{
          slots: { after: 'after' },
          subSpan: 12,
          subItems: formItems,
          onSubmit: handleSubmit,
        }"
      >
        <template #after>
          <a-space>
            <a-button type="primary" @click="formRef?.submit()">
              {{ $t('common.submit') }}
            </a-button>
            <a-button @click="handleReset">
              {{ $t('common.reset') }}
            </a-button>
          </a-space>
        </template>
      </SuperForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RemoteOption } from '@/components/Fields/RemoteSelect/index.vue';
import type { TreeSelectProps } from 'antdv-next';
import type { UniOption } from 'superform-antdv';

import { message } from 'antdv-next';
import { SuperForm } from 'superform-antdv';
import { computed, ref } from 'vue';

import { $t } from '@/locales';
import { commonRules } from '@/utils/formRules';

import {
  createLazyChildren,
  searchRemoteTree,
  searchRemoteUsers,
  type RemoteTreeNode,
} from './remoteData';

const formRef = ref();

const lazyTreeLoading = ref(false);
const lazyTreeData = ref<RemoteTreeNode[]>([
  { title: 'North Region', value: 'north-region' },
  { title: 'South Region', value: 'south-region' },
  { title: 'Headquarters', value: 'headquarters', isLeaf: true },
]);
function toRemoteOptions(nodes: RemoteTreeNode[]): RemoteOption[] {
  return nodes.map((node) => ({
    label: node.title,
    value: node.value,
    children: node.children ? toRemoteOptions(node.children) : undefined,
  }));
}

async function waitForRemoteData(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
}

async function searchRemoteUserOptions(keyword: string): Promise<RemoteOption[]> {
  await waitForRemoteData();
  return searchRemoteUsers(keyword);
}

async function searchRemoteTreeOptions(keyword: string): Promise<RemoteOption[]> {
  await waitForRemoteData();
  const results = searchRemoteTree(keyword);
  return toRemoteOptions(results);
}

const formItems = computed<UniOption[]>(() => [
  {
    type: 'Input',
    field: 'username',
    label: () => $t('user.username'),
    required: true,
    rules: [commonRules.length(3, 20), commonRules.username()],
    dynamicAttrs: () => ({
      placeholder: $t('login.usernamePlaceholder'),
    }),
  },
  {
    type: 'Input',
    field: 'email',
    label: () => $t('user.email'),
    required: true,
    rules: [commonRules.email()],
  },
  {
    type: 'InputPassword',
    field: 'password',
    label: () => $t('login.password'),
    required: true,
    rules: [commonRules.password()],
  },
  {
    type: 'InputPassword',
    field: 'confirmPassword',
    label: () => $t('profile.confirmPassword'),
    required: true,
    formItemProps: { dependencies: ['password'] },
    rules: [commonRules.confirmPassword()],
  },
  { type: 'Input', field: 'phone', label: () => $t('user.phone'), rules: [commonRules.phone()] },
  {
    type: 'InputNumber',
    field: 'age',
    label: () => $t('exampleForm.age'),
    rules: [commonRules.range(1, 150, $t('exampleForm.ageRange'))],
    dynamicAttrs: () => ({
      min: 1,
      max: 150,
    }),
  },
  {
    type: 'Select',
    field: 'gender',
    label: () => $t('user.gender'),
    required: true,
    options: {
      source: () => [
        { label: $t('user.male'), value: 'male' },
        { label: $t('user.female'), value: 'female' },
      ],
    },
  },
  {
    type: 'Select',
    field: 'role',
    label: () => $t('user.role'),
    required: true,
    options: {
      source: () => [
        { label: $t('exampleForm.roles.admin'), value: 'admin' },
        { label: $t('exampleForm.roles.user'), value: 'user' },
        { label: $t('exampleForm.roles.guest'), value: 'guest' },
      ],
    },
  },
  {
    type: 'CheckboxGroup',
    field: 'interests',
    label: () => $t('exampleForm.interests'),
    options: {
      source: () => [
        { label: $t('exampleForm.interestOptions.reading'), value: 'reading' },
        { label: $t('exampleForm.interestOptions.sports'), value: 'sports' },
        { label: $t('exampleForm.interestOptions.music'), value: 'music' },
        { label: $t('exampleForm.interestOptions.travel'), value: 'travel' },
      ],
    },
  },
  {
    type: 'DatePicker',
    field: 'birthDate',
    label: () => $t('exampleForm.birthDate'),
    dynamicAttrs: () => ({
      format: 'YYYY-MM-DD',
    }),
  },
  { type: 'Switch', field: 'status', label: () => $t('common.status'), initialValue: true },
  { type: 'Rate', field: 'score', label: () => $t('exampleForm.score'), initialValue: 3 },
  {
    type: 'Slider',
    field: 'progress',
    label: () => $t('exampleForm.progress'),
    initialValue: 50,
    dynamicAttrs: () => ({
      min: 0,
      max: 100,
    }),
  },
  {
    type: 'RemoteSelect',
    field: 'remoteUser',
    label: () => $t('exampleForm.remote.selectTitle'),
    tooltip: () => $t('exampleForm.remote.selectHint'),
    dynamicAttrs: () => ({
      request: searchRemoteUserOptions,
      placeholder: $t('exampleForm.remote.selectPlaceholder'),
    }),
  },
  {
    type: 'TreeSelect',
    field: 'lazyOrganization',
    label: () => $t('exampleForm.remote.lazyTreeTitle'),
    options: { source: () => toRemoteOptions(lazyTreeData.value) },
    tooltip: () => $t('exampleForm.remote.lazyTreeHint'),
    dynamicAttrs: () => ({
      placeholder: $t('exampleForm.remote.lazyTreePlaceholder'),
      showSearch: false,
      ...{
        loadData: loadLazyTreeData,
        loading: lazyTreeLoading.value,
      },
    }),
  },
  {
    type: 'RemoteTreeSelect',
    field: 'remoteOrganization',
    label: () => $t('exampleForm.remote.searchTreeTitle'),
    tooltip: () => $t('exampleForm.remote.searchTreeHint'),
    dynamicAttrs: () => ({
      request: searchRemoteTreeOptions,
      placeholder: $t('exampleForm.remote.searchTreePlaceholder'),
      tree: true,
    }),
  },
  {
    type: 'TextArea',
    field: 'bio',
    label: () => $t('user.bio'),
    span: 2 * 12,
    dynamicAttrs: () => ({
      rows: 4,
      maxLength: 500,
      showCount: true,
      placeholder: $t('exampleForm.bioPlaceholder'),
    }),
  },
]);

const handleSubmit = (values: Record<string, unknown>) => {
  console.log('Form values:', values);
  message.success($t('exampleForm.submitSuccess'));
};

const handleReset = () => {
  formRef.value?.resetFields();
};

function appendLazyChildren(nodes: RemoteTreeNode[], parentValue: string): RemoteTreeNode[] {
  return nodes.map((node) => {
    if (node.value === parentValue) {
      return node.children ? node : { ...node, children: createLazyChildren(parentValue) };
    }
    if (!node.children) return node;
    return { ...node, children: appendLazyChildren(node.children, parentValue) };
  });
}

const loadLazyTreeData: TreeSelectProps['loadData'] = async (node) => {
  const parentValue = typeof node.value === 'string' ? node.value : '';
  if (!parentValue || node.children) return;

  lazyTreeLoading.value = true;
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  lazyTreeData.value = appendLazyChildren(lazyTreeData.value, parentValue);
  lazyTreeLoading.value = false;
};
</script>

<style scoped lang="scss">
.mb-lg {
  margin-bottom: var(--spacing-lg);
}
</style>
