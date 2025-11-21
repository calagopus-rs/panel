import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import deleteOAuthLink from '@/api/me/oauth-links/deleteOAuthLink';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

export default function OAuthLinkRow({ oauthLink }: { oauthLink: UserOAuthLink }) {
  const { addToast } = useToast();
  const { removeOAuthLink } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const doDelete = async () => {
    await deleteOAuthLink(oauthLink.uuid)
      .then(() => {
        removeOAuthLink(oauthLink);
        addToast('OAuth Link removed.', 'success');
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
        title='Confirm OAuth Link Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete the
        <Code>{oauthLink.oauthProvider.name}</Code>
        connection from your account?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            disabled: !oauthLink.oauthProvider.userManageable,
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
            <TableData>{oauthLink.oauthProvider.name}</TableData>

            <TableData>
              <Code>{oauthLink.identifier}</Code>
            </TableData>

            <TableData>
              {!oauthLink.lastUsed ? (
                'N/A'
              ) : (
                <Tooltip label={formatDateTime(oauthLink.lastUsed)}>{formatTimestamp(oauthLink.lastUsed)}</Tooltip>
              )}
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(oauthLink.created)}>{formatTimestamp(oauthLink.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
