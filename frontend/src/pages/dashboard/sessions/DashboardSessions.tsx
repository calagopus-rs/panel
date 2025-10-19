import Spinner from '@/elements/Spinner';
import { useUserStore } from '@/stores/user';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import getSessions from '@/api/me/sessions/getSessions';
import SessionRow from './SessionRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { sessions, setSessions } = useUserStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSessions,
    setStoreData: setSessions,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Sessions
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['IP', 'This Device?', 'User Agent', 'Last Used', '']}
            pagination={sessions}
            onPageSelect={setPage}
          >
            {sessions.data.map((session) => (
              <SessionRow key={session.uuid} session={session} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
