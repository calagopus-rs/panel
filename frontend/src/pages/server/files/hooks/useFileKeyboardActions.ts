import { useKeyboardShortcuts } from '@/plugins/useKeyboardShortcuts';
import { useServerStore } from '@/stores/server';

interface UseFileKeyboardActionsOptions {
  onDelete?: () => void;
  onPaste?: () => void;
  enabled?: boolean;
  browsingBackup?: boolean;
}

export function useFileKeyboardActions({
  onDelete,
  onPaste,
  enabled = true,
  browsingBackup = false,
}: UseFileKeyboardActionsOptions = {}) {
  const { browsingEntries, selectedFileNames, movingFileNames, setSelectedFiles, setMovingFiles, getSelectedFiles } =
    useServerStore();

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'a',
        modifiers: ['ctrlOrMeta'],
        callback: () => setSelectedFiles(browsingEntries.data),
      },
      {
        key: 'Escape',
        modifiers: ['ctrlOrMeta'],
        callback: () => setSelectedFiles([]),
      },
      {
        key: 'x',
        modifiers: ['ctrlOrMeta'],
        callback: () => {
          if (movingFileNames.size === 0 && !browsingBackup) {
            const selectedFiles = getSelectedFiles();
            if (selectedFiles.length > 0) {
              setMovingFiles(selectedFiles);
              clearSelectedFiles();
            }
          }
        },
      },
      {
        key: 'v',
        modifiers: ['ctrlOrMeta'],
        callback: () => {
          if (movingFileNames.size > 0 && !browsingBackup && onPaste) {
            onPaste();
          }
        },
      },
      {
        key: 'Delete',
        callback: () => {
          if (movingFileNames.size === 0 && selectedFileNames.size > 0 && !browsingBackup && onDelete) {
            onDelete();
          }
        },
      },
    ],
    enabled,
    deps: [browsingEntries.data, selectedFileNames.size, movingFileNames.size, onDelete, onPaste, browsingBackup],
  });
}
