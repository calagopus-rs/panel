import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup';

type Props = ModalProps & {
  serverGroup: UserServerGroup;
};

export default function ServerGroupEditModal({ serverGroup, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { updateServerGroup: updateStateServerGroup } = useUserStore();

  const [name, setName] = useState(serverGroup.name);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    setLoading(true);

    updateServerGroup(serverGroup.uuid, { name })
      .then(() => {
        updateStateServerGroup(serverGroup.uuid, { name });

        onClose();
        addToast('Server group updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Edit Server Group'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!name}>
            Edit
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
