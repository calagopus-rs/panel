import getApiKeys from '@/api/me/api-keys/getApiKeys';
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
import ApiKeyCreateButton from './actions/ApiKeyCreateButton';
import { useUserStore } from '@/stores/user';
import ApiKeyDeleteButton from './actions/ApiKeyDeleteButton';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiKeys, setApiKeys } = useUserStore();

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
    getApiKeys(page, search).then((data) => {
      setApiKeys(data);
      setLoading(false);
    });
  }, [page, search]);

  return (
    <Container>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>API Keys</h1>
        <ApiKeyCreateButton />
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper onSearch={setSearch}>
            <Pagination data={apiKeys} onPageSelect={setPage}>
              <div className={'overflow-x-auto'}>
                <table className={'w-full table-auto'}>
                  <TableHead>
                    <TableHeader name={'Name'} />
                    <TableHeader name={'Key'} />
                    <TableHeader name={'Permissions'} />
                    <TableHeader name={'Last Used'} />
                    <TableHeader name={'Created'} />
                    <TableHeader />
                  </TableHead>

                  <TableBody>
                    {apiKeys.data.map((key) => (
                      <TableRow key={key.id}>
                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{key.name}</td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Code>{key.keyStart}</Code>
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {key.permissions.length}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {!key.lastUsed ? (
                            'N/A'
                          ) : (
                            <Tooltip content={formatDateTime(key.lastUsed)}>{formatTimestamp(key.lastUsed)}</Tooltip>
                          )}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Tooltip content={formatDateTime(key.created)}>{formatTimestamp(key.created)}</Tooltip>
                        </td>

                        <td className={'relative'}>
                          <ApiKeyDeleteButton apiKey={key} />
                        </td>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {apiKeys.data.length === 0 ? <NoItems /> : null}
              </div>
            </Pagination>
          </ContentWrapper>
        </Table>
      )}
    </Container>
  );
};
