import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import getBackups from '@/api/server/backups/getBackups';
import BackupRow from './BackupRow';
import BackupCreateDialog from './dialogs/BackupCreateDialog';
import createBackup from '@/api/server/backups/createBackup';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, backups, setBackups, addBackup } = useServerStore();

  const [loading, setLoading] = useState(backups.data.length === 0);
  const [openDialog, setOpenDialog] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  const onPageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  useEffect(() => {
    getBackups(server.uuid, page).then((data) => {
      setBackups(data);
      setLoading(false);
    });
  }, [page]);

  const doCreate = (name: string, ignoredFiles: string[]) => {
    createBackup(server.uuid, { name, ignoredFiles })
      .then((backup) => {
        addBackup(backup);
        addToast('Backup created.', 'success');
        setOpenDialog(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <BackupCreateDialog onCreate={doCreate} open={openDialog === 'create'} onClose={() => setOpenDialog(null)} />

      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Backups</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => setOpenDialog('create')}>Create</Button>
        </div>
      </div>
      <Table>
        <Pagination data={backups} onPageSelect={onPageSelect}>
          <div className={'overflow-x-auto'}>
            <table className={'w-full table-auto'}>
              <TableHead>
                <TableHeader name={'Name'} />
                <TableHeader name={'Checksum'} />
                <TableHeader name={'Size'} />
                <TableHeader name={'Created At'} />
                <TableHeader name={'Locked?'} />
                <TableHeader />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {backups.data.map((backup) => (
                    <BackupRow backup={backup} key={backup.uuid} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : backups.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </Container>
  );
};
