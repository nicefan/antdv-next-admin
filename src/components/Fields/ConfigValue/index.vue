<template>
  <a-switch v-if="valueType === 'boolean'" v-bind="$attrs" :checked="value === 'true'" @update:checked="emit('update:value', String($event))" />
  <a-input-number v-else-if="valueType === 'number'" v-bind="$attrs" :value="numericValue" style="width: 100%" @update:value="emit('update:value', $event == null ? '' : String($event))" />
  <a-textarea v-else-if="valueType === 'json'" v-bind="$attrs" :value="value" :rows="4" @update:value="emit('update:value', $event)" />
  <a-input v-else v-bind="$attrs" :value="value" @update:value="emit('update:value', $event)" />
</template>
<script setup lang="ts">
import { computed } from 'vue';
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  value?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
}>();
const emit = defineEmits<{ 'update:value': [value: string] }>();
const numericValue = computed(() => props.value == null || props.value === '' ? null : Number(props.value));
</script>
