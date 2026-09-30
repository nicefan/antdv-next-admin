<template>
  <a-tree-select
    v-if="tree"
    v-bind="$attrs"
    :value="value"
    :tree-data="options"
    :field-names="{ label: 'label', value: 'value', children: 'children' }"
    show-search
    :filter-tree-node="false"
    :loading="loading"
    @search="search"
    @update:value="emit('update:value', $event)"
  />
  <a-select
    v-else
    v-bind="$attrs"
    :value="value"
    :options="options"
    show-search
    :filter-option="false"
    :loading="loading"
    @search="search"
    @update:value="emit('update:value', $event)"
  />
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
defineOptions({ inheritAttrs: false });
export interface RemoteOption {
  label: string;
  value: string | number | boolean;
  children?: RemoteOption[];
}
const props = defineProps<{
  value?: unknown;
  tree?: boolean;
  request: (keyword: string) => Promise<RemoteOption[]>;
}>();
const emit = defineEmits<{ 'update:value': [value: unknown] }>();
const options = ref<RemoteOption[]>([]);
const loading = ref(false);
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
async function load(keyword: string): Promise<void> {
  const current = ++sequence;
  loading.value = true;
  try {
    const result = await props.request(keyword);
    if (current === sequence) options.value = result;
  } catch (error) {
    // 请求错误已由统一 Service 反馈；事件入口需要接收拒绝，避免未处理的 Promise。
    if (current === sequence) options.value = [];
    console.error(error);
  } finally {
    if (current === sequence) loading.value = false;
  }
}
function search(keyword: string): void {
  clearTimeout(timer);
  sequence += 1;
  timer = setTimeout(() => {
    void load(keyword);
  }, 250);
}
onMounted(() => {
  void load('');
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  sequence += 1;
});
</script>
