import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteSession from '@/api/me/sessions/deleteSession.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

export default function SessionRow({ session }: { session: UserSession }) {
  const { addToast } = useToast();
  const { removeSession } = useUserStore();

  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const doDelete = async () => {
    await deleteSession(session.uuid)
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
        title='Confirm Session Deletion'
        confirm='Delete'
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
}
