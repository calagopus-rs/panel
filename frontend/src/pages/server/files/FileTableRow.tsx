import { forwardRef, memo, useCallback, type MouseEventHandler, type ReactNode } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import { TableRow } from '@/elements/Table.tsx';
import { isEditableFile } from '@/lib/files.ts';
import { useGlobalStore } from '@/stores/global.ts';
import { useServerStore } from '@/stores/server.ts';

interface FileTableRowProps {
  file: DirectoryEntry;
  onContextMenu: MouseEventHandler<HTMLTableRowElement>;
  onClick: MouseEventHandler<HTMLTableRowElement>;
  children: ReactNode;
}

export const FileTableRow = memo(
  forwardRef<HTMLTableRowElement, FileTableRowProps>(function FileTableRow(
    { file, onContextMenu, onClick, children },
    ref,
  ) {
    const navigate = useNavigate();
    const [_, setSearchParams] = useSearchParams();
    const server = useServerStore((state) => state.server);
    const { browsingDirectory, movingFileNames, movingFilesDirectory, isFileSelected } = useServerStore();
    const { settings } = useGlobalStore();

    const isSelected =
      isFileSelected(file) || (movingFilesDirectory === browsingDirectory && movingFileNames.has(file.name));

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLTableRowElement>) => {
        if ((isEditableFile(file.mime) && file.size <= settings.server.maxFileManagerViewSize) || file.directory) {
          if (file.directory) {
            setSearchParams({
              directory: `${browsingDirectory}/${file.name}`.replace('//', '/'),
            });
          } else {
            navigate(
              `/server/${server.uuidShort}/files/edit?${createSearchParams({
                directory: browsingDirectory,
                file: file.name,
              })}`,
            );
          }
        } else {
          onClick(e);
        }
      },
      [file, browsingDirectory, settings, server, navigate, setSearchParams, onClick],
    );

    return (
      <TableRow
        ref={ref}
        className={
          (isEditableFile(file.mime) && file.size <= settings.server.maxFileManagerViewSize) || file.directory
            ? 'cursor-pointer select-none'
            : 'select-none'
        }
        bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
        onContextMenu={onContextMenu}
        onClick={handleClick}
      >
        {children}
      </TableRow>
    );
  }),
);
