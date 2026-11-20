import { onScopeDispose } from 'vue';

// Local child views share their parent's URL. Let a repeated sidebar click return to the list.
let returnToList: (() => void | Promise<void>) | undefined;
export function useSamePageNavigation(handler: () => void | Promise<void>) {
  returnToList = handler;
  onScopeDispose(() => { if (returnToList === handler) returnToList = undefined; });
}
export function navigateWithinSamePage() {
  void returnToList?.();
}
