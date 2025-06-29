import { httpErrorToHuman } from '@/api/axios';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import CopyOnClick from '@/elements/CopyOnClick';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/elements/Toast';
import { useServerStore } from '@/stores/server';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import DatabaseDeleteDialog from './dialogs/DatabaseDeleteDialog';
import DatabaseDetailsDialog from './dialogs/DatabaseDetailsDialog';

export default ({ database }: { database: ServerDatabase }) => {
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
