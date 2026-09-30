<template>
  <section>
    <a-space wrap class="detail-heading">
      <h3>{{ title }}</h3>
      <span>{{ subTitle }}</span>
      <a-tag v-for="tag in tags" :key="tag.text" :color="tag.color">{{ tag.text }}</a-tag>
    </a-space>
    <SuperDetail :schema="schema" :data-source="dataSource" />
    <a-tabs
      v-if="tabs?.length"
      :active-key="activeTab"
      @update:active-key="emit('update:activeTab', String($event))"
    >
      <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
        <slot :name="`tab-${tab.key}`" />
      </a-tab-pane>
    </a-tabs>
    <slot />
  </section>
</template>
<script setup lang="ts">
import { SuperDetail, type ExtDescriptionsOption } from 'superform-antdv';
defineProps<{
  schema: ExtDescriptionsOption;
  dataSource: Record<string, unknown>;
  title?: string;
  subTitle?: string;
  tags?: { text: string; color?: string }[];
  tabs?: { key: string; label: string }[];
  activeTab?: string;
}>();
const emit = defineEmits<{ 'update:activeTab': [value: string] }>();
</script>
<style scoped>
.detail-heading {
  margin-bottom: 16px;
}
</style>
