<template>
  <div class="page-container">
    <div class="card">
      <h2>{{ $t('examples.scaffold.complexForm.title') }}</h2>
      <p class="text-secondary mb-lg">
        {{ $t('examples.scaffold.complexForm.description') }}
      </p>

      <StepFlow
        v-model="currentStep"
        :steps="stepDefinitions"
        :loading="submitting"
        @next="nextStep"
        @submit="submitForm"
      >
        <template #step-0>
          <SuperForm @register="registerBasicForm" />
        </template>

        <template #step-1>
          <div class="mb-md">
            <a-space>
              <a-button type="dashed" @click="addRule">{{
                $t('examples.scaffold.complexForm.addRuleButton')
              }}</a-button>
              <a-tag>{{
                $t('examples.scaffold.complexForm.currentRulesCount', {
                  count: formState.rules.length,
                })
              }}</a-tag>
            </a-space>
          </div>

          <SuperForm @register="registerRuleForm" />

          <a-alert v-if="ruleError" class="mt-md" type="error" show-icon :message="ruleError" />
        </template>

        <template #step-2>
          <SuperForm @register="registerPublishForm" />
        </template>

        <template #extra-actions>
          <a-button @click="saveDraft">{{
            $t('examples.scaffold.complexForm.saveDraftButton')
          }}</a-button>
          <a-button :disabled="submitting" @click="resetForm">{{
            $t('examples.scaffold.complexForm.resetButton')
          }}</a-button>
        </template>
      </StepFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StepFlowStep } from '@/types/display';
import type { Dayjs } from 'dayjs';

import { message } from 'antdv-next';
import { SuperForm, useForm } from 'superform-antdv';
import { computed, onMounted, reactive, ref } from 'vue';

import StepFlow from '@/components/Layout/StepFlow/index.vue';
import { $t } from '@/locales';

interface PolicyRule {
  id: string;
  metric: string;
  operator: '>' | '>=' | '<' | '<=';
  threshold: number | null;
}

interface FormState {
  projectName: string;
  owner: string;
  scene: string;
  description: string;
  rules: PolicyRule[];
  publishType: 'immediate' | 'schedule';
  publishTime: Dayjs | null;
  notifyUsers: string[];
}

const DRAFT_KEY = 'example:complex-form:draft';

const currentStep = ref(0);
const ruleError = ref('');

const stepDefinitions = computed<StepFlowStep[]>(() => [
  {
    title: $t('examples.scaffold.complexForm.step1Title'),
    description: $t('examples.scaffold.complexForm.step1Description'),
  },
  {
    title: $t('examples.scaffold.complexForm.step2Title'),
    description: $t('examples.scaffold.complexForm.step2Description'),
  },
  {
    title: $t('examples.scaffold.complexForm.step3Title'),
    description: $t('examples.scaffold.complexForm.step3Description'),
  },
]);

const formState = reactive<FormState>({
  projectName: '',
  owner: '',
  scene: '',
  description: '',
  rules: [
    {
      id: `${Date.now()}`,
      metric: 'error_rate',
      operator: '>',
      threshold: 5,
    },
  ],
  publishType: 'immediate',
  publishTime: null,
  notifyUsers: [],
});

const sceneOptions = computed(() => [
  { label: $t('examples.scaffold.complexForm.sceneGrowth'), value: 'growth' },
  { label: $t('examples.scaffold.complexForm.sceneRisk'), value: 'risk' },
  {
    label: $t('examples.scaffold.complexForm.sceneStability'),
    value: 'stability',
  },
]);

const operatorOptions = [
  { label: '>', value: '>' },
  { label: '>=', value: '>=' },
  { label: '<', value: '<' },
  { label: '<=', value: '<=' },
];

const checkProjectNameUnique = async (_rule: unknown, value: string) => {
  // 空值由 required 规则处理,这里只负责唯一性校验,避免重复提示
  if (!value) {
    return Promise.resolve();
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  const reservedNames = ['default', 'admin', 'production'];
  if (reservedNames.includes(value.trim().toLowerCase())) {
    return Promise.reject(new Error($t('examples.scaffold.complexForm.projectNameExists')));
  }

  return Promise.resolve();
};

const rules = computed(() => ({
  projectName: [
    {
      required: true,
      message: $t('examples.scaffold.complexForm.projectNameRequired'),
    },
    { validator: checkProjectNameUnique, trigger: 'blur' },
  ],
  owner: [
    {
      required: true,
      message: $t('examples.scaffold.complexForm.ownerRequired'),
    },
  ],
  scene: [
    {
      required: true,
      message: $t('examples.scaffold.complexForm.sceneRequired'),
    },
  ],
  publishType: [
    {
      required: true,
      message: $t('examples.scaffold.complexForm.publishTypeRequired'),
    },
  ],
}));

const validatePublishTime = async () => {
  if (formState.publishType === 'schedule' && !formState.publishTime) {
    return Promise.reject(new Error($t('examples.scaffold.complexForm.publishTimeRequired')));
  }
  return Promise.resolve();
};

const [registerBasicForm, basicForm] = useForm({
  dataSource: formState,
  subSpan: 12,
  dynamicAttrs: () => ({ layout: 'vertical', rules: rules.value }),
  subItems: [
    {
      type: 'Input',
      field: 'projectName',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.projectNameLabel'),
      dynamicAttrs: () => ({
        placeholder: $t('examples.scaffold.complexForm.projectNamePlaceholder'),
      }),
    },
    {
      type: 'Input',
      field: 'owner',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.ownerLabel'),
      dynamicAttrs: () => ({ placeholder: $t('examples.scaffold.complexForm.ownerPlaceholder') }),
    },
    {
      type: 'Select',
      field: 'scene',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.sceneLabel'),
      options: { source: () => sceneOptions.value },
    },
    {
      type: 'TextArea',
      field: 'description',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.descriptionLabel'),
      attrs: { rows: 3 },
    },
  ],
});
const [registerRuleForm, ruleForm] = useForm({
  dataSource: formState,
  attrs: { layout: 'vertical' },
  subItems: [
    {
      type: 'InputList',
      field: 'rules',
      span: 24,
      rowButtons: {
        labelMode: 'label',
        actions: [
          {
            label: () => $t('examples.scaffold.complexForm.deleteButton'),
            attrs: { danger: true },
            onClick: ({ index }: { index: number }) => formState.rules.splice(index, 1),
          },
        ],
      },
      columns: [
        { type: 'Hidden', field: 'id' },
        {
          type: 'Input',
          field: 'metric',
          span: 10,
          dynamicAttrs: () => ({
            placeholder: $t('examples.scaffold.complexForm.metricPlaceholder'),
          }),
        },
        {
          type: 'Select',
          field: 'operator',
          span: 6,
          initialValue: '>',
          options: { source: operatorOptions },
        },
        {
          type: 'InputNumber',
          field: 'threshold',
          span: 8,
          attrs: { min: 0, max: 10000, style: { width: '100%' } },
        },
      ],
    },
  ],
});
const [registerPublishForm, publishForm] = useForm({
  dataSource: formState,
  subSpan: 12,
  dynamicAttrs: () => ({
    layout: 'vertical',
    rules: {
      publishType: rules.value.publishType,
      publishTime: [{ validator: validatePublishTime, trigger: 'change' }],
    },
  }),
  subItems: [
    {
      type: 'RadioGroup',
      field: 'publishType',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.publishTypeLabel'),
      options: {
        source: () => [
          { label: $t('examples.scaffold.complexForm.publishImmediate'), value: 'immediate' },
          { label: $t('examples.scaffold.complexForm.publishSchedule'), value: 'schedule' },
        ],
      },
    },
    {
      type: 'DatePicker',
      field: 'publishTime',
      colProps: { xs: 24, lg: 12 },
      label: () => $t('examples.scaffold.complexForm.publishTimeLabel'),
      disabled: () => formState.publishType !== 'schedule',
      attrs: { showTime: true, valueFormat: undefined, style: { width: '100%' } },
      formItemProps: { dependencies: ['publishType'] },
    },
    {
      type: 'Select',
      field: 'notifyUsers',
      span: 24,
      label: () => $t('examples.scaffold.complexForm.notifyUsersLabel'),
      attrs: { mode: 'tags', tokenSeparators: [','] },
    },
  ],
});

const validateRuleList = () => {
  if (formState.rules.length === 0) {
    ruleError.value = $t('examples.scaffold.complexForm.ruleListEmpty');
    return false;
  }

  const invalid = formState.rules.some((item) => {
    return !item.metric || !item.operator || item.threshold == null;
  });

  if (invalid) {
    ruleError.value = $t('examples.scaffold.complexForm.ruleListIncomplete');
    return false;
  }

  ruleError.value = '';
  return true;
};

const addRule = () => {
  formState.rules.push({
    id: `${Date.now()}-${Math.random()}`,
    metric: '',
    operator: '>',
    threshold: null,
  });
};

const nextStep = async (step: number) => {
  if (step === 0) {
    try {
      await basicForm.submit();
    } catch {
      return;
    }
  }

  if (step === 1 && !validateRuleList()) {
    return;
  }

  currentStep.value = step + 1;
};

const resetForm = () => {
  formState.projectName = '';
  formState.owner = '';
  formState.scene = '';
  formState.description = '';
  formState.rules = [{ id: `${Date.now()}`, metric: 'error_rate', operator: '>', threshold: 5 }];
  formState.publishType = 'immediate';
  formState.publishTime = null;
  formState.notifyUsers = [];
  currentStep.value = 0;
  ruleError.value = '';
  void basicForm.clearValidate();
  void ruleForm.clearValidate();
  void publishForm.clearValidate();
};

const saveDraft = () => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
  message.success($t('examples.scaffold.complexForm.draftSaved'));
};

const loadDraft = () => {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (!draft) {
    return;
  }

  try {
    const parsed = JSON.parse(draft);
    Object.assign(formState, parsed);
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
};

const submitting = ref(false);
const submitForm = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const submitted: Partial<typeof formState> = {};
    // 最终提交仍校验所有步骤，避免草稿回填或返回上一步修改后绕过校验。
    try {
      Object.assign(submitted, await basicForm.submit());
    } catch {
      currentStep.value = 0;
      return;
    }
    if (!validateRuleList()) {
      currentStep.value = 1;
      return;
    }
    try {
      Object.assign(submitted, await ruleForm.submit());
    } catch {
      currentStep.value = 1;
      return;
    }
    try {
      Object.assign(submitted, await publishForm.submit());
    } catch {
      currentStep.value = 2;
      return;
    }

    // 服务端校验演示读取表单处理后的提交数据，与实际业务提交保持一致。
    if (submitted.projectName?.toLowerCase().includes('fail')) {
      currentStep.value = 0;
      const nativeForm = await basicForm.getNativeInstance();
      nativeForm?.setFields([
        {
          name: ['projectName'],
          errors: [$t('examples.scaffold.complexForm.serverValidationError')],
        },
      ]);
      message.error($t('examples.scaffold.complexForm.submitFailed'));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    localStorage.removeItem(DRAFT_KEY);
    message.success($t('examples.scaffold.complexForm.submitSuccess'));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadDraft();
});
</script>

<style scoped lang="scss">
.mb-lg {
  margin-bottom: var(--spacing-lg);
}

.mb-md {
  margin-bottom: var(--spacing-md);
}

.mt-md {
  margin-top: var(--spacing-md);
}
</style>
