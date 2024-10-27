<template>
  <div class="grid gap-10">
    <h1 class="text-4xl">{{ msg }}</h1>

    <div class="px-6 grid gap-3">
      <button type="button" @click="count++" class="btn btn-outline w-fit place-self-center">count is {{ count
        }}</button>
      <p>
        Edit
        <code>components/HelloWorld.vue</code> to test HMR
      </p>
    </div>

    <div>
      <p>
        Install
        <a class="link link-primary" href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
        in your IDE for a better DX
      </p>
      <p class="text-base-content/60">Click on the WXT and Vue logos to learn more</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

defineProps({
  msg: String,
});

const count = ref(0);
</script>

<style scoped>
a {
  text-decoration: inherit;
}
</style>
