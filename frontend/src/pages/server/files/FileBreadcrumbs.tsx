import { faDoorOpen, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Breadcrumbs } from '@mantine/core';
import { ReactNode, useMemo, useState } from 'react';
import { createSearchParams, NavLink } from 'react-router';
import Button from '@/elements/Button.tsx';
import Checkbox from '@/elements/input/Checkbox.tsx';
import { useServerStore } from '@/stores/server.ts';
import FileSearchModal from './modals/FileSearchModal.tsx';

export default function FileBreadcrumbs({
  path,
  browsingBackup,
  inFileEditor,
}: {
  path: string;
  browsingBackup: ServerBackup | null;
  inFileEditor?: boolean;
}) {
  const { server, setBrowsingDirectory, browsingEntries, selectedFileNames, setSelectedFiles, movingFileNames } =
    useServerStore();

  const [openModal, setOpenModal] = useState<'search' | null>(null);

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
        className=' text-blue-300 hover:text-blue-200'
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
            className=' text-blue-300 hover:text-blue-200'
            onClick={() => setBrowsingDirectory(item.path)}
          >
            {item.name}
          </NavLink>
        ),
      ),
    ];

    return items;
  }, [inFileEditor, browsingBackup, pathItems]);

  return (
    <>
      <FileSearchModal opened={openModal === 'search'} onClose={() => setOpenModal(null)} />

      <div className='flex flex-row items-center justify-between'>
        <Breadcrumbs separatorMargin='xs'>
          <Checkbox
            disabled={movingFileNames.size > 0}
            checked={
              !inFileEditor && selectedFileNames.size > 0 && selectedFileNames.size >= browsingEntries.data.length
            }
            indeterminate={selectedFileNames.size > 0 && selectedFileNames.size < browsingEntries.data.length}
            className='mr-2'
            classNames={{ input: 'cursor-pointer!' }}
            hidden={inFileEditor}
            onChange={() => {
              if (selectedFileNames.size >= browsingEntries.data.length) {
                setSelectedFiles([]);
              } else {
                setSelectedFiles(browsingEntries.data);
              }
            }}
          />
          {items}
        </Breadcrumbs>

        <NavLink to={`/server/${server?.uuidShort}/files`} hidden={!browsingBackup || inFileEditor}>
          <Button variant='light' leftSection={<FontAwesomeIcon icon={faDoorOpen} />}>
            Exit Backup
          </Button>
        </NavLink>
        <span hidden={!!browsingBackup || inFileEditor}>
          <Button
            variant='light'
            leftSection={<FontAwesomeIcon icon={faSearch} />}
            onClick={() => setOpenModal('search')}
          >
            Search
          </Button>
        </span>
      </div>
    </>
  );
}
