import { Group, ModalProps, Stack, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import Button from '@/elements/Button.tsx';
import Captcha, { CaptchaRef } from '@/elements/Captcha.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import PermissionSelector from '@/elements/PermissionSelector.tsx';
import { serverSubuserCreateSchema } from '@/lib/schemas/server/subusers.ts';
import { useGlobalStore } from '@/stores/global.ts';

type Props = ModalProps & {
  subuser?: ServerSubuser;
  onCreate?: (email: string, permissions: string[], ignoredFiles: string[], captcha: string | null) => void;
  onUpdate?: (permissions: string[], ignoredFiles: string[]) => void;
};

export default function SubuserCreateOrUpdateModal({ subuser, onCreate, onUpdate, opened, onClose }: Props) {
  const { availablePermissions } = useGlobalStore();

  const captchaRef = useRef<CaptchaRef>(null);

  const form = useForm<z.infer<typeof serverSubuserCreateSchema>>({
    initialValues: {
      email: '',
      permissions: [],
      ignoredFiles: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverSubuserCreateSchema),
  });

  useEffect(() => {
    if (subuser) {
      form.setValues({
        email: 'unknown@email.com',
        permissions: subuser.permissions,
        ignoredFiles: subuser.ignoredFiles,
      });
    }
  }, [subuser]);

  const doCreateOrUpdate = () => {
    if (subuser && onUpdate) {
      onUpdate(Array.from(form.values.permissions), form.values.ignoredFiles);
      return;
    }

    captchaRef.current?.getToken().then((token) => {
      onCreate!(form.values.email, Array.from(form.values.permissions), form.values.ignoredFiles, token);
    });
  };

  return (
    <Modal title={subuser ? 'Update Subuser' : 'Create Subuser'} onClose={onClose} opened={opened} size='xl'>
      <form onSubmit={form.onSubmit(() => doCreateOrUpdate())}>
        <Stack>
          {subuser ? (
            <TextInput label='Username' placeholder='Username' value={subuser.user.username} disabled />
          ) : (
            <TextInput
              label='Email'
              placeholder='Enter the email that this subuser should be saved as.'
              {...form.getInputProps('email')}
            />
          )}

          <PermissionSelector
            label='Permissions'
            permissionsMapType='serverPermissions'
            permissions={availablePermissions.serverPermissions}
            selectedPermissions={form.values.permissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('permissions', permissions)}
          />

          <TagsInput label='Ignored Files' placeholder='Ignored Files' {...form.getInputProps('ignoredFiles')} />

          {!subuser && <Captcha ref={captchaRef} />}

          <Group>
            <Button type='submit' disabled={!form.isValid()}>
              {subuser ? 'Update' : 'Create'}
            </Button>
            <Button variant='default' onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
