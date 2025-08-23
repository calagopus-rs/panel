import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import getBackups from '@/api/server/backups/getBackups';
import BackupRow from './BackupRow';
import BackupCreateDialog from './dialogs/BackupCreateDialog';
import createBackup from '@/api/server/backups/createBackup';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';
import Spinner from '@/elements/Spinner';
import { ContextMenuProvider } from '@/elements/ContextMenu';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, backups, setBackups, addBackup } = useServerStore();

  const [loading, setLoading] = useState(backups.data.length === 0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState<'create'>(null);
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
      setLoading(false);
    });
  }, [page, search]);

  const doCreate = (name: string, ignoredFiles: string[]) => {
    createBackup(server.uuid, { name, ignoredFiles })
      .then((backup) => {
        addBackup(backup);
        addToast('Backup created.', 'success');
        setOpenDialog(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <BackupCreateDialog onCreate={doCreate} open={openDialog === 'create'} onClose={() => setOpenDialog(null)} />

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
          <NewButton onClick={() => setOpenDialog('create')} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Create
          </NewButton>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <TableNew
            columns={['Name', 'Checksum', 'Size', 'Files', 'Created At', 'Locked?', '']}
            pagination={backups}
            onPageSelect={setPage}
          >
            {backups.data.map((backup) => (
              <BackupRow backup={backup} key={backup.uuid} />
            ))}
          </TableNew>
        </ContextMenuProvider>
      )}
    </>
  );
};
