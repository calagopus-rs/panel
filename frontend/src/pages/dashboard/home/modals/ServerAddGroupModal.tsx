import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup';
import Select from '@/elements/input/Select';

type Props = ModalProps & {
  server: Server;
};

export default function ServerAddGroupModal({ server, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { serverGroups, updateServerGroup: updateStateServerGroup } = useUserStore();

  const [selectedServerGroup, setSelectedServerGroup] = useState<UserServerGroup>(null);
  const [loading, setLoading] = useState(false);

  const doAdd = () => {
    setLoading(true);

    updateServerGroup(selectedServerGroup.uuid, { serverOrder: [...selectedServerGroup.serverOrder, server.uuid] })
      .then(() => {
        updateStateServerGroup(selectedServerGroup.uuid, {
          serverOrder: [...selectedServerGroup.serverOrder, server.uuid],
        });
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={`Add ${server.name} to Server Group`} onClose={onClose} opened={opened}>
      <Select
        label='Server Group'
        placeholder='Server Group'
        value={selectedServerGroup?.uuid || ''}
        className='w-full'
        searchable
        onChange={(value) => setSelectedServerGroup(serverGroups.find((g) => g.uuid === value))}
        data={serverGroups
          .filter((g) => !g.serverOrder.includes(server.uuid))
          .map((g) => ({
            label: g.name,
            value: g.uuid,
          }))}
      />

      <Group mt='md'>
        <Button onClick={doAdd} loading={loading} disabled={!selectedServerGroup}>
          Add
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
