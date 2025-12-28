import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteOAuthLink from '@/api/me/oauth-links/deleteOAuthLink.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

export default function OAuthLinkRow({ oauthLink }: { oauthLink: UserOAuthLink }) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { removeOAuthLink } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete' | null>(null);

  const doDelete = async () => {
    await deleteOAuthLink(oauthLink.uuid)
      .then(() => {
        removeOAuthLink(oauthLink);
        addToast(t('pages.account.oauthLinks.modal.deleteOAuthLink.toast.removed', {}), 'success');
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
        title={t('pages.account.oauthLinks.modal.deleteOAuthLink.title', {})}
        confirm={t('common.button.delete', {})}
        onConfirmed={doDelete}
      >
        {t('pages.account.oauthLinks.modal.deleteOAuthLink.content', {
          provider: oauthLink.oauthProvider.name,
        }).md()}
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            disabled: !oauthLink.oauthProvider.userManageable,
            label: t('common.button.remove', {}),
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
                t('common.na', {})
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
