import { httpErrorToHuman } from '@/api/axios';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import CopyOnClick from '@/elements/CopyOnClick';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEllipsis, faEye, faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import SubuserCreateOrUpdateDialog from './dialogs/SubuserCreateOrUpdateDialog';
// import DatabaseDeleteDialog from './dialogs/DatabaseDeleteDialog';
// import DatabaseDetailsDialog from './dialogs/DatabaseDetailsDialog';

export default ({ subuser }: { subuser: ServerSubuser }) => {
  // const { addToast } = useToast();
  // const server = useServerStore(state => state.server);
  // const { removeDatabase } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'update' | 'delete'>(null);

  // const doDeleteDatabase = () => {
  //   deleteDatabase(server.uuid, database.id)
  //     .then(() => {
  //       setOpenDialog(null);
  //       setTimeout(() => removeDatabase(database), 150);
  //       addToast('Database deleted.', 'success');
  //     })
  //     .catch(error => {
  //       console.error(error);
  //       addToast(httpErrorToHuman(error), 'error');
  //     });
  // };

  const doUpdate = (permissions: string[], ignoredFiles: string[]) => {
    console.log(permissions, ignoredFiles);
  };

  return (
    <>
      {/* <DatabaseDetailsDialog database={database} open={openDialog === 'details'} onClose={() => setOpenDialog(null)} />
      <DatabaseDeleteDialog
        databaseName={database.name}
        onDeleted={() => doDeleteDatabase()}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      /> */}
      <SubuserCreateOrUpdateDialog
        subuser={subuser}
        onUpdated={doUpdate}
        open={openDialog === 'update'}
        onClose={() => setOpenDialog(null)}
      />

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenDialog('update'), color: 'gray' },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
              <Code>{subuser.user.id}</Code>
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={subuser.user.username}>
              {subuser.user.username}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {subuser.user.totpEnabled ? (
                <FontAwesomeIcon className="text-green-500" icon={faLock} />
              ) : (
                <FontAwesomeIcon className="text-red-500" icon={faLockOpen} />
              )}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{subuser.permissions.length}</td>

            <td
              className="relative cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openMenu(rect.left, rect.bottom);
              }}
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </td>
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
