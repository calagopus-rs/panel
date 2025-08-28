import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useUserStore } from '@/stores/user';
import deleteSshKey from '@/api/me/ssh-keys/deleteSshKey';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import CopyOnClick from '@/elements/CopyOnClick';

export default ({ session }: { session: UserSession }) => {
  const { addToast } = useToast();
  const { removeSession } = useUserStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteSshKey(session.uuid)
      .then(() => {
        removeSession(session);
        addToast('Session deleted.', 'success');
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
        title={'Confirm Session Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete the session
        <Code>{session.ip}</Code>
        from your account?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            label: 'Remove',
            disabled: session.isUsing,
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
              <CopyOnClick content={session.ip}>
                <Code>{session.ip}</Code>
              </CopyOnClick>
            </TableData>
            <TableData>{session.isUsing ? 'Yes' : 'No'}</TableData>
            <TableData>{session.userAgent}</TableData>
            <TableData>
              <Tooltip label={formatDateTime(session.lastUsed)}>{formatTimestamp(session.lastUsed)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
