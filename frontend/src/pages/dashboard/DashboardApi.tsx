import getApiKeys from '@/api/me/api/getApiKeys';
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

export default () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { keys, setKeys } = useUserStore(state => state.apiKeys);

  useEffect(() => {
    getApiKeys(page).then(data => {
      setKeys(data);
      setLoading(false);
    });
  }, [page]);

  return (
    <Container>
      <div className="justify-between flex items-center mb-2">
        <h1 className="text-4xl font-bold text-white">API Keys</h1>
        <ApiKeyCreateButton />
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper>
            <Pagination data={keys} onPageSelect={setPage}>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <TableHead>
                    <TableHeader name={'Name'} />
                    <TableHeader name={'Key'} />
                    <TableHeader name={'Permissions'} />
                    <TableHeader name={'Last Used'} />
                    <TableHeader name={'Created'} />
                    <TableHeader />
                  </TableHead>

                  <TableBody>
                    {keys.data.map(key => (
                      <TableRow key={key.id}>
                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{key.name}</td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          <Code>{key.keyStart}</Code>
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          {key.permissions.length}
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          {!key.lastUsed ? (
                            'N/A'
                          ) : (
                            <Tooltip content={formatDateTime(key.lastUsed)}>{formatTimestamp(key.lastUsed)}</Tooltip>
                          )}
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          <Tooltip content={formatDateTime(key.created)}>{formatTimestamp(key.created)}</Tooltip>
                        </td>

                        <td className="relative">
                          <ApiKeyDeleteButton apiKey={key} />
                        </td>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {keys.data.length === 0 ? <NoItems /> : null}
              </div>
            </Pagination>
          </ContentWrapper>
        </Table>
      )}
    </Container>
  );
};
