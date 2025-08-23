import { httpErrorToHuman } from '@/api/axios';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import CopyOnClick from '@/elements/CopyOnClick';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import DatabaseDeleteDialog from './dialogs/DatabaseDeleteDialog';
import DatabaseDetailsDialog from './dialogs/DatabaseDetailsDialog';
import { TableData, TableRow } from '@/elements/table/TableNew';

export default ({ database }: { database: ServerDatabase }) => {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);
  const { removeDatabase } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'details' | 'delete'>(null);
  const host = `${database.host}:${database.port}`;

  const doDeleteDatabase = () => {
    deleteDatabase(server.uuid, database.uuid)
      .then(() => {
        setOpenDialog(null);
        setTimeout(() => removeDatabase(database), 150);
        addToast('Database deleted.', 'success');
      })
      .catch((error) => {
        console.error(error);
        addToast(httpErrorToHuman(error), 'error');
      });
  };

  return (
    <>
      <DatabaseDetailsDialog database={database} open={openDialog === 'details'} onClose={() => setOpenDialog(null)} />
      <DatabaseDeleteDialog
        databaseName={database.name}
        onDelete={() => doDeleteDatabase()}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      />

      <ContextMenu
        items={[
          { icon: faEye, label: 'Details', onClick: () => setOpenDialog('details'), color: 'gray' },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>{database.name}</TableData>

            <TableData>
              <CopyOnClick content={host}>
                <Code>{host}</Code>
              </CopyOnClick>
            </TableData>

            <TableData>{database.username}</TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
