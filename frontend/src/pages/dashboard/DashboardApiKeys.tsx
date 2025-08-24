import getApiKeys from '@/api/me/api-keys/getApiKeys';
import Code from '@/elements/Code';
import Spinner from '@/elements/Spinner';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import ApiKeyCreateButton from './actions/ApiKeyCreateButton';
import { useUserStore } from '@/stores/user';
import ApiKeyDeleteButton from './actions/ApiKeyDeleteButton';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import Table, { TableData, TableRow } from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';

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
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          API Keys
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <ApiKeyCreateButton />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['Name', 'Key', 'Permissions', 'Last Used', 'Created', '']}
          pagination={apiKeys}
          onPageSelect={setPage}
        >
          {apiKeys.data.map((key) => (
            <TableRow key={key.uuid}>
              <TableData>{key.name}</TableData>

              <TableData>
                <Code>{key.keyStart}</Code>
              </TableData>

              <TableData>{key.permissions.length}</TableData>

              <TableData>
                {!key.lastUsed ? (
                  'N/A'
                ) : (
                  <Tooltip content={formatDateTime(key.lastUsed)}>{formatTimestamp(key.lastUsed)}</Tooltip>
                )}
              </TableData>

              <TableData>
                <Tooltip content={formatDateTime(key.created)}>{formatTimestamp(key.created)}</Tooltip>
              </TableData>

              <TableData>
                <Group gap={4} justify={'right'} wrap={'nowrap'}>
                  <ApiKeyDeleteButton apiKey={key} />
                </Group>
              </TableData>
            </TableRow>
          ))}
        </Table>
      )}
    </>
  );
};
