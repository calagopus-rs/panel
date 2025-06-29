import getDatabases from '@/api/server/databases/getDatabases';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import CopyOnClick from '@/elements/CopyOnClick';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import CreateDatabaseButton from './CreateDatabaseButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import DatabaseDeleteDialog from './dialogs/DatabaseDeleteDialog';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import { useToast } from '@/elements/Toast';
import { httpErrorToHuman } from '@/api/axios';
import DatabaseDetailsDialog from './dialogs/DatabaseDetailsDialog';

const DatabaseRow = ({ database }: { database: ServerDatabase }) => {
  const { addToast } = useToast();
  const server = useServerStore(state => state.data);
  const { removeDatabase } = useServerStore(state => state.databases);

  const [openDialog, setOpenDialog] = useState<'details' | 'delete'>(null);

  const doDeleteDatabase = () => {
    deleteDatabase(server.id, database.id)
      .then(() => {
        setOpenDialog(null);
        setTimeout(() => removeDatabase(database), 150);
        addToast('Database deleted.', 'success');
      })
      .catch(error => {
        console.error(error);
        addToast(httpErrorToHuman(error), 'error');
      });
  };

  return (
    <>
      <DatabaseDetailsDialog database={database} open={openDialog === 'details'} onClose={() => setOpenDialog(null)} />
      <DatabaseDeleteDialog
        databaseName={database.name}
        onDeleted={() => doDeleteDatabase()}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      />

      <ContextMenu
        key={database.id}
        items={[
          { label: 'Details', onClick: () => setOpenDialog('details'), color: 'gray' },
          { label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={database.name}>
              {database.name}
            </td>

            <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
              <CopyOnClick content={database.connectionString}>
                <Code>{database.connectionString}</Code>
              </CopyOnClick>
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={database.username}>
              {database.username}
            </td>

            <td className="relative">
              <FontAwesomeIcon
                icon={faEllipsis}
                className="cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  openMenu(rect.left, rect.bottom);
                }}
              />
            </td>
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};

export default () => {
  const server = useServerStore(state => state.data);
  const { databases, setDatabases } = useServerStore(state => state.databases);

  const [loading, setLoading] = useState(databases.length === 0);

  useEffect(() => {
    getDatabases(server.uuid).then(data => {
      setDatabases(data);
      setLoading(false);
    });
  }, []);

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Databases</h1>
        <div className="flex gap-2">
          <CreateDatabaseButton />
        </div>
      </div>
      <Table>
        <ContentWrapper>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name={'Name'} />
                <TableHeader name={'Address'} />
                <TableHeader name={'Username'} />
                <TableHeader />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {databases.map(database => (
                    <DatabaseRow key={database.id} database={database} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : databases.length === 0 ? <NoItems /> : null}
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
