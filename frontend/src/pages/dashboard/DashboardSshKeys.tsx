import Code from '@/elements/Code';
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
import { useUserStore } from '@/stores/user';
import getSshKeys from '@/api/me/ssh-keys/getSshKeys';
import SshKeyDeleteButton from './actions/SshKeyDeleteButton';
import SshKeyCreateButton from './actions/SshKeyCreateButton';
import { useSearchParams } from 'react-router';

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
      setLoading(false);
    });
  }, [page, search]);

  return (
    <>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>SSH Keys</h1>
        <SshKeyCreateButton />
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper onSearch={setSearch}>
            <Pagination data={sshKeys} onPageSelect={setPage}>
              <div className={'overflow-x-auto'}>
                <table className={'w-full table-auto'}>
                  <TableHead>
                    <TableHeader name={'Name'} />
                    <TableHeader name={'Fingerprint'} />
                    <TableHeader name={'Created'} />
                    <TableHeader />
                  </TableHead>

                  <TableBody>
                    {sshKeys.data.map((key) => (
                      <TableRow key={key.uuid}>
                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{key.name}</td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Code>{key.fingerprint}</Code>
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Tooltip content={formatDateTime(key.created)}>{formatTimestamp(key.created)}</Tooltip>
                        </td>

                        <td className={'relative'}>
                          <SshKeyDeleteButton sshKey={key} />
                        </td>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {sshKeys.data.length === 0 ? <NoItems /> : null}
              </div>
            </Pagination>
          </ContentWrapper>
        </Table>
      )}
    </>
  );
};
