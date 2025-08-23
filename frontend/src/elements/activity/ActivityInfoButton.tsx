import { faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group } from '@mantine/core';
import { useState } from 'react';
import Modal from '../modals/Modal';
import Code from '../Code';
import Button from '../Button';

export default ({ activity }: { activity: ServerActivity | UserActivity }) => {
  const [openModal, setOpenModal] = useState<'view'>(null);

  return (
    <>
      <Modal title={'Activity Details'} onClose={() => setOpenModal(null)} opened={openModal === 'view'}>
        <Code block>{JSON.stringify(activity.data, null, 2)}</Code>

        <Group mt={'md'}>
          <Button variant={'default'} onClick={() => setOpenModal(null)}>
            Close
          </Button>
        </Group>
      </Modal>

      <ActionIcon onClick={() => setOpenModal('view')}>
        <FontAwesomeIcon icon={faInfo} />
      </ActionIcon>
    </>
  );
};
