import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(2).max(31),
});

type Props = ModalProps & {
  serverGroup: UserServerGroup;
};

export default function ServerGroupEditModal({ serverGroup, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { updateServerGroup: updateStateServerGroup } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: serverGroup.name,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  const doUpdate = () => {
    setLoading(true);

    updateServerGroup(serverGroup.uuid, form.values)
      .then(() => {
        updateStateServerGroup(serverGroup.uuid, form.values);

        onClose();
        addToast(t('pages.account.home.tabs.groupedServers.page.modal.editServerGroup.toast.updated', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      title={t('pages.account.home.tabs.groupedServers.page.modal.editServerGroup.title', {})}
      onClose={onClose}
      opened={opened}
    >
      <Stack>
        <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!form.isValid()}>
            {t('common.button.save', {})}
          </Button>
          <Button variant='default' onClick={onClose}>
            {t('common.button.close', {})}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
