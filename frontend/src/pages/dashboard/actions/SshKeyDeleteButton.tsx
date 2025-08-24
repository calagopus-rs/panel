import { httpErrorToHuman } from '@/api/axios';
import deleteSshKey from '@/api/me/ssh-keys/deleteSshKey';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { useState } from 'react';

export default ({ sshKey }: { sshKey: UserSshKey }) => {
  const { addToast } = useToast();
  const { removeSshKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteSshKey(sshKey.uuid)
      .then(() => {
        addToast('SSH key deleted.', 'success');
        setOpenModal(null);
        removeSshKey(sshKey);
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
        title={'Confirm SSH Key Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Removing the <Code>{sshKey.name}</Code> SSH key will invalidate its usage across the Panel.
      </ConfirmationModal>
      <ActionIcon color={'red'} onClick={() => setOpenModal('delete')}>
        <FontAwesomeIcon icon={faTrash} />
      </ActionIcon>
    </>
  );
};
