import { createSearchParams, NavLink } from 'react-router';
import Checkbox from '@/elements/input/Checkbox';
import { useServerStore } from '@/stores/server';
import { Breadcrumbs } from '@mantine/core';
import { ReactNode, useMemo } from 'react';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';

export default function FileBreadcrumbs({
  path,
  browsingBackup,
  inFileEditor,
}: {
  path: string;
  browsingBackup: ServerBackup | null;
  inFileEditor?: boolean;
}) {
  const { server, browsingEntries, selectedFileNames, setSelectedFiles, clearSelectedFiles, movingFileNames } =
    useServerStore();

  const splittedPath = path.split('/').filter(Boolean);
  const pathItems = splittedPath.map((item, index) => {
    return {
      name: item,
      path: splittedPath.slice(0, index + 1).join('/'),
    };
  });

  const items = useMemo(() => {
    const items: ReactNode[] = [
      browsingBackup ? 'backups' : 'home',
      <NavLink
        key='first-segment'
        to={
          browsingBackup
            ? `/server/${server?.uuidShort}/files?${createSearchParams({
                directory: `/.backups/${browsingBackup.uuid}`,
              })}`
            : `/server/${server?.uuidShort}/files`
        }
        className='px-1 text-blue-300 hover:text-blue-200'
      >
        {browsingBackup ? browsingBackup.name : 'container'}
      </NavLink>,
      ...pathItems.slice(browsingBackup ? 2 : 0).map((item, index) =>
        index === pathItems.length - 1 && inFileEditor ? (
          item.name
        ) : (
          <NavLink
            key={item.path}
            to={`/server/${server?.uuidShort}/files?${createSearchParams({ directory: item.path })}`}
            className='px-1 text-blue-300 hover:text-blue-200'
          >
            {item.name}
          </NavLink>
        ),
      ),
    ];

    return items;
  }, [inFileEditor, browsingBackup, pathItems]);

  return (
    <div className='flex flex-row items-center justify-between'>
      <Breadcrumbs separatorMargin='xs'>
        <Checkbox
          disabled={movingFileNames.size > 0}
          checked={selectedFileNames.size > 0 && selectedFileNames.size >= browsingEntries.data.length}
          indeterminate={selectedFileNames.size > 0 && selectedFileNames.size < browsingEntries.data.length}
          className='mr-2'
          hidden={inFileEditor}
          onChange={() => {
            if (selectedFileNames.size >= browsingEntries.data.length) {
              clearSelectedFiles();
            } else {
              setSelectedFiles(browsingEntries.data);
            }
          }}
        />
        {items}
      </Breadcrumbs>

      <NavLink to={`/server/${server?.uuidShort}/files`} hidden={!browsingBackup}>
        <Button variant='light' leftSection={<FontAwesomeIcon icon={faDoorOpen} />}>
          Exit Backup
        </Button>
      </NavLink>
    </div>
  );
}
