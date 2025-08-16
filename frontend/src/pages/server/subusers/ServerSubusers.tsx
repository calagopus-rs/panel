import getSubusers from '@/api/server/subusers/getSubusers';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import SubuserRow from './SubuserRow';
import SubuserCreateOrUpdateDialog from './dialogs/SubuserCreateOrUpdateDialog';
import createSubuser from '@/api/server/subusers/createSubuser';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import getPermissions from '@/api/getPermissions';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, subusers, setSubusers, addSubuser, setAvailablePermissions } = useServerStore();

  const [loading, setLoading] = useState(subusers.data.length === 0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');

    getPermissions().then((res) => {
      setAvailablePermissions(res.subuserPermissions);
    });
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getSubusers(server.uuid, page, search).then((data) => {
      setSubusers(data);
      setLoading(false);
    });
  }, [page, search]);

  const doCreate = (email: string, permissions: string[], ignoredFiles: string[], captcha: string) => {
    createSubuser(server.uuid, { email, permissions, ignoredFiles, captcha })
      .then((subuser) => {
        addSubuser(subuser);
        addToast('Subuser created.', 'success');
        setOpenDialog(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <SubuserCreateOrUpdateDialog
        onCreate={doCreate}
        open={openDialog === 'create'}
        onClose={() => setOpenDialog(null)}
      />

      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Users</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => setOpenDialog('create')}>Add</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={subusers} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'Username'} />
                  <TableHeader name={'2FA Enabled'} />
                  <TableHeader name={'Permissions'} />
                  <TableHeader name={'Ignored Files'} />
                  <TableHeader />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {subusers.data.map((su) => (
                      <SubuserRow subuser={su} key={su.user.uuid} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : subusers.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
