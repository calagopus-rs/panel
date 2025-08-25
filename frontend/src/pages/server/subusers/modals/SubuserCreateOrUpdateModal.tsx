import Captcha from '@/elements/Captcha';
import { useRef, useState } from 'react';
import PermissionSelector from '../PermissionSelector';
import { Group, ModalProps, Stack, TagsInput } from '@mantine/core';
import Modal from '@/elements/modals/Modal';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';

type Props = ModalProps & {
  subuser?: ServerSubuser;
  onCreate?: (email: string, permissions: string[], ignoredFiles: string[], captcha: string) => void;
  onUpdate?: (permissions: string[], ignoredFiles: string[]) => void;
};

export default ({ subuser, onCreate, onUpdate, opened, onClose }: Props) => {
  const [email, setEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set(subuser?.permissions ?? []));
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>(subuser?.ignoredFiles ?? []);
  const captchaRef = useRef(null);

  const doCreateOrUpdate = () => {
    if (subuser && onUpdate) {
      onUpdate(Array.from(selectedPermissions), ignoredFiles);
      return;
    }

    captchaRef.current?.getToken().then((token) => {
      onCreate(email, Array.from(selectedPermissions), ignoredFiles, token);
    });
  };

  return (
    <Modal title={subuser ? 'Update Subuser' : 'Create Subuser'} onClose={onClose} opened={opened} size={'xl'}>
      <Stack>
        {subuser ? (
          <TextInput label={'Username'} placeholder={'Username'} value={subuser.user.username} disabled />
        ) : (
          <TextInput
            label={'Email'}
            placeholder={'Enter the email that this subuser should be saved as.'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <div>
          <label>Permissions</label>
          <PermissionSelector
            selectedPermissions={selectedPermissions}
            setSelectedPermissions={setSelectedPermissions}
          />
        </div>

        <TagsInput
          label={'Ignored Files'}
          placeholder={'Ignored Files'}
          value={ignoredFiles || []}
          onChange={(e) => setIgnoredFiles(e)}
        />

        {!subuser && <Captcha ref={captchaRef} />}

        <Group>
          <Button onClick={doCreateOrUpdate}>{subuser ? 'Update' : 'Create'}</Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
