import getSubusers from '@/api/server/subusers/getSubusers';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import SubuserRow from './SubuserRow';
import SubuserCreateOrUpdateDialog from './dialogs/SubuserCreateOrUpdateDialog';
import createSubuser from '@/api/server/subusers/createSubuser';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, subusers, setSubusers, addSubuser } = useServerStore();

  const [loading, setLoading] = useState(subusers.data.length === 0);
  const [openDialog, setOpenDialog] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  const onPageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  useEffect(() => {
    getSubusers(server.uuid, page).then(data => {
      setSubusers(data);
      setLoading(false);
    });
  }, [page]);

  const doCreate = (email: string, permissions: string[], ignoredFiles: string[], captcha: string) => {
    createSubuser(server.uuid, { email, permissions, ignoredFiles, captcha })
      .then(subuser => {
        addSubuser(subuser);
        setOpenDialog(null);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <SubuserCreateOrUpdateDialog
        onCreated={doCreate}
        open={openDialog === 'create'}
        onClose={() => setOpenDialog(null)}
      />

      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Users</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpenDialog('create')}>Add</Button>
        </div>
      </div>
      <Table>
        <Pagination data={subusers} onPageSelect={onPageSelect}>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name="Id" />
                <TableHeader name="Username" />
                <TableHeader name="2FA Enabled" />
                <TableHeader name="Permissions" />
                <TableHeader />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {subusers.data.map(su => (
                    <SubuserRow subuser={su} key={su.user.id} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : subusers.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </Container>
  );
};
