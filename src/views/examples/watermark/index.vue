<template>
  <div class="page-container">
    <div class="card">
      <h2>{{ $t('exampleWatermark.title') }}</h2>
      <p class="mb-lg">{{ $t('exampleWatermark.description') }}</p>

      <SuperForm @register="registerWatermarkForm" style="max-width: 600px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SuperForm, useForm } from 'superform-antdv';
import { computed } from 'vue';

import { $t } from '@/locales';
import { useWatermarkStore } from '@/stores/watermark';

const watermarkStore = useWatermarkStore();
// 通过可写计算值沿用 Store 的持久化操作，不建立另一份配置副本。
const [registerWatermarkForm] = useForm({
  subSpan: 24,
  attrs: { layout: 'vertical' },
  subItems: [
    {
      type: 'Switch',
      label: () => $t('exampleWatermark.enableGlobal'),
      value: computed({
        get: () => watermarkStore.enabled,
        set: (value: boolean) => watermarkStore.setEnabled(value),
      }),
    },
    {
      type: 'Input',
      label: () => $t('exampleWatermark.content'),
      value: computed({
        get: () => watermarkStore.content,
        set: (value: string) => watermarkStore.setContent(value),
      }),
    },
    {
      type: 'InputNumber',
      label: () => $t('exampleWatermark.fontSize'),
      value: computed({
        get: () => watermarkStore.fontSize,
        set: (value: number) => watermarkStore.setFontSize(value),
      }),
      attrs: { min: 12, max: 48 },
    },
    {
      type: 'Slider',
      label: () => $t('exampleWatermark.rotate'),
      value: computed({
        get: () => watermarkStore.rotate,
        set: (value: number) => watermarkStore.setRotate(value),
      }),
      attrs: { min: -180, max: 180 },
    },
    {
      type: 'Slider',
      label: () => $t('exampleWatermark.opacity'),
      value: computed({
        get: () => watermarkStore.opacity,
        set: (value: number) => watermarkStore.setOpacity(value),
      }),
      attrs: { min: 0, max: 1, step: 0.01 },
    },
    {
      type: 'InputNumber',
      label: () => $t('exampleWatermark.gapX'),
      value: computed({
        get: () => watermarkStore.gap[0],
        set: (value: number) => watermarkStore.setGap([value, watermarkStore.gap[1]]),
      }),
      attrs: { min: 10, max: 500 },
    },
    {
      type: 'InputNumber',
      label: () => $t('exampleWatermark.gapY'),
      value: computed({
        get: () => watermarkStore.gap[1],
        set: (value: number) => watermarkStore.setGap([watermarkStore.gap[0], value]),
      }),
      attrs: { min: 10, max: 500 },
    },
  ],
});
</script>

<style scoped lang="scss">
.mb-lg {
  margin-bottom: var(--spacing-lg);
}
</style>
