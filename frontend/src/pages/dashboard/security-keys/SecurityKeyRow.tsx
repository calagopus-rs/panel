import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteSecurityKey from '@/api/me/security-keys/deleteSecurityKey.ts';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import SecurityKeyEditModal from './modals/SecurityKeyEditModal.tsx';

export default function SecurityKeyRow({ securityKey }: { securityKey: UserSecurityKey }) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { removeSecurityKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete' | null>(null);

  const doDelete = async () => {
    await deleteSecurityKey(securityKey.uuid)
      .then(() => {
        removeSecurityKey(securityKey);
        addToast(t('pages.account.securityKeys.modal.deleteSecurityKey.toast.deleted', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SecurityKeyEditModal
        securityKey={securityKey}
        opened={openModal === 'edit'}
        onClose={() => setOpenModal(null)}
      />

      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={t('pages.account.securityKeys.modal.deleteSecurityKey.title', {})}
        confirm={t('common.button.delete', {})}
        onConfirmed={doDelete}
      >
        {t('pages.account.securityKeys.modal.deleteSecurityKey.content', { key: securityKey.name }).md()}
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faPencil,
            label: t('common.button.edit', {}),
            onClick: () => setOpenModal('edit'),
            color: 'gray',
          },
          {
            icon: faTrash,
            label: t('common.button.delete', {}),
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
            <TableData>{securityKey.name}</TableData>

            <TableData>
              {!securityKey.lastUsed ? (
                t('common.na', {})
              ) : (
                <Tooltip label={formatDateTime(securityKey.lastUsed)}>{formatTimestamp(securityKey.lastUsed)}</Tooltip>
              )}
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(securityKey.created)}>{formatTimestamp(securityKey.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
