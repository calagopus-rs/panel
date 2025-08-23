import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import DatabaseRow from './DatabaseRow';
import DatabaseCreateDialog from './dialogs/DatabaseCreateDialog';
import getDatabases from '@/api/server/databases/getDatabases';
import createDatabase from '@/api/server/databases/createDatabase';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, databases, setDatabases, addDatabase } = useServerStore();

  const [loading, setLoading] = useState(databases.data.length === 0);
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
    getDatabases(server.uuid, page, search).then((data) => {
      setDatabases(data);
      setLoading(false);
    });
  }, [page, search]);

  const doCreate = (name: string) => {
    createDatabase(server.uuid, { name })
      .then((database) => {
        addDatabase(database);
        addToast('Database created.', 'success');
        setOpenDialog(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <DatabaseCreateDialog onCreate={doCreate} open={openDialog === 'create'} onClose={() => setOpenDialog(null)} />

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
          <TableNew columns={['Name', 'Address', 'Username', '']} pagination={databases} onPageSelect={setPage}>
            {databases.data.map((database) => (
              <DatabaseRow database={database} key={database.uuid} />
            ))}
          </TableNew>
        </ContextMenuProvider>
      )}
    </>
  );
};
