<template>
  <div class="time-wheel">
    <div class="highlight"></div>
    <div ref="wheel" class="wheel" @scrollend="onScrollEnd">
      <div class="spacer"></div>
      <div
        v-for="(value, index) in values"
        :key="value"
        class="item"
        :class="{ selected: value === model }"
        @click="scrollToIndex(index, 'smooth')"
      >
        {{ String(value).padStart(2, "0") }}
      </div>
      <div class="spacer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const ITEM_HEIGHT = 48;

const props = defineProps<{ values: number[] }>();
const model = defineModel<number>({ required: true });
const wheel = ref<HTMLElement>();

// A value off the list (an order saved before the 5-minute step) shows the nearest one.
function nearestIndex(target: number) {
  return props.values.reduce(
    (best, value, index) =>
      Math.abs(value - target) < Math.abs(props.values[best]! - target)
        ? index
        : best,
    0,
  );
}

function scrollToIndex(index: number, behavior: ScrollBehavior = "instant") {
  wheel.value?.scrollTo({ top: index * ITEM_HEIGHT, behavior });
}

function onScrollEnd() {
  const index = Math.round(wheel.value!.scrollTop / ITEM_HEIGHT);
  model.value = props.values[index]!;
}

onMounted(() => scrollToIndex(nearestIndex(model.value)));

// Follows a value set from outside (e.g. the default time), not our own scroll.
watch(model, (value) => {
  const index = nearestIndex(value);
  if (Math.round(wheel.value!.scrollTop / ITEM_HEIGHT) !== index) {
    scrollToIndex(index);
  }
});
</script>

<style scoped>
.time-wheel {
  position: relative;
  width: 80px;
}

.wheel {
  height: calc(48px * 5);
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.highlight {
  position: absolute;
  inset: calc(48px * 2) 0 auto;
  height: 48px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.12);
  pointer-events: none;
}

.item {
  height: 48px;
  line-height: 48px;
  text-align: center;
  scroll-snap-align: center;
  font-size: 1.5rem;
  opacity: 0.4;
  cursor: pointer;
}

.item.selected {
  opacity: 1;
  font-weight: 500;
}

.spacer {
  height: calc(48px * 2);
}
</style>
