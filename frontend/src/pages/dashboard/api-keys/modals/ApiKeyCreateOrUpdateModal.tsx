import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import getPermissions from '@/api/getPermissions.ts';
import createApiKey from '@/api/me/api-keys/createApiKey.ts';
import updateApiKey from '@/api/me/api-keys/updateApiKey.ts';
import Button from '@/elements/Button.tsx';
import DateTimePicker from '@/elements/input/DateTimePicker.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import PermissionSelector from '@/elements/PermissionSelector.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(3).max(31),
  allowedIps: z.ipv4().or(z.ipv6()).or(z.cidrv4()).or(z.cidrv6()).array(),
  userPermissions: z.array(z.string()),
  serverPermissions: z.array(z.string()),
  adminPermissions: z.array(z.string()),
  expires: z.date().nullable(),
});

type Props = ModalProps & {
  contextApiKey?: UserApiKey;
};

export default function ApiKeyCreateOrUpdateModal({ contextApiKey, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { addApiKey, updateApiKey: updateStateApiKey } = useUserStore();
  const { availablePermissions, setAvailablePermissions } = useGlobalStore();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: '',
      allowedIps: [],
      userPermissions: [],
      serverPermissions: [],
      adminPermissions: [],
      expires: null,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  useEffect(() => {
    if (contextApiKey) {
      form.setValues({
        name: contextApiKey.name,
        allowedIps: contextApiKey.allowedIps,
        userPermissions: contextApiKey.userPermissions,
        serverPermissions: contextApiKey.serverPermissions,
        adminPermissions: contextApiKey.adminPermissions,
        expires: contextApiKey.expires ? new Date(contextApiKey.expires) : null,
      });
    }
  }, [contextApiKey]);

  useEffect(() => {
    getPermissions().then((res) => {
      setAvailablePermissions(res);
      setLoading(false);
    });
  }, []);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (contextApiKey) {
      updateApiKey(contextApiKey.uuid, form.values)
        .then(() => {
          addToast(t('pages.account.apiKeys.modal.updateApiKey.toast.updated', {}), 'success');
          onClose();
          updateStateApiKey(contextApiKey.uuid, form.values);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      createApiKey(form.values)
        .then((key) => {
          addToast(t('pages.account.apiKeys.modal.createApiKey.toast.created', {}), 'success');
          onClose();
          addApiKey({ ...key.apiKey, keyStart: key.key });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <Modal
      title={
        contextApiKey
          ? t('pages.account.apiKeys.modal.updateApiKey.title', {})
          : t('pages.account.apiKeys.modal.createApiKey.title', {})
      }
      onClose={onClose}
      opened={opened}
      size='xl'
    >
      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={t('common.form.name', {})}
            placeholder={t('common.form.name', {})}
            {...form.getInputProps('name')}
          />

          <DateTimePicker
            label={t('pages.account.apiKeys.table.columns.expires', {})}
            placeholder={t('pages.account.apiKeys.table.columns.expires', {})}
            clearable
            value={form.values.expires}
            onChange={(value) => form.setFieldValue('expires', value ? new Date(value) : null)}
          />
        </Group>

        <TagsInput
          label={t('pages.account.apiKeys.form.allowedIps', {})}
          placeholder={t('pages.account.apiKeys.form.allowedIpsPlaceholder', {})}
          {...form.getInputProps('allowedIps')}
        />

        {availablePermissions?.userPermissions && (
          <PermissionSelector
            label={t('pages.account.apiKeys.form.userPermissions', {})}
            permissionsMapType='userPermissions'
            permissions={availablePermissions.userPermissions}
            selectedPermissions={form.values.userPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('userPermissions', permissions)}
          />
        )}
        {availablePermissions?.serverPermissions && (
          <PermissionSelector
            label={t('pages.account.apiKeys.form.serverPermissions', {})}
            permissionsMapType='serverPermissions'
            permissions={availablePermissions.serverPermissions}
            selectedPermissions={form.values.serverPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('serverPermissions', permissions)}
          />
        )}
        {user!.admin && availablePermissions?.adminPermissions && (
          <PermissionSelector
            label={t('pages.account.apiKeys.form.adminPermissions', {})}
            permissionsMapType='adminPermissions'
            permissions={availablePermissions.adminPermissions}
            selectedPermissions={form.values.adminPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('adminPermissions', permissions)}
          />
        )}

        <Group mt='md'>
          <Button onClick={doCreateOrUpdate} loading={loading} disabled={!form.isValid()}>
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
