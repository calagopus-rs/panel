import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
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
import { load } from '@/lib/debounce';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { server, backups, setBackups } = useServerStore();

  const [loading, setLoading] = useState(backups.data.length === 0);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getBackups(server.uuid, page, search).then((data) => {
      setBackups(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <BackupCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Backups
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <Button onClick={() => setOpenModal('create')} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
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
