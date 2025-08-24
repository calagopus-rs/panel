import Code from '@/elements/Code';
import Spinner from '@/elements/Spinner';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user';
import getSshKeys from '@/api/me/ssh-keys/getSshKeys';
import SshKeyDeleteButton from './actions/SshKeyDeleteButton';
import SshKeyCreateButton from './actions/SshKeyCreateButton';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table, { TableData, TableRow } from '@/elements/Table';
import { load } from '@/lib/debounce';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sshKeys, setSshKeys } = useUserStore();

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
    getSshKeys(page, search).then((data) => {
      setSshKeys(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          SSH Keys
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <SshKeyCreateButton />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['Name', 'Fingerprint', 'Created', '']} pagination={sshKeys} onPageSelect={setPage}>
          {sshKeys.data.map((key) => (
            <TableRow key={key.uuid}>
              <TableData>{key.name}</TableData>

              <TableData>
                <Code>{key.fingerprint}</Code>
              </TableData>

              <TableData>
                <Tooltip content={formatDateTime(key.created)}>{formatTimestamp(key.created)}</Tooltip>
              </TableData>

              <TableData>
                <Group gap={4} justify={'right'} wrap={'nowrap'}>
                  <SshKeyDeleteButton sshKey={key} />
                </Group>
              </TableData>
            </TableRow>
          ))}
        </Table>
      )}
    </>
  );
};
