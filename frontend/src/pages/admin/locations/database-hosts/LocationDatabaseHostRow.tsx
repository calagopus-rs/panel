import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import deleteLocationDatabaseHost from '@/api/admin/locations/database-hosts/deleteLocationDatabaseHost';
import { useAdminStore } from '@/stores/admin';
import { databaseTypeLabelMapping } from '@/lib/enums';

export default ({ location, databaseHost }: { location: Location; databaseHost: LocationDatabaseHost }) => {
  const { addToast } = useToast();
  const { removeLocationDatabaseHost } = useAdminStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteLocationDatabaseHost(location.uuid, databaseHost.databaseHost.uuid)
      .then(() => {
        removeLocationDatabaseHost(databaseHost);
        addToast('Location Database Host deleted.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Location Database Host Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete the database host
        <Code>{databaseHost.databaseHost.name}</Code>
        from <Code>{location.name}</Code>?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            label: 'Remove',
            onClick: () => setOpenModal('delete'),
            color: 'red',
          },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>
              <Code>{databaseHost.databaseHost.uuid}</Code>
            </TableData>
            <TableData>{databaseHost.databaseHost.name}</TableData>
            <TableData>{databaseTypeLabelMapping[databaseHost.databaseHost.type]}</TableData>
            <TableData>
              <Code>
                {databaseHost.databaseHost.host}:{databaseHost.databaseHost.port}
              </Code>
            </TableData>
            <TableData>
              <Tooltip label={formatDateTime(databaseHost.created)}>{formatTimestamp(databaseHost.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
