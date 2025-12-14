import { type DependencyList, useEffect, useRef } from 'react';

type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt' | 'ctrlOrMeta';

interface ShortcutConfig {
  key: string;
  modifiers?: ModifierKey[];
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  allowWhenInputFocused?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
  deps?: DependencyList;
}

function checkModifiers(event: KeyboardEvent, modifiers: ModifierKey[] = []): boolean {
  const hasCtrl = event.ctrlKey;
  const hasMeta = event.metaKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  for (const modifier of modifiers) {
    switch (modifier) {
      case 'ctrl':
        if (!hasCtrl) return false;
        break;
      case 'meta':
        if (!hasMeta) return false;
        break;
      case 'ctrlOrMeta':
        if (!hasCtrl && !hasMeta) return false;
        break;
      case 'shift':
        if (!hasShift) return false;
        break;
      case 'alt':
        if (!hasAlt) return false;
        break;
    }
  }

  const expectedCtrl = modifiers.includes('ctrl') || modifiers.includes('ctrlOrMeta');
  const expectedMeta = modifiers.includes('meta') || modifiers.includes('ctrlOrMeta');
  const expectedShift = modifiers.includes('shift');
  const expectedAlt = modifiers.includes('alt');

  if (hasCtrl && !expectedCtrl && modifiers.length > 0) return false;
  if (hasMeta && !expectedMeta && modifiers.length > 0) return false;
  if (hasShift && !expectedShift) return false;
  if (hasAlt && !expectedAlt) return false;

  return true;
}

function isInputFocused(): boolean {
  const target = document.activeElement as HTMLElement;
  return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true, deps = [] }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const inputFocused = isInputFocused();

      for (const shortcut of shortcutsRef.current) {
        if (inputFocused && !shortcut.allowWhenInputFocused) {
          continue;
        }

        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          continue;
        }

        if (!checkModifiers(event, shortcut.modifiers)) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.callback(event);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, ...deps]);
}

export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    modifiers?: ModifierKey[];
    preventDefault?: boolean;
    allowWhenInputFocused?: boolean;
    enabled?: boolean;
    deps?: DependencyList;
  } = {},
) {
  const { modifiers, preventDefault, allowWhenInputFocused, enabled = true, deps = [] } = options;

  useKeyboardShortcuts({
    shortcuts: [
      {
        key,
        modifiers,
        callback,
        preventDefault,
        allowWhenInputFocused,
      },
    ],
    enabled,
    deps,
  });
}
