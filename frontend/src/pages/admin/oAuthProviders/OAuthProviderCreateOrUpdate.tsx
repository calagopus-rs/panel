import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider, Stack } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Switch from '@/elements/input/Switch';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import updateOAuthProvider from '@/api/admin/oauth-providers/updateOAuthProvider';
import createOAuthProvider from '@/api/admin/oauth-providers/createOAuthProvider';
import deleteOAuthProvider from '@/api/admin/oauth-providers/deleteOAuthProvider';
import TextArea from '@/elements/input/TextArea';
import TagsInput from '@/elements/input/TagsInput';

export default ({ contextOAuthProvider }: { contextOAuthProvider?: AdminOAuthProvider }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOAuthProvider] = useState<UpdateAdminOAuthProvider>({
    name: '',
    description: '',
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    infoUrl: '',
    scopes: [],
    identifierPath: '',
    usernamePath: '',
    nameFirstPath: '',
    nameLastPath: '',
    enabled: true,
    loginOnly: false,
    linkViewable: true,
    userManageable: true,
    basicAuth: false,
  });

  useEffect(() => {
    setOAuthProvider({
      name: contextOAuthProvider?.name ?? '',
      description: contextOAuthProvider?.description ?? '',
      clientId: contextOAuthProvider?.clientId ?? '',
      clientSecret: contextOAuthProvider?.clientSecret ?? '',
      authUrl: contextOAuthProvider?.authUrl ?? '',
      tokenUrl: contextOAuthProvider?.tokenUrl ?? '',
      infoUrl: contextOAuthProvider?.infoUrl ?? '',
      scopes: contextOAuthProvider?.scopes ?? [],
      identifierPath: contextOAuthProvider?.identifierPath ?? '',
      usernamePath: contextOAuthProvider?.usernamePath ?? '',
      nameFirstPath: contextOAuthProvider?.nameFirstPath ?? '',
      nameLastPath: contextOAuthProvider?.nameLastPath ?? '',
      enabled: contextOAuthProvider?.enabled ?? true,
      loginOnly: contextOAuthProvider?.loginOnly ?? false,
      linkViewable: contextOAuthProvider?.linkViewable ?? true,
      userManageable: contextOAuthProvider?.userManageable ?? true,
      basicAuth: contextOAuthProvider?.basicAuth ?? false,
    });
  }, [contextOAuthProvider]);

  const doCreateOrUpdate = (stay: boolean) => {
    load(true, setLoading);
    if (params?.id) {
      updateOAuthProvider(params.id, oauthProvider)
        .then(() => {
          addToast('OAuth provider updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else if (!stay) {
      createOAuthProvider(oauthProvider)
        .then((oauthProvider) => {
          addToast('OAuth provider created.', 'success');
          navigate(`/admin/oauth-providers/${oauthProvider.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createOAuthProvider(oauthProvider)
        .then(() => {
          addToast('OAuth provider created.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = async () => {
    await deleteOAuthProvider(params.id)
      .then(() => {
        addToast('OAuth provider deleted.', 'success');
        navigate('/admin/oauth-providers');
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
        title={'Confirm OAuth Provider Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{oauthProvider?.name}</Code>?
      </ConfirmationModal>

      <Title order={2} mb={'md'}>
        {params.id ? 'Update' : 'Create'} OAuth Provider
      </Title>
      <Divider mb={'md'} />

      <Stack>
        <Group grow align={'start'}>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={oauthProvider.name || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, name: e.target.value })}
          />
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={oauthProvider.description || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, description: e.target.value || null })}
            rows={3}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Client Id'}
            placeholder={'Client Id'}
            value={oauthProvider.clientId || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, clientId: e.target.value })}
          />
          <TextInput
            withAsterisk={!params.id}
            label={'Client Secret'}
            placeholder={'Client Secret'}
            type={'password'}
            value={oauthProvider.clientSecret || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, clientSecret: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Auth URL'}
            placeholder={'Auth URL'}
            value={oauthProvider.authUrl || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, authUrl: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Token URL'}
            placeholder={'Token URL'}
            value={oauthProvider.tokenUrl || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, tokenUrl: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Info URL'}
            placeholder={'Info URL'}
            value={oauthProvider.infoUrl || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, infoUrl: e.target.value })}
          />
          <Switch
            label={'Basic Auth'}
            description={'Uses HTTP Basic Authentication to transmit client id and secret, not common anymore'}
            checked={oauthProvider.basicAuth || false}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, basicAuth: e.target.checked })}
          />
        </Group>

        <TagsInput
          label={'Scopes'}
          value={oauthProvider.scopes}
          onChange={(value) => setOAuthProvider({ ...oauthProvider, scopes: value })}
        />

        <Group grow>
          <TextInput
            withAsterisk
            label={'Identifier Path'}
            placeholder={'Auth URL'}
            description={
              'The Path to use to extract the unique user identifier from the Info URL response (https://serdejsonpath.live)'
            }
            value={oauthProvider.identifierPath || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, identifierPath: e.target.value })}
          />
          <TextInput
            label={'Username Path'}
            placeholder={'Username Path'}
            description={
              'The Path to use to extract the username from the Info URL response (https://serdejsonpath.live)'
            }
            value={oauthProvider.usernamePath || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, usernamePath: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            label={'First Name Path'}
            placeholder={'First Name URL'}
            description={
              'The Path to use to extract the first name from the Info URL response (https://serdejsonpath.live)'
            }
            value={oauthProvider.nameFirstPath || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, nameFirstPath: e.target.value })}
          />
          <TextInput
            label={'Last Name Path'}
            placeholder={'Last Name Path'}
            description={
              'The Path to use to extract the last name from the Info URL response (https://serdejsonpath.live)'
            }
            value={oauthProvider.nameLastPath || ''}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, nameLastPath: e.target.value })}
          />
        </Group>

        <Group grow>
          <Switch
            label={'Enabled'}
            checked={oauthProvider.enabled || false}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, enabled: e.target.checked })}
          />
          <Switch
            label={'Only allow Login'}
            checked={oauthProvider.loginOnly || false}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, loginOnly: e.target.checked })}
          />
        </Group>

        <Group grow>
          <Switch
            label={'Link Viewable to User'}
            description={'Allows the User to see the Connection and its identifier in the Client UI'}
            checked={oauthProvider.linkViewable || false}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, enabled: e.target.checked })}
          />
          <Switch
            label={'Link Manageable by User'}
            description={'Allows the User to connect and disconnect with this provider'}
            checked={oauthProvider.userManageable || false}
            onChange={(e) => setOAuthProvider({ ...oauthProvider, userManageable: e.target.checked })}
          />
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextOAuthProvider && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextOAuthProvider && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
