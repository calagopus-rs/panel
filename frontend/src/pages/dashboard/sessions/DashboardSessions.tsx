import Spinner from '@/elements/Spinner';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { load } from '@/lib/debounce';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import getSessions from '@/api/me/sessions/getSessions';
import SessionRow from './SessionRow';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sessions, setSessions } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getSessions(page, search).then((data) => {
      setSessions(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Sessions
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w={250}
          />
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
