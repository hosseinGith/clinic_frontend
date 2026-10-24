import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: PointerEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [ref, handler, enabled]);
}
