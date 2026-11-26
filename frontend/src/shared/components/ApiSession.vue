<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFormLayout from '../../design/components/AppFormLayout.vue';
import AppFieldLabel from '../../design/components/AppFieldLabel.vue';
import { currentApiUser, signIn } from '../api/hmg';
const { t } = useI18n();
const user = ref(''); const password = ref(''); const busy = ref(false); const error = ref(false);
async function login() {
  if (busy.value) return;
  busy.value = true; error.value = false;
  try { await signIn(user.value, password.value); password.value = ''; }
  catch { error.value = true; }
  finally { busy.value = false; }
}
</script>
<template>
  <slot v-if="currentApiUser" />
  <section v-else class="api-signin">
    <AppFormLayout><a-form :model="{ user, password }" layout="vertical" @submit-success="login">
      <a-form-item field="user" :rules="[{ required: true, message: t('connected.required') }]"><template #label><AppFieldLabel :text="t('connected.username')" /></template><a-input v-model="user" :input-attrs="{'aria-label': t('connected.username')}" autocomplete="username" /></a-form-item>
      <a-form-item field="password" :rules="[{ required: true, message: t('connected.required') }]"><template #label><AppFieldLabel :text="t('connected.password')" /></template><a-input-password v-model="password" :input-attrs="{'aria-label': t('connected.password')}" autocomplete="current-password" /></a-form-item>
      <a-alert v-if="error" type="error">{{ t('connected.signInFailed') }}</a-alert>
      <a-button type="primary" html-type="submit" :loading="busy">{{ t('connected.signIn') }}</a-button>
    </a-form></AppFormLayout>
  </section>
</template>
<style scoped>
.api-signin { padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); }
</style>
