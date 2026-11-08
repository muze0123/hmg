<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { IconHistory, IconPoweroff, IconRight, IconUser } from '@arco-design/web-vue/es/icon';
import { useUserProfileStore } from '../../app/stores/userProfile';
import { useAuthStore } from '../../modules/auth/stores/auth';
import { openDataAccountUrl, openDataAuditUrl } from '../config/openData';
import avatarPlaceholder from '../../assets/user-avatar-placeholder.svg';
const { t } = useI18n();
const route = useRoute();
const profileStore = useUserProfileStore();
const authStore = useAuthStore();
const open = ref(false);
const failed = ref(false);
const avatar = computed(() => failed.value ? avatarPlaceholder : profileStore.profile.avatarUrl || avatarPlaceholder);
watch(() => profileStore.profile.avatarUrl, () => { failed.value = false; });
watch(() => route.fullPath, () => { open.value = false; });
</script>

<template>
  <a-popover v-model:popup-visible="open" trigger="hover" position="br" content-class="hmg-account-popover">
    <button class="account-trigger" type="button" :aria-label="t('account.center')" :aria-expanded="open" @click="open = true" @focus="open = true" @keydown.esc="open = false">
      <a-avatar :size="28"><img :src="avatar" alt="" @error="failed = true" /></a-avatar>
      <span>{{ profileStore.profile.displayName }}</span>
    </button>
    <template #content>
      <div class="account-popup" @keydown.esc="open = false">
        <section class="account-summary" :aria-label="t('account.center')">
          <a-avatar :size="48"><img :src="avatar" alt="" @error="failed = true" /></a-avatar>
          <div class="account-identity">
            <div class="account-identity-name">—（{{ profileStore.profile.displayName }}）</div>
            <div class="account-identity-department" :aria-label="t('account.department')">—</div>
            <div class="account-identity-roles" :aria-label="t('account.roles')">—</div>
          </div>
        </section>
        <a class="account-menu-item" :href="openDataAccountUrl" @click="open = false"><IconUser :size="18" /><span>{{ t('account.title') }}</span><IconRight class="account-menu-arrow" /></a>
        <a class="account-menu-item" :href="openDataAuditUrl" @click="open = false"><IconHistory :size="18" /><span>{{ t('account.audit') }}</span><IconRight class="account-menu-arrow" /></a>
        <div class="account-menu-divider" />
        <button class="account-menu-item" type="button" @click="open = false; authStore.logout()"><IconPoweroff :size="18" /><span>{{ t('account.logout') }}</span></button>
      </div>
    </template>
  </a-popover>

</template>

<style scoped>
.account-trigger { display: inline-flex; align-items: center; flex: none; gap: var(--mt-ds-space-2); padding: 6px; border: 0; border-radius: var(--mt-ds-control-radius); background: transparent; color: var(--mt-ds-text); font: inherit; cursor: pointer; }
.account-trigger:hover { background: var(--color-fill-2); }
.account-trigger:focus-visible, .account-menu-item:focus-visible { outline: 2px solid var(--mt-ds-primary); outline-offset: 2px; }
.account-popup { width: 100%; color: var(--mt-ds-text); }
.account-summary { display: flex; align-items: flex-start; gap: var(--mt-ds-space-4); padding: var(--mt-ds-space-3) var(--mt-ds-space-3) var(--mt-ds-space-6); }
.account-summary :deep(.arco-avatar), .account-trigger :deep(.arco-avatar) { flex: none; }
.account-summary img, .account-trigger img { display: block; width: 100%; height: 100%; object-fit: cover; }
.account-identity { min-width: 0; flex: 1; }
.account-identity-name { font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); overflow-wrap: anywhere; }
.account-identity-department { margin-top: var(--mt-ds-space-1); color: var(--mt-ds-text-muted); font-size: var(--mt-ds-font-caption); line-height: var(--mt-ds-line-caption); }
.account-identity-roles { margin-top: var(--mt-ds-space-3); color: var(--mt-ds-text-secondary); }
.account-menu-item { display: flex; align-items: center; gap: var(--mt-ds-space-3); width: 100%; box-sizing: border-box; padding: 14px var(--mt-ds-space-3); color: var(--mt-ds-text); text-decoration: none; background: transparent; border: 0; font: inherit; cursor: pointer; }
.account-menu-item:hover { background: var(--color-fill-2); color: var(--mt-ds-primary); }
.account-menu-item:disabled { color: var(--mt-ds-text-muted); cursor: not-allowed; }
.account-menu-arrow { margin-left: auto; color: var(--mt-ds-text-muted); }
.account-menu-divider { border-top: 1px solid var(--app-divider); margin: 6px 0; }
</style>

<style>
.hmg-account-popover { box-sizing: border-box; width: 240px; max-width: calc(100vw - 32px); }
</style>
