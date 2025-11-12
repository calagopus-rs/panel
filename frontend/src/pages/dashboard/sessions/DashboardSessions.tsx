import { Group, Title } from '@mantine/core';
import getSessions from '@/api/me/sessions/getSessions';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useUserStore } from '@/stores/user';
import SessionRow from './SessionRow';

export default function DashboardSessions() {
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

      <ContextMenuProvider>
        <Table
          columns={['IP', 'This Device?', 'User Agent', 'Last Used', '']}
          loading={loading}
          pagination={sessions}
          onPageSelect={setPage}
        >
          {sessions.data.map((session) => (
            <SessionRow key={session.uuid} session={session} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
