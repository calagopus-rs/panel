import { useServerStore } from '@/stores/server';
import { useState } from 'react';
import getBackups from '@/api/server/backups/getBackups';
import BackupRow from './BackupRow';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import Spinner from '@/elements/Spinner';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import BackupCreateModal from './modals/BackupCreateModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { server, backups, setBackups } = useServerStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackups(server.uuid, page, search),
    setStoreData: setBackups,
  });

  return (
    <>
      <BackupCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Backups
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Name', 'Checksum', 'Size', 'Files', 'Created At', 'Locked?', '']}
            pagination={backups}
            onPageSelect={setPage}
          >
            {backups.data.map((backup) => (
              <BackupRow backup={backup} key={backup.uuid} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
