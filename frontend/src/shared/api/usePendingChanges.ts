import { onBeforeUnmount, ref, type Ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
export function usePendingChanges(dirty: Ref<boolean>, busy: Ref<boolean>) {
  const visible = ref(false);
  let resolve: ((allow: boolean) => void) | undefined;
  function check(): boolean | Promise<boolean> {
    if (busy.value) return false;
    if (!dirty.value) return true;
    if (resolve) return false;
    visible.value = true;
    return new Promise<boolean>(done => { resolve = done; });
  }
  function finish(allow: boolean) { visible.value = false; resolve?.(allow); resolve = undefined; }
  function beforeUnload(event: BeforeUnloadEvent) { if (dirty.value) { event.preventDefault(); event.returnValue = ''; } }
  window.addEventListener('beforeunload', beforeUnload);
  onBeforeRouteLeave(check);
  onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); finish(false); });
  return { visible, check, finish };
}
