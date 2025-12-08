import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFileDragAndDropOptions {
  onDrop: (files: File[]) => Promise<void>;
  enabled?: boolean;
}

async function traverseDirectory(entry: FileSystemDirectoryEntry, files: File[], path: string = ''): Promise<void> {
  return new Promise((resolve) => {
    const reader = entry.createReader();

    const readEntries = () => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
          resolve();
          return;
        }

        for (const entry of entries) {
          if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry;
            await new Promise<void>((resolveFile) => {
              fileEntry.file((file) => {
                const newFile = new File([file], `${path}/${file.name}`, {
                  type: file.type,
                  lastModified: file.lastModified,
                });
                files.push(newFile);
                resolveFile();
              });
            });
          } else if (entry.isDirectory) {
            await traverseDirectory(entry as FileSystemDirectoryEntry, files, `${path}/${entry.name}`);
          }
        }

        readEntries();
      });
    };

    readEntries();
  });
}

export function useFileDragAndDrop({ onDrop, enabled = true }: UseFileDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      dragCounterRef.current = 0;

      if (!enabled) return;

      const items = Array.from(e.dataTransfer?.items || []);
      const files: File[] = [];

      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry?.();

          if (entry) {
            if (entry.isDirectory) {
              await traverseDirectory(entry as FileSystemDirectoryEntry, files, entry.name);
            } else {
              const file = item.getAsFile();
              if (file) files.push(file);
            }
          } else {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      }

      if (files.length > 0) {
        await onDrop(files);
      }
    },
    [enabled, onDrop],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [enabled, handleDrop]);

  return { isDragging };
}
