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
import { useUserStore } from '@/stores/user';
import getSshKeys from '@/api/me/ssh/getSshKeys';
import SshKeyDeleteButton from './actions/SshKeyDeleteButton';
import SshKeyCreateButton from './actions/SshKeyCreateButton';

export default () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { sshKeys, setSshKeys } = useUserStore();

  useEffect(() => {
    getSshKeys(page).then((data) => {
      setSshKeys(data);
      setLoading(false);
    });
  }, [page]);

  return (
    <Container>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>SSH Keys</h1>
        <SshKeyCreateButton />
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper>
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
                      <TableRow key={key.id}>
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
    </Container>
  );
};
