import { ModalProps } from '@mantine/core';
import clearServerState from '@/api/admin/servers/clearServerState.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Code from '@/elements/Code.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function ServerClearStateModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const { updateServer } = useAdminStore();

  const doClearState = async () => {
    await clearServerState(server.uuid)
      .then(() => {
        addToast('Server state cleared.', 'success');
        onClose();
        updateServer({ ...server, status: null });
        server.status = null;
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={opened}
        onClose={() => onClose()}
        title='Confirm Server State Clear'
        confirm='Clear State'
        onConfirmed={doClearState}
      >
        Are you sure you want to clear the state of <Code>{server.name}</Code>? This will clear any known pending
        transfers and status failures, please make sure it is safe to do this before clicking without reason.
      </ConfirmationModal>
    </>
  );
}
