import { httpErrorToHuman } from '@/api/axios';
import deleteSession from '@/api/me/sessions/deleteSession';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { useState } from 'react';

export default ({ session }: { session: UserSession }) => {
  const { addToast } = useToast();
  const { removeSession } = useUserStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteSession(session.uuid)
      .then(() => {
        addToast('Session signed out.', 'success');
        setOpenModal(null);
        removeSession(session);
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
        title={'Confirm Session Sign Out'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Signing out will invalidate the session.
      </ConfirmationModal>
      <ActionIcon color={'red'} onClick={() => setOpenModal('delete')}>
        <FontAwesomeIcon icon={faSignOut} />
      </ActionIcon>
    </>
  );
};
