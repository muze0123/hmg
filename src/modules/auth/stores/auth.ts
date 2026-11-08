import { defineStore } from 'pinia';
import { openDataLoginUrl } from '../../../shared/config/openData';

export const useAuthStore = defineStore('auth', () => {

  function logout() {
    localStorage.removeItem('opendata-token');
    sessionStorage.removeItem('opendata-token');
    const destination = new URL(openDataLoginUrl, window.location.href);
    destination.searchParams.set('logout', '1');
    window.location.assign(destination.href);
  }

  return { logout };
});
