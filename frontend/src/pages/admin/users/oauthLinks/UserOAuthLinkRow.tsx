import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import Tooltip from '@/elements/Tooltip';
import { NavLink } from 'react-router';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import deleteUserOAuthLink from '@/api/admin/users/oauthLinks/deleteUserOAuthLink';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import { useAdminStore } from '@/stores/admin';

export const userOAuthLinkTableColumns = ['ID', 'OAuth Provider', 'Identifier', 'Last Used', 'Created', ''];

export default ({ user, userOAuthLink }: { user: User; userOAuthLink: UserOAuthLink }) => {
  const { addToast } = useToast();
  const { removeUserOAuthLink } = useAdminStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const doDelete = async () => {
    await deleteUserOAuthLink(user.uuid, userOAuthLink.uuid)
      .then(() => {
        removeUserOAuthLink(userOAuthLink);
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
        title={'Confirm OAuth Link Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete the
        <Code>{userOAuthLink.oauthProvider.name}</Code>
        connection from <Code>{user.username}</Code>?
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
              <Code>{userOAuthLink.uuid}</Code>
            </TableData>

            <TableData>
              <NavLink
                to={`/admin/oauth-providers/${userOAuthLink.oauthProvider.uuid}`}
                className={'text-blue-400 hover:text-blue-200 hover:underline'}
              >
                <Code>{userOAuthLink.oauthProvider.name}</Code>
              </NavLink>
            </TableData>

            <TableData>
              <Code>{userOAuthLink.identifier}</Code>
            </TableData>

            <TableData>
              {!userOAuthLink.lastUsed ? (
                'N/A'
              ) : (
                <Tooltip label={formatDateTime(userOAuthLink.lastUsed)}>
                  {formatTimestamp(userOAuthLink.lastUsed)}
                </Tooltip>
              )}
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(userOAuthLink.created)}>{formatTimestamp(userOAuthLink.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
