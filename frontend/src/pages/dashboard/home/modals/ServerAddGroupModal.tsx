import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

type Props = ModalProps & {
  server: Server;
};

export default function ServerAddGroupModal({ server, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { serverGroups, updateServerGroup: updateStateServerGroup } = useUserStore();

  const [selectedServerGroup, setSelectedServerGroup] = useState<UserServerGroup | null>(null);
  const [loading, setLoading] = useState(false);

  const doAdd = () => {
    if (!selectedServerGroup) {
      return;
    }

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
    <Modal
      title={t('pages.account.home.tabs.allServers.page.modal.addToServerGroup.title', { server: server.name })}
      onClose={onClose}
      opened={opened}
    >
      <Select
        label={t('pages.account.home.tabs.allServers.page.modal.addToServerGroup.form.serverGroup', {})}
        placeholder={t('pages.account.home.tabs.allServers.page.modal.addToServerGroup.form.serverGroup', {})}
        value={selectedServerGroup?.uuid || ''}
        className='w-full'
        searchable
        onChange={(value) => setSelectedServerGroup(serverGroups.find((g) => g.uuid === value) ?? null)}
        data={serverGroups
          .filter((g) => !g.serverOrder.includes(server.uuid))
          .map((g) => ({
            label: g.name,
            value: g.uuid,
          }))}
      />

      <Group mt='md'>
        <Button onClick={doAdd} loading={loading} disabled={!selectedServerGroup}>
          {t('common.button.add', {})}
        </Button>
        <Button variant='default' onClick={onClose}>
          {t('common.button.close', {})}
        </Button>
      </Group>
    </Modal>
  );
}
