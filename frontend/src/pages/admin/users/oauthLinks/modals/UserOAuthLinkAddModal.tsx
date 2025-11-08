import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import getOAuthProviders from '@/api/admin/oauth-providers/getOAuthProviders';
import createUserOAuthLink from '@/api/admin/users/oauthLinks/createUserOAuthLink';
import TextInput from '@/elements/input/TextInput';

export default ({ user, opened, onClose }: ModalProps & { user: User }) => {
  const { addToast } = useToast();
  const { addUserOAuthLink } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [selectedOAuthProvider, setSelectedOAuthProvider] = useState<AdminOAuthProvider | null>(null);

  const oauthProviders = useSearchableResource<AdminOAuthProvider>({
    fetcher: (search) => getOAuthProviders(1, search),
  });

  useEffect(() => {
    if (!opened) {
      oauthProviders.setSearch('');
      setSelectedOAuthProvider(null);
    }
  }, [opened]);

  const doAdd = () => {
    load(true, setLoading);

    createUserOAuthLink(user.uuid, selectedOAuthProvider.uuid, identifier)
      .then((oauthLink) => {
        addToast('OAuth Link added.', 'success');

        onClose();
        addUserOAuthLink(oauthLink);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Add OAuth Link'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'OAuth Provider'}
          placeholder={'OAuth Provider'}
          value={selectedOAuthProvider?.uuid}
          onChange={(value) => setSelectedOAuthProvider(oauthProviders.items.find((p) => p.uuid === value))}
          data={oauthProviders.items.map((oauthProvider) => ({
            label: oauthProvider.name,
            value: oauthProvider.uuid,
          }))}
          searchable
          searchValue={oauthProviders.search}
          onSearchChange={oauthProviders.setSearch}
        />

        <TextInput
          withAsterisk
          label={'Identifier'}
          placeholder={'Identifier'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <Group mt={'md'}>
          <Button onClick={doAdd} loading={loading} disabled={!selectedOAuthProvider || !identifier}>
            Add
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
