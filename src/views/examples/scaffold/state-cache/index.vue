<template>
  <div class="page-container">
    <div class="card mb-lg">
      <h2>{{ $t('examples.scaffold.stateCache.title') }}</h2>
      <p class="text-secondary">
        {{ $t('examples.scaffold.stateCache.description') }}
      </p>
    </div>

    <div class="card mb-lg">
      <div class="section-title">{{ $t('examples.scaffold.stateCache.piniaSection') }}</div>

      <SuperForm @register="registerCacheForm">
        <template #counter>
          <div class="counter-row">
            <a-button size="small" @click="cacheStore.counter--">-1</a-button>
            <a-input-number v-model:value="cacheStore.counter" :min="-9999" :max="9999" />
            <a-button size="small" @click="cacheStore.counter++">+1</a-button>
          </div></template
        >
      </SuperForm>

      <a-space class="mt-md">
        <a-button @click="cacheStore.reset">{{
          $t('examples.scaffold.stateCache.resetButton')
        }}</a-button>
        <a-button @click="pinCurrentTab">{{
          $t('examples.scaffold.stateCache.pinTabButton')
        }}</a-button>
      </a-space>

      <div class="persist-tip">
        {{ $t('examples.scaffold.stateCache.lastPersistTime') }}{{ cacheStore.updatedAt }}
      </div>
    </div>

    <div class="card">
      <div class="section-title">{{ $t('examples.scaffold.stateCache.keepAliveSection') }}</div>
      <a-radio-group v-model:value="activePanel" button-style="solid" class="mb-md">
        <a-radio-button value="panelA">{{
          $t('examples.scaffold.stateCache.panelA')
        }}</a-radio-button>
        <a-radio-button value="panelB">{{
          $t('examples.scaffold.stateCache.panelB')
        }}</a-radio-button>
      </a-radio-group>

      <keep-alive>
        <component :is="activeComponent" />
      </keep-alive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'antdv-next';
import { SuperForm, useForm } from 'superform-antdv';
import { computed, defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';

import { $t } from '@/locales';
import { useDemoStateCacheStore } from '@/stores/demoStateCache';
import { useTabsStore } from '@/stores/tabs';

const cacheStore = useDemoStateCacheStore();
const tabsStore = useTabsStore();
const route = useRoute();

// 直接使用 Store 的字段，维持持久化与重置行为。
const [registerCacheForm] = useForm({
  dataSource: cacheStore,
  subSpan: 12,
  attrs: { layout: 'vertical' },
  subItems: [
    {
      type: 'Input',
      field: 'keyword',
      label: () => $t('examples.scaffold.stateCache.keywordLabel'),
      dynamicAttrs: () => ({ placeholder: $t('examples.scaffold.stateCache.keywordPlaceholder') }),
      colProps: { xs: 24, md: 12 },
    },
    {
      type: 'InputSlot',
      field: 'counter',
      label: () => $t('examples.scaffold.stateCache.counterLabel'),
      render: 'counter',
      colProps: { xs: 24, md: 12 },
    },
    {
      type: 'TextArea',
      field: 'notes',
      span: 24,
      label: () => $t('examples.scaffold.stateCache.notesLabel'),
      dynamicAttrs: () => ({
        rows: 3,
        placeholder: $t('examples.scaffold.stateCache.notesPlaceholder'),
      }),
    },
  ],
});

const activePanel = ref<'panelA' | 'panelB'>('panelA');

const PanelA = defineComponent({
  name: 'DemoCachePanelA',
  setup() {
    const localValue = ref('');
    const localCount = ref(0);

    return {
      localValue,
      localCount,
    };
  },
  template: `
    <div class="cache-panel">
      <div class="panel-title">${$t('examples.scaffold.stateCache.panelADesc')}</div>
      <a-input v-model:value="localValue" :placeholder="$t('examples.scaffold.stateCache.panelAInputPlaceholder')" />
      <a-space>
        <a-button size="small" @click="localCount--">-</a-button>
        <span>${$t('examples.scaffold.stateCache.localCountLabel')}{{ localCount }}</span>
        <a-button size="small" @click="localCount++">+</a-button>
      </a-space>
    </div>
  `,
});

const PanelB = defineComponent({
  name: 'DemoCachePanelB',
  setup() {
    const checked = ref(false);
    const text = ref('');

    return {
      checked,
      text,
    };
  },
  template: `
    <div class="cache-panel">
      <div class="panel-title">${$t('examples.scaffold.stateCache.panelBDesc')}</div>
      <a-switch v-model:checked="checked" checked-children="ON" un-checked-children="OFF" />
      <a-textarea v-model:value="text" :rows="3" :placeholder="$t('examples.scaffold.stateCache.panelBTextPlaceholder')" />
    </div>
  `,
});

const activeComponent = computed(() => {
  return activePanel.value === 'panelA' ? PanelA : PanelB;
});

const pinCurrentTab = () => {
  tabsStore.togglePinTab(route.path);
  message.success($t('examples.scaffold.stateCache.pinTabSuccess'));
};
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

.section-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  label {
    display: inline-block;
    margin-bottom: 6px;
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.full-row {
  grid-column: 1 / -1;
}

.counter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.persist-tip {
  margin-top: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.cache-panel {
  border: 1px solid var(--color-border-secondary);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-weight: var(--font-weight-medium);
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
