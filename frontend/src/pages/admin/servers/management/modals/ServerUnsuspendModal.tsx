import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { ModalProps } from '@mantine/core';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Code from '@/elements/Code';
import updateServer from '@/api/admin/servers/updateServer';
import { useAdminStore } from '@/stores/admin';

export default ({ server, opened, onClose }: ModalProps & { server: AdminServer }) => {
  const { addToast } = useToast();
  const { updateServer: updateStoreServer } = useAdminStore();

  const doSuspend = () => {
    updateServer(server.uuid, {
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
};
