import { faPencil, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteAllocation from '@/api/server/allocations/deleteAllocation.ts';
import updateAllocation from '@/api/server/allocations/updateAllocation.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import AllocationEditModal from './modals/AllocationEditModal.tsx';

export default function AllocationRow({ allocation }: { allocation: ServerAllocation }) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { server, allocations, removeAllocation, setAllocations, updateServer } = useServerStore();

  const [openModal, setOpenModal] = useState<'edit' | 'remove' | null>(null);

  const doSetPrimary = () => {
    updateAllocation(server.uuid, allocation.uuid, { primary: true })
      .then(() => {
        setAllocations({
          ...allocations,
          data: allocations.data.map((a) => ({
            ...a,
            isPrimary: a.uuid === allocation.uuid,
          })),
        });
        updateServer({ allocation });
        addToast(t('pages.server.network.toast.setPrimary', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doUnsetPrimary = () => {
    updateAllocation(server.uuid, allocation.uuid, { primary: false })
      .then(() => {
        setAllocations({
          ...allocations,
          data: allocations.data.map((a) => ({
            ...a,
            isPrimary: false,
          })),
        });
        updateServer({ allocation: null });
        addToast(t('pages.server.network.toast.unsetPrimary', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = async () => {
    await deleteAllocation(server.uuid, allocation.uuid)
      .then(() => {
        removeAllocation(allocation);
        addToast(t('pages.server.network.toast.removed', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <AllocationEditModal allocation={allocation} opened={openModal === 'edit'} onClose={() => setOpenModal(null)} />

      <ConfirmationModal
        opened={openModal === 'remove'}
        onClose={() => setOpenModal(null)}
        title={t('pages.server.network.modal.removeAllocation.title', {})}
        confirm={t('common.button.remove', {})}
        onConfirmed={doRemove}
      >
        {t('pages.server.network.modal.removeAllocation.content', {
          allocation: `${allocation.ipAlias ?? allocation.ip}:${allocation.port}`,
        }).md()}
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: t('common.button.edit', {}), onClick: () => setOpenModal('edit'), color: 'gray' },
          {
            icon: faStar,
            label: t('pages.server.network.button.setPrimary', {}),
            hidden: allocation.isPrimary,
            onClick: doSetPrimary,
            color: 'gray',
          },
          {
            icon: faStar,
            label: t('pages.server.network.button.unsetPrimary', {}),
            hidden: !allocation.isPrimary,
            onClick: doUnsetPrimary,
            color: 'red',
          },
          {
            icon: faTrash,
            label: t('common.button.remove', {}),
            onClick: () => setOpenModal('remove'),
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
            <td className='relative w-10 text-center'>
              {allocation.isPrimary && (
                <Tooltip label={t('pages.server.network.tooltip.primary', {})}>
                  <FontAwesomeIcon icon={faStar} className='text-yellow-500 ml-3' />
                </Tooltip>
              )}
            </td>

            <TableData>
              <Code>{allocation.ipAlias ?? allocation.ip}</Code>
            </TableData>

            <TableData>
              <Code>{allocation.port}</Code>
            </TableData>

            <TableData>{allocation.notes ?? t('common.na', {})}</TableData>

            <TableData>
              <Tooltip label={formatDateTime(allocation.created)}>{formatTimestamp(allocation.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
