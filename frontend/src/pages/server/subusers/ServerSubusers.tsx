import getSubusers from '@/api/server/subusers/getSubusers';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import SubuserRow from './SubuserRow';
import SubuserCreateDialog from './dialogs/SubuserCreateDialog';
import createSubuser from '@/api/server/subusers/createSubuser';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';

export default () => {
  const { addToast } = useToast();
  const { server, subusers, setSubusers, addSubuser } = useServerStore();

  const [loading, setLoading] = useState(subusers.data.length === 0);
  const [openDialog, setOpenDialog] = useState<'create'>(null);

  useEffect(() => {
    getSubusers(server.uuid).then(data => {
      setSubusers(data);
      setLoading(false);
    });
  }, []);

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
      <SubuserCreateDialog onCreated={doCreate} open={openDialog === 'create'} onClose={() => setOpenDialog(null)} />

      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Users</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpenDialog('create')}>Add</Button>
        </div>
      </div>
      <Table>
        <Pagination data={subusers} onPageSelect={() => {}}>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name="Id" />
                <TableHeader name="Username" />
                <TableHeader name="2FA Enabled" />
                <TableHeader name="Permissions" />
              </TableHead>

              <TableBody>
                {subusers.data.map(su => (
                  <SubuserRow subuser={su} key={su.user.id} />
                ))}
              </TableBody>
            </table>

            {loading ? <Spinner.Centered /> : subusers.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </Container>
  );
};
