import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onSpin?: () => void;
  onReset?: () => void;
}

/**
 * 키보드 단축키 훅
 *
 * 지원하는 단축키:
 * - S: 추첨 시작 / 다음 추첨
 * - R: 리셋 (다시 추첨)
 *
 * 접근성을 위해 입력 필드에 포커스가 있을 때는 단축키 비활성화
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      // 입력 필드, 텍스트 영역, contenteditable에 포커스가 있을 때는 단축키 비활성화
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 's':
          event.preventDefault();
          handlers.onSpin?.();
          break;
        case 'r':
          event.preventDefault();
          handlers.onReset?.();
          break;
        default:
          // Do nothing for other keys
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handlers]);
}
