import { ModalProps } from '@mantine/core';
import updateServer from '@/api/admin/servers/updateServer';
import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function ServerSuspendModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const { updateServer: updateStoreServer } = useAdminStore();

  const doSuspend = async () => {
    await updateServer(server.uuid, {
      suspended: true,
    })
      .then(() => {
        addToast('Server suspended.', 'success');
        onClose();
        updateStoreServer({ ...server, suspended: true });
        server.suspended = true;
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
        title={'Confirm Server Suspension'}
        confirm={'Suspend'}
        onConfirmed={doSuspend}
      >
        Are you sure you want to suspend <Code>{server.name}</Code>? This will stop the server and prevent it from
        starting. All running processes will be stopped and the user will not be able to access their files or otherwise
        manage the server through the panel or API.
      </ConfirmationModal>
    </>
  );
}
