import getSessions from '@/api/me/sessions/getSessions';
import Code from '@/elements/Code';
import Spinner from '@/elements/Spinner';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import SessionDeleteButton from './actions/SessionDeleteButton';
import { useUserStore } from '@/stores/user';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import TableNew, { TableData, TableRow } from '@/elements/table/TableNew';

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
      setLoading(false);
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
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <TableNew
          columns={['IP', 'This Device?', 'User Agent', 'Last Used', '']}
          pagination={sessions}
          onPageSelect={setPage}
        >
          {sessions.data.map((session) => (
            <TableRow key={session.uuid}>
              <TableData>
                <Code>{session.ip}</Code>
              </TableData>

              <TableData>{session.isUsing ? 'Yes' : 'No'}</TableData>

              <TableData>{session.userAgent}</TableData>

              <TableData>
                <Tooltip content={formatDateTime(session.lastUsed)}>{formatTimestamp(session.lastUsed)}</Tooltip>
              </TableData>

              <TableData>
                <Group gap={4} justify={'right'} wrap={'nowrap'}>
                  {!session.isUsing && <SessionDeleteButton session={session} />}
                </Group>
              </TableData>
            </TableRow>
          ))}
        </TableNew>
      )}
    </>
  );
};
