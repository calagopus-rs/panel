import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider, Stack } from '@mantine/core';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Switch from '@/elements/input/Switch';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import updateOAuthProvider from '@/api/admin/oauth-providers/updateOAuthProvider';
import createOAuthProvider from '@/api/admin/oauth-providers/createOAuthProvider';
import deleteOAuthProvider from '@/api/admin/oauth-providers/deleteOAuthProvider';
import TextArea from '@/elements/input/TextArea';
import TagsInput from '@/elements/input/TagsInput';
import Card from '@/elements/Card';
import { useGlobalStore } from '@/stores/global';
import jsYaml from 'js-yaml';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import { faChevronDown, faFileDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextOAuthProvider }: { contextOAuthProvider?: AdminOAuthProvider }) => {
  const { addToast } = useToast();
  const { settings } = useGlobalStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateAdminOAuthProvider>({
    initialValues: {
      name: '',
      description: '',
      clientId: '',
      clientSecret: '',
      authUrl: '',
      tokenUrl: '',
      infoUrl: '',
      scopes: [],
      identifierPath: '',
      emailPath: '',
      usernamePath: '',
      nameFirstPath: '',
      nameLastPath: '',
      enabled: true,
      loginOnly: false,
      linkViewable: true,
      userManageable: true,
      basicAuth: false,
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateAdminOAuthProvider, AdminOAuthProvider>({
    form,
    createFn: () => createOAuthProvider(form.values),
    updateFn: () => updateOAuthProvider(contextOAuthProvider?.uuid, form.values),
    deleteFn: () => deleteOAuthProvider(contextOAuthProvider?.uuid),
    doUpdate: !!contextOAuthProvider,
    basePath: '/admin/oauth-providers',
    resourceName: 'OAuth Provider',
  });

  useEffect(() => {
    if (contextOAuthProvider) {
      form.setValues({
        ...contextOAuthProvider,
      });
    }
  }, [contextOAuthProvider]);

  const doExport = (format: 'json' | 'yaml') => {
    addToast('OAuth Provider exported.', 'success');

    let data: AdminOAuthProvider = JSON.parse(JSON.stringify(contextOAuthProvider));
    data.uuid = undefined;
    data.created = undefined;
    data.clientId = undefined;
    data.clientSecret = undefined;
    data.description = data.description || null;
    data.emailPath = data.emailPath || null;
    data.usernamePath = data.usernamePath || null;
    data.nameFirstPath = data.nameFirstPath || null;
    data.nameLastPath = data.nameLastPath || null;
    data = transformKeysToSnakeCase(data);

    if (format === 'json') {
      const jsonData = JSON.stringify(data, undefined, 2);
      const fileURL = URL.createObjectURL(new Blob([jsonData], { type: 'text/plain' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = fileURL;
      downloadLink.download = `oauth-provider-${contextOAuthProvider.uuid}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      URL.revokeObjectURL(fileURL);
      downloadLink.remove();
    } else {
      const yamlData = jsYaml.dump(data, { flowLevel: -1, forceQuotes: true });
      const fileURL = URL.createObjectURL(new Blob([yamlData], { type: 'text/plain' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = fileURL;
      downloadLink.download = `oauth-provider-${contextOAuthProvider.uuid}.yml`;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      URL.revokeObjectURL(fileURL);
      downloadLink.remove();
    }
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
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Title order={2} mb={'md'}>
        {contextOAuthProvider ? 'Update' : 'Create'} OAuth Provider
      </Title>
      <Divider mb={'md'} />

      <Stack>
        <Group grow align={'start'}>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
          <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />
        </Group>

        {contextOAuthProvider && (
          <Card className={'flex flex-row! items-center justify-between'}>
            <Title order={4}>Redirect URL</Title>
            <Code>
              {settings.app.url}/api/auth/oauth/{contextOAuthProvider.uuid}
            </Code>
          </Card>
        )}

        <Group grow>
          <TextInput withAsterisk label={'Client Id'} placeholder={'Client Id'} {...form.getInputProps('clientId')} />
          <TextInput
            withAsterisk={!contextOAuthProvider}
            label={'Client Secret'}
            placeholder={'Client Secret'}
            type={'password'}
            {...form.getInputProps('clientSecret')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label={'Auth URL'} placeholder={'Auth URL'} {...form.getInputProps('authUrl')} />
          <TextInput withAsterisk label={'Token URL'} placeholder={'Token URL'} {...form.getInputProps('tokenUrl')} />
        </Group>

        <Group grow>
          <TextInput withAsterisk label={'Info URL'} placeholder={'Info URL'} {...form.getInputProps('infoUrl')} />
          <Switch
            label={'Basic Auth'}
            description={'Uses HTTP Basic Authentication to transmit client id and secret, not common anymore'}
            {...form.getInputProps('basicAuth')}
          />
        </Group>

        <Group grow>
          <TagsInput
            label={'Scopes'}
            description={'The OAuth2 Scopes to request, make sure to include scopes for email/profile info when needed'}
            {...form.getInputProps('scopes')}
          />
          <TextInput
            withAsterisk
            label={'Identifier Path'}
            placeholder={'Identifier Path'}
            description={
              'The Path to use to extract the unique user identifier from the Info URL response (https://serdejsonpath.live)'
            }
            {...form.getInputProps('identifierPath')}
          />
        </Group>

        <Group grow>
          <TextInput
            label={'Email Path'}
            placeholder={'Email Path'}
            description={'The Path to use to extract the email from the Info URL response (https://serdejsonpath.live)'}
            {...form.getInputProps('emailPath')}
          />
          <TextInput
            withAsterisk
            label={'Username Path'}
            placeholder={'Username Path'}
            description={
              'The Path to use to extract the username from the Info URL response (https://serdejsonpath.live)'
            }
            {...form.getInputProps('usernamePath')}
          />
        </Group>

        <Group grow>
          <TextInput
            label={'First Name Path'}
            placeholder={'First Name URL'}
            description={
              'The Path to use to extract the first name from the Info URL response (https://serdejsonpath.live)'
            }
            {...form.getInputProps('nameFirstPath')}
          />
          <TextInput
            label={'Last Name Path'}
            placeholder={'Last Name Path'}
            description={
              'The Path to use to extract the last name from the Info URL response (https://serdejsonpath.live)'
            }
            {...form.getInputProps('nameLastPath')}
          />
        </Group>

        <Group grow>
          <Switch label={'Enabled'} {...form.getInputProps('enabled')} />
          <Switch label={'Only allow Login'} {...form.getInputProps('loginOnly')} />
        </Group>

        <Group grow>
          <Switch
            label={'Link Viewable to User'}
            description={'Allows the User to see the Connection and its identifier in the Client UI'}
            {...form.getInputProps('linkViewable')}
          />
          <Switch
            label={'Link Manageable by User'}
            description={'Allows the User to connect and disconnect with this provider'}
            {...form.getInputProps('userManageable')}
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
            <>
              <ContextMenuProvider menuProps={{ position: 'top', offset: 40 }}>
                <ContextMenu
                  items={[
                    {
                      icon: faFileDownload,
                      label: 'as JSON',
                      onClick: () => doExport('json'),
                      color: 'gray',
                    },
                    {
                      icon: faFileDownload,
                      label: 'as YAML',
                      onClick: () => doExport('yaml'),
                      color: 'gray',
                    },
                  ]}
                >
                  {({ openMenu }) => (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        openMenu(rect.left, rect.bottom);
                      }}
                      loading={loading}
                      variant={'outline'}
                      rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                    >
                      Export
                    </Button>
                  )}
                </ContextMenu>
              </ContextMenuProvider>
              <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
                Delete
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </>
  );
};
