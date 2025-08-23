import { httpErrorToHuman } from '@/api/axios';
import deleteApiKey from '@/api/me/api-keys/deleteApiKey';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { useState } from 'react';

export default ({ apiKey }: { apiKey: UserApiKey }) => {
  const { addToast } = useToast();
  const { removeApiKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteApiKey(apiKey.keyStart)
      .then(() => {
        addToast('API key deleted.', 'success');
        setOpenModal(null);
        removeApiKey(apiKey);
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
        title={'Confirm API Key Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete this API key? All requests using the <Code>{apiKey.keyStart}</Code> key will no
        longer work.
      </ConfirmationModal>
      <ActionIcon color={'red'} onClick={() => setOpenModal('delete')}>
        <FontAwesomeIcon icon={faTrash} />
      </ActionIcon>
    </>
  );
};
