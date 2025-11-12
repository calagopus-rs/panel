import { Group, ModalProps, Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import getPermissions from '@/api/getPermissions';
import createApiKey from '@/api/me/api-keys/createApiKey';
import updateApiKey from '@/api/me/api-keys/updateApiKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import PermissionSelector from '@/elements/PermissionSelector';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useGlobalStore } from '@/stores/global';
import { useUserStore } from '@/stores/user';

type Props = ModalProps & {
  contextApiKey?: UserApiKey;
};

export default function ApiKeyCreateOrUpdateModal({ contextApiKey, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { addApiKey, updateApiKey: updateStateApiKey } = useUserStore();

  const { user } = useAuth();
  const { availablePermissions, setAvailablePermissions } = useGlobalStore();

  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<UpdateUserApiKey>({
    name: '',
    userPermissions: [],
    serverPermissions: [],
    adminPermissions: [],
  });

  useEffect(() => {
    if (contextApiKey) {
      setApiKey({
        name: contextApiKey.name,
        userPermissions: contextApiKey.userPermissions,
        serverPermissions: contextApiKey.serverPermissions,
        adminPermissions: contextApiKey.adminPermissions,
      });
    }
  }, [contextApiKey]);

  useEffect(() => {
    getPermissions().then((res) => {
      setAvailablePermissions(res);
      load(false, setLoading);
    });
  }, []);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (contextApiKey) {
      updateApiKey(contextApiKey.uuid, apiKey)
        .then(() => {
          addToast('API key updated.', 'success');
          onClose();
          updateStateApiKey(contextApiKey.uuid, apiKey);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createApiKey(apiKey)
        .then((key) => {
          addToast('API key created.', 'success');
          onClose();
          addApiKey({ ...key.apiKey, keyStart: key.key });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  return (
    <Modal title={`${contextApiKey ? 'Update' : 'Create'} API Key`} onClose={onClose} opened={opened} size={'xl'}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={apiKey.name}
          onChange={(e) => setApiKey({ ...apiKey, name: e.target.value })}
        />

        <Stack>
          <Title order={3}>User Permissions</Title>
          {availablePermissions?.userPermissions && (
            <PermissionSelector
              permissions={availablePermissions.userPermissions}
              selectedPermissions={apiKey.userPermissions}
              setSelectedPermissions={(permissions) => setApiKey({ ...apiKey, userPermissions: permissions })}
            />
          )}
        </Stack>
        <Stack>
          <Title order={3}>Server Permissions</Title>
          {availablePermissions?.serverPermissions && (
            <PermissionSelector
              permissions={availablePermissions.serverPermissions}
              selectedPermissions={apiKey.serverPermissions}
              setSelectedPermissions={(permissions) => setApiKey({ ...apiKey, serverPermissions: permissions })}
            />
          )}
        </Stack>
        <Stack>
          <Title order={3}>Admin Permissions</Title>
          {user.admin && availablePermissions?.adminPermissions && (
            <PermissionSelector
              permissions={availablePermissions.adminPermissions}
              selectedPermissions={apiKey.adminPermissions}
              setSelectedPermissions={(permissions) => setApiKey({ ...apiKey, adminPermissions: permissions })}
            />
          )}
        </Stack>

        <Group mt={'md'}>
          <Button onClick={doCreateOrUpdate} loading={loading} disabled={!apiKey.name}>
            Save
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
