import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface UserCenterProfile {
  /** 登录账号；由认证身份提供，不可由请求体指定。 */
  account: string;
  /** 租户展示名称（公司名）；由服务端租户目录提供。 */
  tenantName: string | null;
  displayName: string | null;
  department: string | null;
  roles: string[];
  avatarUrl: string | null;
}

export const useUserProfileStore = defineStore('user-profile', () => {
  // 未登录时的空档案；接入用户中心后由 /api/v1/me 响应替换。
  const profile = ref<UserCenterProfile>({ account: '', tenantName: null, displayName: null, department: null, roles: [], avatarUrl: null });

  function setUserCenterProfile(next: UserCenterProfile) {
    profile.value = next;
  }

  return { profile, setUserCenterProfile };
});
