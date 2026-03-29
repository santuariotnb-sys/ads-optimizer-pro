type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function showToast(type: ToastType, message: string): void {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  toasts = [{ id, type, message }, ...toasts].slice(0, 3);
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function getToasts(): Toast[] {
  return toasts;
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
