import getSessions from '@/api/me/sessions/getSessions';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, {
  ContentWrapper,
  TableHead,
  TableHeader,
  TableBody,
  NoItems,
  TableRow,
  Pagination,
} from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import SessionDeleteButton from './actions/SessionDeleteButton';
import { useUserStore } from '@/stores/user';
import { useSearchParams } from 'react-router';

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
    <Container>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>Sessions</h1>
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper onSearch={setSearch}>
            <Pagination data={sessions} onPageSelect={setPage}>
              <div className={'overflow-x-auto'}>
                <table className={'w-full table-auto'}>
                  <TableHead>
                    <TableHeader name={'IP'} />
                    <TableHeader name={'This Device?'} />
                    <TableHeader name={'User Agent'} />
                    <TableHeader name={'Last Used'} />
                    <TableHeader />
                  </TableHead>

                  <TableBody>
                    {sessions.data.map((session) => (
                      <TableRow key={session.id}>
                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Code>{session.ip}</Code>
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {session.isUsing ? 'Yes' : 'No'}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {session.userAgent}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Tooltip content={formatDateTime(session.lastUsed)}>
                            {formatTimestamp(session.lastUsed)}
                          </Tooltip>
                        </td>

                        <td className={'relative'}>{!session.isUsing && <SessionDeleteButton session={session} />}</td>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {sessions.data.length === 0 ? <NoItems /> : null}
              </div>
            </Pagination>
          </ContentWrapper>
        </Table>
      )}
    </Container>
  );
};
