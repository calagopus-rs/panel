import { ModalProps } from '@mantine/core';
import updateServer from '@/api/admin/servers/updateServer';
import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function ServerUnsuspendModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const { updateServer: updateStoreServer } = useAdminStore();

  const doSuspend = async () => {
    await updateServer(server.uuid, {
      suspended: false,
    })
      .then(() => {
        addToast('Server unsuspended.', 'success');
        onClose();
        updateStoreServer({ ...server, suspended: false });
        server.suspended = false;
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
        title={'Confirm Server Unsuspension'}
        confirm={'Unsuspend'}
        confirmColor={'green'}
        onConfirmed={doSuspend}
      >
        Are you sure you want to unsuspend <Code>{server.name}</Code>? This will allow the server to start again. The
        user will be able to access their files and otherwise manage the server through the panel or API.
      </ConfirmationModal>
    </>
  );
}
